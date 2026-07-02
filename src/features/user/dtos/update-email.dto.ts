import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class SendEmailOtpDto {
  @IsEmail({}, { message: 'A valid email address is required.' })
  @IsNotEmpty({ message: 'Email is required.' })
  newEmail!: string;
}

export class VerifyEmailOtpDto {
  @IsEmail({}, { message: 'A valid email address is required.' })
  @IsNotEmpty({ message: 'Email is required.' })
  newEmail!: string;

  @IsString()
  @IsNotEmpty({ message: 'OTP code is required.' })
  @Length(6, 6, { message: 'OTP code must be exactly 6 characters.' })
  code!: string;
}
