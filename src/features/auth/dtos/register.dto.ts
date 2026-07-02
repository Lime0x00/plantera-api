import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterRequestDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty({ message: 'First name is required.' })
  @IsString({ message: 'First name must be a string.' })
  firstName!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty({ message: 'Last name is required.' })
  @IsString({ message: 'Last name must be a string.' })
  lastName!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty({ message: 'Username is required.' })
  @IsString({ message: 'Username must be a string.' })
  userName!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty({ message: 'Email is required.' })
  @IsEmail({}, { message: 'Must be a valid email format.' })
  email!: string;

  @IsNotEmpty({ message: 'Password is required.' })
  @MinLength(8, { message: 'Must be at least 8 characters.' })
  password!: string;
}
