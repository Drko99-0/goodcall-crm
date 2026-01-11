import { Module } from '@nestjs/common';
import { TechnologiesService } from './technologies.service';
import { TechnologiesController } from './technologies.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [TechnologiesController],
    providers: [TechnologiesService],
    exports: [TechnologiesService],
})
export class TechnologiesModule {}
