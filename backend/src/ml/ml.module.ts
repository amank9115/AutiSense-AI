import { Module } from '@nestjs/common';
import { MlService } from './ml.service';
import { MlController } from './ml.controller';
import { ConfigModule } from '../config/config.module';
import { CircuitBreakerModule } from '../common/circuit-breaker/circuit-breaker.module';

@Module({
  imports: [ConfigModule, CircuitBreakerModule],
  controllers: [MlController],
  providers: [MlService],
  exports: [MlService],
})
export class MlModule {}
