import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class NotificationsService {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(userId: string) {
        return this.prisma.notification.findMany({
            where: {
                userId,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async findOne(id: string) {
        const notification = await this.prisma.notification.findUnique({
            where: { id },
        });

        if (!notification) {
            throw new NotFoundException('Notification not found');
        }

        return notification;
    }

    async markAsRead(id: string) {
        const existing = await this.prisma.notification.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new NotFoundException('Notification not found');
        }

        return this.prisma.notification.update({
            where: { id },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });
    }

    async remove(id: string) {
        const existing = await this.prisma.notification.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new NotFoundException('Notification not found');
        }

        return this.prisma.notification.delete({
            where: { id },
        });
    }

    async create(userId: string, data: {
        type: string;
        title: string;
        message: string;
        relatedEntityType?: string;
        relatedEntityId?: string;
        actionUrl?: string;
    }) {
        return this.prisma.notification.create({
            data: {
                userId,
                ...data,
            },
        });
    }
}
