import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding data for Project Manager Dashboard...');

    // 1. Get or Create Project Manager
    const pmInfo = { email: 'manager@example.com', role: 'PROJECT_MANAGER' };
    let pm = await prisma.user.findUnique({ where: { email: pmInfo.email } });
    if (!pm) {
        console.log('PM not found, creating...');
        // In a real scenario we'd hash password, but here we assume it exists or we use the create_pm.js logic.
        // Since the user just ran create_pm.js, it should exist. 
        // If not, we skip or error.
        console.error("Please run node create_pm.js first");
        return;
    }
    console.log(`Using PM: ${pm.email}`);

    // 2. Get or Create Client
    const clientEmail = 'client@example.com';
    let client = await prisma.user.findUnique({ where: { email: clientEmail } });
    if (!client) {
        console.log('Creating dummy Client...');
        client = await prisma.user.create({
            data: {
                email: clientEmail,
                fullName: 'John Client',
                passwordHash: '$2b$10$EpIxNwllq..', // dummy hash
                role: 'CLIENT',
                bio: 'I hire freelancers.',
            }
        });
    }

    // 3. Get or Create Freelancer
    const freelancerEmail = 'freelancer@example.com';
    let freelancer = await prisma.user.findUnique({ where: { email: freelancerEmail } });
    if (!freelancer) {
        console.log('Creating dummy Freelancer...');
        freelancer = await prisma.user.create({
            data: {
                email: freelancerEmail,
                fullName: 'Jane Freelancer',
                passwordHash: '$2b$10$EpIxNwllq..', // dummy hash
                role: 'FREELANCER',
                skills: ['React', 'Node.js'],
            }
        });
    }

    // 4. Create a Project
    console.log('Creating dummy Project...');
    const project = await prisma.project.create({
        data: {
            title: 'E-commerce Website Overhaul',
            description: 'Complete redesign of our shopify store.',
            budget: 5000,
            status: 'IN_PROGRESS',
            ownerId: client.id,
        }
    });

    // 5. Create Disputes
    console.log('Creating Disputes...');

    // Dispute 1: Open
    await prisma.dispute.create({
        data: {
            description: 'Freelancer stopped responding after receiving the first milestone payment.',
            status: 'OPEN',
            projectId: project.id,
            raisedById: client.id, // Raised by client against freelancer
        }
    });

    // Dispute 2: In Progress with Meeting
    await prisma.dispute.create({
        data: {
            description: 'Disagreement over the scope of "mobile responsiveness".',
            status: 'IN_PROGRESS',
            projectId: project.id,
            raisedById: freelancer.id, // Raised by freelancer
            managerId: pm.id,
            meetingLink: 'https://meet.google.com/abc-defg-hij',
            meetingDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        }
    });

    // Dispute 3: Resolved
    await prisma.dispute.create({
        data: {
            description: 'Initial confusion about color palette.',
            status: 'RESOLVED',
            projectId: project.id,
            raisedById: client.id,
            managerId: pm.id,
            resolutionNotes: 'Clarified that we are using the new brand guidelines.',
        }
    });

    console.log('Seeding complete! Refresh your dashboard.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
