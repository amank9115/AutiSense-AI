import { IsString, IsUrl, IsNotEmpty } from 'class-validator';

export class IngestDto {
  @IsString()
  @IsNotEmpty()
  documentId: string;

  @IsUrl()
  @IsNotEmpty()
  fileUrl: string;

  @IsString()
  @IsNotEmpty()
  mimetype: string;
}
