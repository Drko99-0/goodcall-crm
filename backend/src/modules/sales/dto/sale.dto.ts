import { IsString, IsOptional, IsDate, IsArray, IsUUID, IsDateString, IsInt } from 'class-validator';

export class CreateSaleDto {
    @IsUUID()
    asesorId: string;

    @IsUUID()
    companyId: string;

    @IsOptional()
    @IsUUID()
    companySoldId?: string;

    @IsOptional()
    @IsUUID()
    technologyId?: string;

    @IsOptional()
    @IsUUID()
    saleStatusId?: string;

    @IsDateString()
    saleDate: string;

    @IsString()
    clientName: string;

    @IsOptional()
    @IsString()
    clientDni?: string;

    @IsOptional()
    @IsString()
    clientPhone?: string;

    @IsOptional()
    @IsUUID()
    cerradorId?: string;

    @IsOptional()
    @IsUUID()
    fidelizadorId?: string;

    @IsOptional()
    @IsString()
    extraInfo?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsArray()
    products?: any[];
}

export class UpdateSaleDto {
    @IsOptional()
    @IsUUID()
    asesorId?: string;

    @IsOptional()
    @IsUUID()
    companyId?: string;

    @IsOptional()
    @IsUUID()
    companySoldId?: string;

    @IsOptional()
    @IsUUID()
    technologyId?: string;

    @IsOptional()
    @IsUUID()
    saleStatusId?: string;

    @IsOptional()
    @IsDateString()
    saleDate?: string;

    @IsOptional()
    @IsString()
    clientName?: string;

    @IsOptional()
    @IsString()
    clientDni?: string;

    @IsOptional()
    @IsString()
    clientPhone?: string;

    @IsOptional()
    @IsUUID()
    cerradorId?: string;

    @IsOptional()
    @IsUUID()
    fidelizadorId?: string;

    @IsOptional()
    @IsString()
    extraInfo?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsArray()
    products?: any[];
}

export class QuerySalesDto {
    @IsOptional()
    @IsUUID()
    asesorId?: string;

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsOptional()
    @IsInt()
    page?: number;

    @IsOptional()
    @IsInt()
    limit?: number;
}
