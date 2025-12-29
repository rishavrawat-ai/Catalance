import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'manager@example.com';
    console.log(`Checking user: ${email}...`);

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            console.log('User not found!');
            return;
        }

        console.log('User found. Current status:', user.status, 'Verified:', user.isVerified);

        const updatedUser = await prisma.user.update({
            where: { email },
            data: {
                status: 'ACTIVE',
                isVerified: true
            }
        });

        console.log('User updated successfully.');
        console.log('New status:', updatedUser.status);
        console.log('Verified:', updatedUser.isVerified);

    } catch (e) {
        console.error('Error updating user:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
