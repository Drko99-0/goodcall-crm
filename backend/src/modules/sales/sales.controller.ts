import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto, UpdateSaleDto, QuerySalesDto } from './dto/sale.dto';

@Controller('sales')
export class SalesController {
    constructor(private readonly salesService: SalesService) {}

    @Get()
    findAll(@Query() query?: QuerySalesDto) {
        return this.salesService.findAll(query);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.salesService.findOne(id);
    }

    @Post()
    create(@Body() createSaleDto: CreateSaleDto) {
        return this.salesService.create(createSaleDto);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateSaleDto: UpdateSaleDto) {
        return this.salesService.update(id, updateSaleDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.salesService.remove(id);
    }
}
