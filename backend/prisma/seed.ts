import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const passwordHash = await bcrypt.hash('A@12345678', 12);

    // Crear usuario developer inicial
    const developer = await prisma.user.upsert({
        where: { username: 'drko' },
        update: {},
        create: {
            username: 'drko',
            email: 'drko@goodcall.com',
            passwordHash: passwordHash,
            firstName: 'Admin',
            lastName: 'GoodCall',
            role: UserRole.developer,
            mustChangePassword: true,
            isActive: true,
        },
    });

    console.log({ developer });

    // Crear compañías iniciales de ejemplo
    const companies = [
        { name: 'Movistar', code: 'MOV' },
        { name: 'Vodafone', code: 'VOD' },
        { name: 'Orange', code: 'ORA' },
        { name: 'MasMovil', code: 'MAS' },
    ];

    for (const company of companies) {
        await prisma.company.upsert({
            where: { name: company.name },
            update: {},
            create: {
                name: company.name,
                code: company.code,
            },
        });
    }

    // Crear estados de venta iniciales
    const statuses = [
        { name: 'Pendiente', code: 'PEND', color: '#FFA500', isActiveStatus: true },
        { name: 'Firmado', code: 'FIRM', color: '#008000', isActiveStatus: true },
        { name: 'Instalado', code: 'INST', color: '#0000FF', isFinal: true },
        { name: 'Cancelado', code: 'CANC', color: '#FF0000', isFinal: true },
    ];

    for (const status of statuses) {
        await prisma.saleStatus.upsert({
            where: { name: status.name },
            update: {},
            create: {
                name: status.name,
                code: status.code,
                color: status.color,
                isActiveStatus: status.isActiveStatus,
                isFinal: status.isFinal,
            },
        });
    }

    console.log('Seed completado ✅');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
