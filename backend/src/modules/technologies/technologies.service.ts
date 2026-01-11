import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class TechnologiesService {
    constructor(private readonly prisma: PrismaService) {}

    async findAll() {
        return this.prisma.technology.findMany({
            orderBy: { displayOrder: 'asc' },
        });
    }

    async findOne(id: string) {
        return this.prisma.technology.findUnique({
            where: { id },
        });
    }
}
