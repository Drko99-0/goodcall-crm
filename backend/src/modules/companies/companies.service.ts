import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto';

@Injectable()
export class CompaniesService {
    constructor(private readonly prisma: PrismaService) {}

    async findAll() {
        return this.prisma.company.findMany({
            orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        });
    }

    async findOne(id: string) {
        const company = await this.prisma.company.findUnique({
            where: { id },
        });

        if (!company) {
            throw new NotFoundException('Company not found');
        }

        return company;
    }

    async create(createCompanyDto: CreateCompanyDto) {
        return this.prisma.company.create({
            data: {
                ...createCompanyDto,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });
    }

    async update(id: string, updateCompanyDto: UpdateCompanyDto) {
        const existing = await this.prisma.company.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new NotFoundException('Company not found');
        }

        return this.prisma.company.update({
            where: { id },
            data: {
                ...updateCompanyDto,
                updatedAt: new Date(),
            },
        });
    }
}
