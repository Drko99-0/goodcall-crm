import { Module } from '@nestjs/common';
import { GoalsService } from './goals.service';
import { GoalsController } from './goals.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [GoalsController],
    providers: [GoalsService],
    exports: [GoalsService],
})
export class GoalsModule {}
