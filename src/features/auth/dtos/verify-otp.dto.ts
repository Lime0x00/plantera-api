import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyOtpRequestDto {
  @IsNotEmpty({ message: 'Email is required.' })
  @IsEmail({}, { message: 'Must be a valid email format.' })
  email!: string;

  @IsNotEmpty({ message: 'OTP code is required.' })
  @IsString({ message: 'OTP code must be a string.' })
  @Length(6, 6, { message: 'OTP code must be exactly 6 digits.' })
  otp!: string;
}
