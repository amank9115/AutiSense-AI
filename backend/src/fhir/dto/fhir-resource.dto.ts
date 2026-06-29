import { IsString, IsObject, IsOptional } from 'class-validator';

export class FhirResourceDto {
  @IsString()
  resourceType: string;

  @IsOptional()
  @IsString()
  id?: string;

  @IsObject()
  resource: Record<string, any>;
}
