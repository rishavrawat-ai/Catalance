import { env } from "../src/config/env.js";
import { prisma } from "../src/lib/prisma.js";
import { hashPassword } from "../src/modules/users/password.utils.js";

const main = async () => {
  console.log(`Seeding database for ${env.NODE_ENV}...`);

  const defaultPasswordHash = await hashPassword("Password123!");

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: "admin@catalance.com" },
    update: {},
    create: {
      email: "admin@catalance.com",
      fullName: "Catalance Admin",
      passwordHash: defaultPasswordHash,
      role: "ADMIN",
      bio: "Platform administrator.",
      skills: []
    }
  });
  console.log("Admin user created:", admin.email);

  const client = await prisma.user.upsert({
    where: { email: "client@example.com" },
    update: {},
    create: {
      email: "client@example.com",
      fullName: "Sample Client",
      passwordHash: defaultPasswordHash,
      role: "CLIENT",
      bio: "Needs help shipping a new feature.",
      skills: []
    }
  });

  const freelancer = await prisma.user.upsert({
    where: { email: "freelancer@example.com" },
    update: {},
    create: {
      email: "freelancer@example.com",
      fullName: "Sample Freelancer",
      passwordHash: defaultPasswordHash,
      role: "FREELANCER",
      bio: "Product designer & front-end developer.",
      skills: ["React", "TypeScript", "UI/UX"],
      hourlyRate: 75
    }
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@example.com" },
    update: {},
    create: {
      email: "manager@example.com",
      fullName: "Sample Project Manager",
      passwordHash: defaultPasswordHash,
      role: "PROJECT_MANAGER",
      bio: "Overseeing disputes and project delivery.",
      skills: ["Management", "Agile", "Conflict Resolution"]
    }
  });

  const project = await prisma.project.upsert({
    where: { id: "sample-project" },
    update: {},
    create: {
      id: "sample-project",
      title: "New Landing Page",
      description: "Design and build a modern marketing site for a SaaS product.",
      budget: 5000,
      status: "OPEN",
      ownerId: client.id
    }
  });

  await prisma.proposal.upsert({
    where: { id: "sample-proposal" },
    update: {},
    create: {
      id: "sample-proposal",
      coverLetter: "I'd love to help you ship this landing page in two weeks.",
      amount: 4500,
      status: "PENDING",
      freelancerId: freelancer.id,
      projectId: project.id
    }
  });

  console.log("Seed complete.");
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
