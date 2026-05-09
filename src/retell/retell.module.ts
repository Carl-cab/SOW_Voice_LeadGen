import { Module } from '@nestjs/common';
import { RetellService } from './retell.service';

@Module({
  providers: [RetellService],
  exports: [RetellService],
})
export class RetellModule {}
