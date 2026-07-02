import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordRequestDto {
  @IsNotEmpty({ message: 'Email is required.' })
  @IsEmail({}, { message: 'Must be a valid email format.' })
  email!: string;
}
