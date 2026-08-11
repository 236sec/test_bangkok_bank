import {
  ValidateIf,
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
} from 'class-validator';

export class PatchCollectionDto {
  @ValidateIf((o: PatchCollectionDto) => o.name !== undefined)
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  name?: string;
}
