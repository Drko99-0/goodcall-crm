import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async create(createUserDto: CreateUserDto) {
        const { password, ...userData } = createUserDto;

        // Verificar si el usuario o email ya existen
        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { username: userData.username },
                    { email: userData.email },
                ],
            },
        });

        if (existingUser) {
            throw new ConflictException('El nombre de usuario o el email ya están en uso');
        }

        // Hash de la contraseña
        const passwordHash = await bcrypt.hash(password, 12);

        return this.prisma.user.create({
            data: {
                ...userData,
                passwordHash,
            },
            select: {
                id: true,
                username: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true,
            },
        });
    }

    async findAll() {
        return this.prisma.user.findMany({
            select: {
                id: true,
                username: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                isLocked: true,
            },
        });
    }

    async findOne(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                coordinator: true,
                asesores: true,
            },
        });

        if (!user) {
            throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
        }

        return user;
    }

    async findByUsername(username: string) {
        return this.prisma.user.findUnique({
            where: { username },
        });
    }

    async update(id: string, updateUserDto: UpdateUserDto) {
        await this.findOne(id);

        return this.prisma.user.update({
            where: { id },
            data: updateUserDto,
            select: {
                id: true,
                username: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
            },
        });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.user.delete({
            where: { id },
        });
    }
}
