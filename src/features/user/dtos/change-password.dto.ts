import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordRequestDto {
  @IsNotEmpty({ message: 'Current password is required.' })
  @IsString({ message: 'Current password must be a string.' })
  currentPassword!: string;

  @IsNotEmpty({ message: 'New password is required.' })
  @MinLength(8, { message: 'New password must be at least 8 characters.' })
  newPassword!: string;
}
