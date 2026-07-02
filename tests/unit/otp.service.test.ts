import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OtpService } from '#features/auth/otp.service';
import type { IOtpRepository } from '#features/auth/otp.repository.interface';
import type { IChannelDriver } from '#infrastructure/channel/channel.interface';
import { OtpType } from '#features/auth/otp-type';
import type { OtpModel } from '#features/auth/domain/otp.model';
import { config } from '#common/helpers/config';

vi.mock('#common/helpers/config', () => ({
  config: vi.fn(),
}));

function makeOtpModel(overrides: Partial<OtpModel> = {}): OtpModel {
  return {
    id: 1,
    email: 'test@plantera.com',
    code: '123456',
    type: OtpType.PASSWORD_RESET,
    channel: 'email',
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    usedAt: undefined,
    createdAt: new Date(),
    deletedAt: undefined,
    ...overrides,
  } as unknown as OtpModel;
}

describe('OtpService', () => {
  let otpService: OtpService;
  let mockRepo: IOtpRepository;
  let mockChannel: IChannelDriver;

  beforeEach(() => {
    vi.mocked(config).mockReturnValue(100000);
    vi.mocked(config).mockReturnValue(999999);
    vi.mocked(config).mockReturnValue(5);
    vi.mocked(config).mockReturnValue(5);

    mockRepo = {
      create: vi.fn().mockResolvedValue(makeOtpModel()),
      findValid: vi.fn().mockResolvedValue(makeOtpModel()),
      update: vi.fn().mockResolvedValue(makeOtpModel({ usedAt: new Date() })),
    } as unknown as IOtpRepository;

    mockChannel = {
      send: vi.fn().mockResolvedValue(undefined),
    } as unknown as IChannelDriver;

    otpService = new OtpService({
      repositories: { otpRepository: mockRepo },
      channels: { email: mockChannel },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generate', () => {
    it('should generate a code within the configured range', async () => {
      const mockConfig = vi.mocked(config);
      mockConfig.mockImplementation((key: string, fallback?: unknown) => {
        const map: Record<string, unknown> = {
          'auth.otpCodeMin': 100000,
          'auth.otpCodeMax': 999999,
          'auth.otpTtlMinutes': 5,
        };
        return (key in map ? map[key] : fallback) as number;
      });

      const code = await otpService.generate('test@plantera.com');

      const codeNum = parseInt(code, 10);
      expect(codeNum).toBeGreaterThanOrEqual(100000);
      expect(codeNum).toBeLessThanOrEqual(999999);
      expect(mockRepo.create).toHaveBeenCalledTimes(1);
    });

    it('should store the OTP with correct type, email, and expiry', async () => {
      const mockConfig = vi.mocked(config);
      mockConfig.mockImplementation((key: string, fallback?: unknown) => {
        const map: Record<string, unknown> = {
          'auth.otpCodeMin': 100000,
          'auth.otpCodeMax': 999999,
          'auth.otpTtlMinutes': 5,
        };
        return (key in map ? map[key] : fallback) as number;
      });

      await otpService.generate('user@plantera.com');

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'user@plantera.com',
            type: OtpType.PASSWORD_RESET,
            channel: 'email',
          }),
        })
      );
      const createCall = vi.mocked(mockRepo.create).mock.calls[0][0] as {
        data: { expiresAt: Date };
      };
      expect(createCall.data.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('should send the code through the channel driver', async () => {
      const mockConfig = vi.mocked(config);
      mockConfig.mockImplementation((key: string, fallback?: unknown) => {
        const map: Record<string, unknown> = {
          'auth.otpCodeMin': 100000,
          'auth.otpCodeMax': 999999,
          'auth.otpTtlMinutes': 5,
        };
        return (key in map ? map[key] : fallback) as number;
      });

      const code = await otpService.generate('user@plantera.com');

      expect(mockChannel.send).toHaveBeenCalledWith(
        'user@plantera.com',
        expect.objectContaining({
          subject: expect.stringContaining('Password Reset'),
          template: 'reset-password',
          templateData: expect.objectContaining({ otp: code }),
        })
      );
    });

    it('should accept custom type and TTL', async () => {
      const mockConfig = vi.mocked(config);
      mockConfig.mockImplementation((key: string, fallback?: unknown) => {
        const map: Record<string, unknown> = {
          'auth.otpCodeMin': 100000,
          'auth.otpCodeMax': 999999,
        };
        return (key in map ? map[key] : fallback) as number;
      });

      await otpService.generate('user@plantera.com', OtpType.RESET_TOKEN, 10);
      const createCall = vi.mocked(mockRepo.create).mock.calls[0][0] as {
        data: { type: string; expiresAt: Date };
      };
      expect(createCall.data.type).toBe(OtpType.RESET_TOKEN);
      const expectedExpiry = Date.now() + 10 * 60 * 1000;
      expect(createCall.data.expiresAt.getTime()).toBeGreaterThan(
        expectedExpiry - 100
      );
    });
  });

  describe('verify', () => {
    it('should return true for a valid OTP and mark it used', async () => {
      const result = await otpService.verify('test@plantera.com', '123456');

      expect(result).toBe(true);
      expect(mockRepo.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({ usedAt: expect.any(Date) }),
        })
      );
    });

    it('should return false when no matching OTP found', async () => {
      vi.mocked(mockRepo.findValid).mockResolvedValue(null);

      const result = await otpService.verify('test@plantera.com', 'wrong');

      expect(result).toBe(false);
      expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it('should pass the correct type to findValid', async () => {
      await otpService.verify(
        'test@plantera.com',
        '123456',
        OtpType.RESET_TOKEN
      );

      expect(mockRepo.findValid).toHaveBeenCalledWith(
        'test@plantera.com',
        '123456',
        OtpType.RESET_TOKEN
      );
    });
  });

  describe('storeResetToken', () => {
    it('should store a reset token with RESET_TOKEN type and expiry', async () => {
      const mockConfig = vi.mocked(config);
      mockConfig.mockReturnValue(5);

      await otpService.storeResetToken('test@plantera.com', 'token-abc');

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'test@plantera.com',
            code: 'token-abc',
            type: OtpType.RESET_TOKEN,
            channel: 'email',
          }),
        })
      );
    });
  });

  describe('verifyResetToken', () => {
    it('should return true for a valid reset token', async () => {
      const result = await otpService.verifyResetToken(
        'test@plantera.com',
        'valid-token'
      );

      expect(result).toBe(true);
    });

    it('should return false for an invalid reset token', async () => {
      vi.mocked(mockRepo.findValid).mockResolvedValue(null);

      const result = await otpService.verifyResetToken(
        'test@plantera.com',
        'invalid-token'
      );

      expect(result).toBe(false);
    });
  });
});
