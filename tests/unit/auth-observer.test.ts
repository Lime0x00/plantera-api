import { describe, it, expect, vi, afterEach } from 'vitest';
import { AuthObserver } from '#features/auth/observers/auth.observer';
import type { MailService } from '#infrastructure/mail/mail.service';
import type { CacheService } from '#infrastructure/cache/cache.service';
import type { User } from '#features/user/domain';
import { ContextService } from '#framework/context/context.service';

describe('AuthObserver', () => {
  const mockMailService = {
    queueTemplate: vi.fn().mockResolvedValue(undefined),
  } as unknown as MailService;

  const mockCacheStore: Record<string, any> = {};
  const mockCacheService = {
    get: vi.fn().mockImplementation(async (key: string) => mockCacheStore[key]),
    set: vi.fn().mockImplementation(async (key: string, value: any) => {
      mockCacheStore[key] = value;
    }),
  } as unknown as CacheService;

  const user = {
    id: 123,
    email: 'test@plantera.com',
    firstName: 'John',
    lastName: 'Doe',
    lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
  } as unknown as User;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should not notify when logging in for the first time (no cached IP)', async () => {
    vi.spyOn(ContextService, 'ip').mockReturnValue('192.168.1.1');
    const observer = new AuthObserver(mockMailService, mockCacheService);

    await observer.onLoginSuccess(user);

    expect(mockCacheService.set).toHaveBeenCalledWith(
      'user:123:last_ip',
      '192.168.1.1',
      expect.any(Number)
    );
    expect(mockMailService.queueTemplate).not.toHaveBeenCalled();
  });

  it('should not notify when logging in from the same IP', async () => {
    vi.spyOn(ContextService, 'ip').mockReturnValue('192.168.1.1');
    mockCacheStore['user:123:last_ip'] = '192.168.1.1';
    const observer = new AuthObserver(mockMailService, mockCacheService);

    await observer.onLoginSuccess(user);

    expect(mockMailService.queueTemplate).not.toHaveBeenCalled();
  });

  it('should notify and update cache when logging in from a different IP', async () => {
    vi.spyOn(ContextService, 'ip').mockReturnValue('10.0.0.5');
    mockCacheStore['user:123:last_ip'] = '192.168.1.1';
    const observer = new AuthObserver(mockMailService, mockCacheService);

    await observer.onLoginSuccess(user);

    expect(mockMailService.queueTemplate).toHaveBeenCalledWith(
      'test@plantera.com',
      'Security Alert: New login detected',
      'security-alert',
      expect.objectContaining({
        firstName: 'John',
        reason: expect.stringContaining('10.0.0.5'),
      })
    );
    expect(mockCacheService.set).toHaveBeenCalledWith(
      'user:123:last_ip',
      '10.0.0.5',
      expect.any(Number)
    );
  });

  it('should notify on account lockout', async () => {
    const observer = new AuthObserver(mockMailService, mockCacheService);

    await observer.updated(user);

    expect(mockMailService.queueTemplate).toHaveBeenCalledWith(
      'test@plantera.com',
      'Your account has been temporarily locked',
      'security-alert',
      expect.objectContaining({
        firstName: 'John',
        reason: 'Too many failed login attempts.',
        lockedUntil: expect.any(String),
      })
    );
  });
});
