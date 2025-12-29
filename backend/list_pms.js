
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const pms = await prisma.user.findMany({
            where: {
                role: 'PROJECT_MANAGER'
            },
            select: {
                id: true,
                fullName: true,
                email: true
            }
        });

        console.log('--- List of Project Managers ---');
        pms.forEach(pm => {
            console.log(`Name: ${pm.fullName} | Email: ${pm.email}`);
        });

    } catch (e) {
        console.error('Error fetching PMs:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
