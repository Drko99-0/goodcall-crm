import { IsString, IsOptional, IsBoolean, IsInt } from 'class-validator';

export class CreateCompanyDto {
    @IsString()
    name: string;

    @IsString()
    code: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsInt()
    displayOrder?: number;
}

export class UpdateCompanyDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    code?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsInt()
    displayOrder?: number;
}
