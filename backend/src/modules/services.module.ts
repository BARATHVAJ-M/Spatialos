import { Module } from '@nestjs/common';
import { DefinitionsModule } from './definitions.module';
import { InstancesModule } from './instances.module';

@Module({
  imports: [DefinitionsModule, InstancesModule]
})
export class ServicesModule {}
