import { IsUUID } from 'class-validator';

export class ShareReportDto {
  @IsUUID()
  doctorId: string;
}
