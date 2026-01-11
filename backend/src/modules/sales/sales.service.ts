import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateSaleDto, UpdateSaleDto, QuerySalesDto } from './dto/sale.dto';

@Injectable()
export class SalesService {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(query?: QuerySalesDto) {
        const { asesorId, startDate, endDate, page = 1, limit = 100 } = query || {};

        const where: any = {
            deletedAt: null,
        };

        if (asesorId) {
            where.asesorId = asesorId;
        }

        if (startDate || endDate) {
            where.saleDate = {};
            if (startDate) {
                where.saleDate.gte = new Date(startDate);
            }
            if (endDate) {
                where.saleDate.lte = new Date(endDate);
            }
        }

        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.prisma.sale.findMany({
                where,
                include: {
                    asesor: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            username: true,
                        },
                    },
                    company: true,
                    companySold: true,
                    technology: true,
                    saleStatus: true,
                },
                orderBy: { saleDate: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.sale.count({ where }),
        ]);

        if (page && limit) {
            return {
                data,
                total,
                page,
                limit,
            };
        }

        return data;
    }

    async findOne(id: string) {
        const sale = await this.prisma.sale.findUnique({
            where: { id },
            include: {
                asesor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        username: true,
                    },
                },
                company: true,
                companySold: true,
                technology: true,
                saleStatus: true,
            },
        });

        if (!sale || sale.deletedAt) {
            throw new NotFoundException('Sale not found');
        }

        return sale;
    }

    async create(createSaleDto: CreateSaleDto) {
        return this.prisma.sale.create({
            data: {
                ...createSaleDto,
                saleDate: new Date(createSaleDto.saleDate),
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            include: {
                asesor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        username: true,
                    },
                },
                company: true,
                companySold: true,
                technology: true,
                saleStatus: true,
            },
        });
    }

    async update(id: string, updateSaleDto: UpdateSaleDto) {
        const existing = await this.prisma.sale.findUnique({
            where: { id },
        });

        if (!existing || existing.deletedAt) {
            throw new NotFoundException('Sale not found');
        }

        const data: any = { ...updateSaleDto };
        if (updateSaleDto.saleDate) {
            data.saleDate = new Date(updateSaleDto.saleDate);
        }

        return this.prisma.sale.update({
            where: { id },
            data: {
                ...data,
                updatedAt: new Date(),
            },
            include: {
                asesor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        username: true,
                    },
                },
                company: true,
                companySold: true,
                technology: true,
                saleStatus: true,
            },
        });
    }

    async remove(id: string) {
        const existing = await this.prisma.sale.findUnique({
            where: { id },
        });

        if (!existing || existing.deletedAt) {
            throw new NotFoundException('Sale not found');
        }

        return this.prisma.sale.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                updatedAt: new Date(),
            },
        });
    }
}
