import { Controller, Get, Param } from '@nestjs/common';
import { SaleStatusesService } from './sale-statuses.service';

@Controller('sale-statuses')
export class SaleStatusesController {
    constructor(private readonly saleStatusesService: SaleStatusesService) {}

    @Get()
    findAll() {
        return this.saleStatusesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.saleStatusesService.findOne(id);
    }
}
