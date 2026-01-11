import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private prisma: PrismaService,
    ) { }

    async login(loginDto: LoginDto) {
        const { username, password } = loginDto;
        const user = await this.usersService.findByUsername(username);

        if (!user) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        if (!user.isActive) {
            throw new ForbiddenException('Cuenta desactivada');
        }

        if (user.isLocked) {
            throw new ForbiddenException('Cuenta bloqueada. Contacte a soporte.');
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            await this.handleFailedLogin(user.id);
            throw new UnauthorizedException('Credenciales inválidas');
        }

        // Resetear intentos fallidos
        await this.prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0 },
        });

        const payload = { sub: user.id, username: user.username, role: user.role };

        return {
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                mustChangePassword: user.mustChangePassword,
            },
            accessToken: this.jwtService.sign(payload),
            refreshToken: this.jwtService.sign(payload, {
                expiresIn: '7d',
            }),
        };
    }

    private async handleFailedLogin(userId: string) {
        const maxAttempts = this.configService.get<number>('MAX_LOGIN_ATTEMPTS') || 5;

        const user = await this.prisma.user.update({
            where: { id: userId },
            data: {
                failedLoginAttempts: {
                    increment: 1,
                },
            },
        });

        if (user.failedLoginAttempts >= maxAttempts) {
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    isLocked: true,
                    lockedAt: new Date(),
                },
            });
        }
    }

    async validateUser(payload: any) {
        return this.usersService.findOne(payload.sub);
    }
}
