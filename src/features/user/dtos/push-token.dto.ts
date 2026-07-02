import { IsNotEmpty, IsOptional, IsString, IsIn } from 'class-validator';

export class SavePushTokenDto {
  @IsNotEmpty({ message: 'Push token is required.' })
  @IsString({ message: 'Push token must be a string.' })
  token!: string;

  @IsOptional()
  @IsString()
  @IsIn(['expo', 'web'], {
    message: 'Push platform must be either "expo" or "web".',
  })
  platform?: string;
}
