import { Module } from '@nestjs/common';
import { CallsController } from './calls.controller';
import { CallsService } from './calls.service';
import { RetellModule } from '../retell/retell.module';

@Module({
  imports: [RetellModule],
  controllers: [CallsController],
  providers: [CallsService],
  exports: [CallsService],
})
export class CallsModule {}
