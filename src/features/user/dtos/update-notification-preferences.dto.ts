import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationPreferencesRequestDto {
  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  wateringReminders?: boolean;

  @IsOptional()
  @IsBoolean()
  fertilizingReminders?: boolean;

  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;
}
