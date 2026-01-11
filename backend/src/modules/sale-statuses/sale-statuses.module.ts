import { Module } from '@nestjs/common';
import { SaleStatusesService } from './sale-statuses.service';
import { SaleStatusesController } from './sale-statuses.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [SaleStatusesController],
    providers: [SaleStatusesService],
    exports: [SaleStatusesService],
})
export class SaleStatusesModule {}
