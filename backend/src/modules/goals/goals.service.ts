import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateGoalDto, UpdateGoalDto, QueryGoalsDto } from './dto/goal.dto';

@Injectable()
export class GoalsService {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(query?: QueryGoalsDto) {
        const { year, month, userId, goalType } = query || {};

        const where: any = {};

        if (year) {
            where.year = year;
        }

        if (month) {
            where.month = month;
        }

        if (userId) {
            where.targetUserId = userId;
        }

        if (goalType) {
            where.goalType = goalType;
        }

        const goals = await this.prisma.goal.findMany({
            where,
            include: {
                targetUser: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        username: true,
                    },
                },
            },
            orderBy: [
                { year: 'desc' },
                { month: 'desc' },
            ],
        });

        // Calculate currentSales for each goal
        const goalsWithCurrentSales = await Promise.all(
            goals.map(async (goal) => {
                const currentSales = await this.calculateCurrentSales(
                    goal.goalType,
                    goal.targetUserId,
                    goal.year,
                    goal.month,
                );
                return {
                    ...goal,
                    currentSales,
                };
            }),
        );

        return goalsWithCurrentSales;
    }

    async findOne(id: string) {
        const goal = await this.prisma.goal.findUnique({
            where: { id },
            include: {
                targetUser: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        username: true,
                    },
                },
            },
        });

        if (!goal) {
            throw new NotFoundException('Goal not found');
        }

        const currentSales = await this.calculateCurrentSales(
            goal.goalType,
            goal.targetUserId,
            goal.year,
            goal.month,
        );

        return {
            ...goal,
            currentSales,
        };
    }

    async create(createGoalDto: CreateGoalDto) {
        return this.prisma.goal.create({
            data: {
                ...createGoalDto,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            include: {
                targetUser: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        username: true,
                    },
                },
            },
        });
    }

    async update(id: string, updateGoalDto: UpdateGoalDto) {
        const existing = await this.prisma.goal.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new NotFoundException('Goal not found');
        }

        return this.prisma.goal.update({
            where: { id },
            data: {
                ...updateGoalDto,
                updatedAt: new Date(),
            },
            include: {
                targetUser: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        username: true,
                    },
                },
            },
        });
    }

    private async calculateCurrentSales(
        goalType: string,
        targetUserId: string | null,
        year: number,
        month: number,
    ): Promise<number> {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const where: any = {
            saleDate: {
                gte: startDate,
                lte: endDate,
            },
            deletedAt: null,
        };

        if (goalType === 'asesor' && targetUserId) {
            where.asesorId = targetUserId;
        } else if (goalType === 'coordinador' && targetUserId) {
            // Get all advisors under this coordinator
            const asesores = await this.prisma.user.findMany({
                where: {
                    coordinatorId: targetUserId,
                    deletedAt: null,
                },
                select: { id: true },
            });

            where.asesorId = {
                in: asesores.map((a) => a.id),
            };
        }

        return this.prisma.sale.count({ where });
    }
}
