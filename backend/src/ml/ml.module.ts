import { Module } from '@nestjs/common';
import { MlService } from './ml.service';
import { MlController } from './ml.controller';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [ConfigModule],
  controllers: [MlController],
  providers: [MlService],
  exports: [MlService],
})
export class MlModule {}
