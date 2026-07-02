import type { IRepositoryObserver } from '#infrastructure/database/base-repository';
import type { MailService } from '#infrastructure/mail/mail.service';
import type { User } from '#features/user/domain';

export class UserObserver implements IRepositoryObserver<User> {
  constructor(private mailService: MailService) {}

  async created(entity: User): Promise<void> {
    try {
      await this.mailService.queueTemplate(
        entity.email,
        'Welcome to Plantera!',
        'welcome',
        { firstName: entity.firstName }
      );
    } catch {
      // Email delivery is non-critical
    }
  }

  async updated(entity: User): Promise<void> {
    try {
      if (entity.lockedUntil && entity.lockedUntil.getTime() > Date.now()) {
        await this.mailService.queueTemplate(
          entity.email,
          'Your account has been temporarily locked',
          'security-alert',
          {
            firstName: entity.firstName,
            reason: 'Too many failed login attempts.',
            lockedUntil: entity.lockedUntil.toLocaleString(),
          }
        );
      }
    } catch {
      // Email delivery is non-critical
    }
  }
}
