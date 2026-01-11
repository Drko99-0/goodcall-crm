import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SaleStatusesService {
    constructor(private readonly prisma: PrismaService) {}

    async findAll() {
        return this.prisma.saleStatus.findMany({
            orderBy: { displayOrder: 'asc' },
        });
    }

    async findOne(id: string) {
        return this.prisma.saleStatus.findUnique({
            where: { id },
        });
    }
}
