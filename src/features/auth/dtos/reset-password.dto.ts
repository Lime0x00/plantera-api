import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordRequestDto {
  @IsNotEmpty({ message: 'Email is required.' })
  @IsEmail({}, { message: 'Must be a valid email format.' })
  email!: string;

  @IsNotEmpty({ message: 'Reset token is required.' })
  @IsString({ message: 'Reset token must be a string.' })
  resetToken!: string;

  @IsNotEmpty({ message: 'Password is required.' })
  @MinLength(8, { message: 'Must be at least 8 characters.' })
  password!: string;
}
