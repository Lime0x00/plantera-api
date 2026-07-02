import { IsDateString, IsNotEmpty } from 'class-validator';

export class CalendarCareQueryDto {
  @IsNotEmpty({ message: 'startDate is required.' })
  @IsDateString(
    {},
    { message: 'startDate must be a valid ISO 8601 date string.' }
  )
  startDate!: string;

  @IsNotEmpty({ message: 'endDate is required.' })
  @IsDateString(
    {},
    { message: 'endDate must be a valid ISO 8601 date string.' }
  )
  endDate!: string;
}
