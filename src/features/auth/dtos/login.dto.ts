import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginRequestDto {
  @IsNotEmpty({ message: 'Email is required.' })
  @IsEmail({}, { message: 'Must be a valid email format.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  email!: string;

  @IsNotEmpty({ message: 'Password is required.' })
  @IsString({ message: 'Password must be a string.' })
  password!: string;
}
