import { Controller, Get, Param } from '@nestjs/common';
import { TechnologiesService } from './technologies.service';

@Controller('technologies')
export class TechnologiesController {
    constructor(private readonly technologiesService: TechnologiesService) {}

    @Get()
    findAll() {
        return this.technologiesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.technologiesService.findOne(id);
    }
}
