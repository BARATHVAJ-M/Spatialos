import { Module } from '@nestjs/common';
import { DefinitionsModule } from './definitions/definitions.module';
import { InstancesModule } from './instances/instances.module';

@Module({
  imports: [DefinitionsModule, InstancesModule]
})
export class ServicesModule {}
