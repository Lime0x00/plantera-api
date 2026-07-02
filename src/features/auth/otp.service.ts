import { config } from '#common/helpers';
import type { IOtpRepository } from './otp.repository.interface';
import type {
  IChannelDriver,
  ChannelPayload,
} from '#infrastructure/channel/channel.interface';
import { OtpType } from './otp-type';
import type { OtpChannel } from './auth.types';

interface OtpServiceDeps {
  repositories: { otpRepository: IOtpRepository };
  channels: Record<string, IChannelDriver>;
}

export class OtpService {
  #repository: IOtpRepository;
  #channels: Record<string, IChannelDriver>;

  constructor({ repositories: { otpRepository }, channels }: OtpServiceDeps) {
    this.#repository = otpRepository;
    this.#channels = channels;
  }

  async generate(
    email: string,
    type: OtpType = OtpType.PASSWORD_RESET,
    ttlMinutes?: number,
    channel = 'email'
  ): Promise<string> {
    const otpCodeMin = config<number>('auth.otpCodeMin', 100000);
    const otpCodeMax = config<number>('auth.otpCodeMax', 999999);
    const otpTtlMinutes = ttlMinutes ?? config<number>('auth.otpTtlMinutes', 5);
    const codeRange = otpCodeMax - otpCodeMin + 1;
    const code = Math.floor(otpCodeMin + Math.random() * codeRange).toString();
    const expiresAt = new Date(Date.now() + otpTtlMinutes * 60 * 1000);

    await this.#repository.create({
      data: {
        email,
        code,
        type,
        channel: channel as OtpChannel,
        expiresAt,
      },
    });

    const driver = this.#channels[channel];

    if (driver) {
      const payload: ChannelPayload = {
        subject:
          type === OtpType.PASSWORD_RESET
            ? 'Your Password Reset Code'
            : `Your ${type} code`,
        template: 'reset-password',
        templateData: { firstName: email.split('@')[0], otp: code },
      };
      await driver.send(email, payload);
    }

    return code;
  }

  async verify(
    email: string,
    code: string,
    type: OtpType = OtpType.PASSWORD_RESET
  ): Promise<boolean> {
    const otp = await this.#repository.findValid(email, code, type);

    if (!otp) {
      return false;
    }

    await this.#repository.update({
      where: { id: otp.id! },
      data: { usedAt: new Date() },
    });

    return true;
  }

  async storeResetToken(email: string, token: string): Promise<void> {
    const resetTokenTtlMinutes = config<number>('auth.resetTokenTtlMinutes', 5);
    const expiresAt = new Date(Date.now() + resetTokenTtlMinutes * 60 * 1000);
    await this.#repository.create({
      data: {
        email,
        code: token,
        type: OtpType.RESET_TOKEN,
        channel: 'email' as OtpChannel,
        expiresAt,
      },
    });
  }

  async verifyResetToken(email: string, token: string): Promise<boolean> {
    return this.verify(email, token, OtpType.RESET_TOKEN);
  }
}
