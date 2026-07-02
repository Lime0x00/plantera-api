import type { IAuthObserver } from './auth.observer.interface';
import type { MailService } from '#infrastructure/mail/mail.service';
import type { User } from '#features/user/domain';
import { CacheService } from '#infrastructure/cache/cache.service';
import { ContextService } from '#framework/context/context.service';
import { Logger } from '#infrastructure/observability/logger';

export class AuthObserver implements IAuthObserver {
  constructor(
    private mailService: MailService,
    private cacheService: CacheService
  ) {}

  async onLoginSuccess(user: User): Promise<void> {
    const ip = ContextService.ip();

    if (!ip) {
      return;
    }

    try {
      const cacheKey = `user:${user.id}:last_ip`;
      const lastIp = await this.cacheService.get<string>(cacheKey);

      if (lastIp && lastIp !== ip) {
        await this.mailService.queueTemplate(
          user.email,
          'Security Alert: New login detected',
          'security-alert',
          {
            firstName: user.firstName,
            reason: `A new login was detected from IP address: ${ip}`,
          }
        );
      }

      await this.cacheService.set(cacheKey, ip, 30 * 86400 * 1000); // 30 days
    } catch (err) {
      Logger.error('[AuthObserver] onLoginSuccess failed', {
        error: (err as Error).message,
      });
    }
  }

  async updated(entity: User): Promise<void> {
    try {
      await this.mailService.queueTemplate(
        entity.email,
        'Your account has been temporarily locked',
        'security-alert',
        {
          firstName: entity.firstName,
          reason: 'Too many failed login attempts.',
          lockedUntil: entity.lockedUntil
            ? entity.lockedUntil.toLocaleString()
            : new Date(Date.now() + 15 * 60 * 1000).toLocaleString(),
        }
      );
    } catch (err) {
      Logger.error('[AuthObserver] updated failed', {
        error: (err as Error).message,
      });
    }
  }
}
