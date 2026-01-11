import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto';

@Controller('companies')
export class CompaniesController {
    constructor(private readonly companiesService: CompaniesService) {}

    @Get()
    findAll() {
        return this.companiesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.companiesService.findOne(id);
    }

    @Post()
    create(@Body() createCompanyDto: CreateCompanyDto) {
        return this.companiesService.create(createCompanyDto);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateCompanyDto: UpdateCompanyDto) {
        return this.companiesService.update(id, updateCompanyDto);
    }
}
