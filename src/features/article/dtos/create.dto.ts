import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class CreateArticleDto {
  @IsString()
  title!: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}
