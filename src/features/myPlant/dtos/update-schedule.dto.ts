import { IsOptional, IsInt, Min } from 'class-validator';

export class UpdateScheduleDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  wateringFrequency?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  fertilizingFrequency?: number | null;
}
