import { Module } from '@nestjs/common';
import { FhirController } from './fhir.controller';
import { FhirMapperService } from './fhir-mapper.service';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ApiKeysModule, PrismaModule],
  controllers: [FhirController],
  providers: [FhirMapperService],
  exports: [FhirMapperService],
})
export class FhirModule {}
