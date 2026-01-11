import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { GoalsService } from './goals.service';
import { CreateGoalDto, UpdateGoalDto, QueryGoalsDto } from './dto/goal.dto';

@Controller('goals')
export class GoalsController {
    constructor(private readonly goalsService: GoalsService) {}

    @Get()
    findAll(@Query() query?: QueryGoalsDto) {
        return this.goalsService.findAll(query);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.goalsService.findOne(id);
    }

    @Post()
    create(@Body() createGoalDto: CreateGoalDto) {
        return this.goalsService.create(createGoalDto);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateGoalDto: UpdateGoalDto) {
        return this.goalsService.update(id, updateGoalDto);
    }
}
