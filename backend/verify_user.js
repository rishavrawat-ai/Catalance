
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'kshitij@catalance.com';

    console.log(`Verifying user: ${email}...`);

    try {
        const user = await prisma.user.update({
            where: { email },
            data: {
                isVerified: true
            }
        });

        console.log(`User ${user.email} has been successfully verified! status: ${user.status}, isVerified: ${user.isVerified}`);

    } catch (e) {
        console.error('Error verifying user:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
