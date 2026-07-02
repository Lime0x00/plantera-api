import { IsOptional, IsString } from 'class-validator';

export class UpdateProfileRequestDto {
  @IsOptional()
  @IsString({ message: 'First name must be a string.' })
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'Last name must be a string.' })
  lastName?: string;
}
