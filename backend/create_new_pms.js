import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const usersToCreate = [
        {
            email: 'rishav@catalance.com',
            fullName: 'Rishav Cata',
            bio: 'Expert in Project Management and Conflict Resolution.',
            skills: ['Leadership', 'Agile', 'Communication']
        },
        {
            email: 'kshitij@catalance.com',
            fullName: 'Kshitij Cata',
            bio: 'Senior Project Manager specializing in tech disputes.',
            skills: ['Technical Management', 'Mediation', 'Risk Analysis']
        }
    ];

    console.log('Creating Project Managers...');

    for (const u of usersToCreate) {
        try {
            const user = await prisma.user.upsert({
                where: { email: u.email },
                update: {
                    fullName: u.fullName,
                    passwordHash: hashedPassword,
                    role: 'PROJECT_MANAGER',
                    status: 'ACTIVE',
                    isVerified: true
                },
                create: {
                    email: u.email,
                    fullName: u.fullName,
                    passwordHash: hashedPassword,
                    role: 'PROJECT_MANAGER',
                    status: 'ACTIVE',
                    isVerified: true,
                    bio: u.bio,
                    skills: u.skills
                },
            });
            console.log(`User created/updated: ${u.fullName} (${u.email})`);
        } catch (e) {
            console.error(`Error creating ${u.fullName}:`, e);
        }
    }

    console.log('\nAll Project Managers processed.');
    console.log('Default Password: password123');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
