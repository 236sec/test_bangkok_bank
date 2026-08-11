import {
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class PatchBookmarkDto {
  @ValidateIf((o: PatchBookmarkDto) => o.url !== undefined)
  @IsString()
  @IsUrl()
  url?: string;

  @ValidateIf((o: PatchBookmarkDto) => o.title !== undefined)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ValidateIf((o: PatchBookmarkDto) => o.notes !== undefined)
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ValidateIf(
    (o: PatchBookmarkDto) =>
      o.collectionId !== undefined && o.collectionId !== null,
  )
  @IsUUID()
  collectionId?: string | null;
}
