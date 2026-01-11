import { IsString, IsOptional, IsInt, IsUUID, IsEnum } from 'class-validator';

export class CreateGoalDto {
    @IsEnum(['global', 'coordinador', 'asesor'])
    goalType: 'global' | 'coordinador' | 'asesor';

    @IsOptional()
    @IsUUID()
    targetUserId?: string;

    @IsInt()
    year: number;

    @IsInt()
    month: number;

    @IsInt()
    targetSales: number;
}

export class UpdateGoalDto {
    @IsOptional()
    @IsInt()
    targetSales?: number;
}

export class QueryGoalsDto {
    @IsOptional()
    @IsInt()
    year?: number;

    @IsOptional()
    @IsInt()
    month?: number;

    @IsOptional()
    @IsUUID()
    userId?: string;

    @IsOptional()
    @IsString()
    goalType?: string;
}
