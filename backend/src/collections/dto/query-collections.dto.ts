import { IsOptional, IsString, IsIn } from 'class-validator';

export class QueryCollectionsDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsIn(['name', 'createdAt', 'updatedAt'])
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: string;
}
