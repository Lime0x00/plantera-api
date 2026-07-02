import { IsNotEmpty, IsInt, Min, Max } from 'class-validator';

export class AddToMyPlantsDto {
  @IsNotEmpty({ message: 'Plant ID is required.' })
  @IsInt({ message: 'Plant ID must be an integer.' })
  @Min(1, { message: 'Plant ID must be at least 1.' })
  @Max(2147483647, { message: 'Plant ID is out of valid range.' })
  plantId!: number;
}
