import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = 'manager@example.com';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('Creating Project Manager...');

    try {
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                passwordHash: hashedPassword,
                role: 'PROJECT_MANAGER',
            },
            create: {
                email,
                fullName: 'Sample Project Manager',
                passwordHash: hashedPassword,
                role: 'PROJECT_MANAGER',
                bio: 'I manage disputes and projects.',
                skills: ['Management', 'Conflict Resolution']
            },
        });
        console.log('Project Manager User Ready:');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
    } catch (e) {
        console.error('Error creating user:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
