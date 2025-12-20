import { asyncHandler } from "../utils/async-handler.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";

const MAX_INT = 2147483647; // PostgreSQL INT4 upper bound

const normalizeAmount = (value) => {
  if (value === undefined || value === null) return 0;
  if (typeof value === "number") {
    const parsed = Math.round(value);
    if (parsed < 0) return 0;
    return parsed > MAX_INT ? MAX_INT : parsed;
  }

  if (typeof value === "string") {
    // Strip currency, commas, and pull the first number if a range is provided.
    const sanitized = value
      .replace(/[₹,$\s]/g, "")
      .replace(/[–—]/g, "-");

    const rangePart = sanitized.includes("-")
      ? sanitized.split("-")[0]
      : sanitized;

    const parsed = Number(rangePart);
    if (!Number.isNaN(parsed)) {
      const rounded = Math.round(parsed);
      if (rounded < 0) return 0;
      return rounded > MAX_INT ? MAX_INT : rounded;
    }
  }

  return 0;
};

const normalizeBudget = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value === "number") {
    const parsed = Math.round(value);
    if (parsed < 0) return 0;
    return parsed > MAX_INT ? MAX_INT : parsed;
  }

  if (typeof value === "string") {
    // Handle currency symbols, commas, and ranges like "₹60,001–1,00,000"
    const sanitized = value
      .replace(/[₹,\s]/g, "")
      .replace(/[–—]/g, "-"); // normalize dash variants

    const rangePart = sanitized.includes("-")
      ? sanitized.split("-")[0]
      : sanitized;

    const parsed = Number(rangePart);
    if (!Number.isNaN(parsed)) {
      const rounded = Math.round(parsed);
      if (rounded < 0) return 0;
      return rounded > MAX_INT ? MAX_INT : rounded;
    }
  }

  return null;
};

// ... (previous imports)

export const createProject = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;

  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  const { title, description, budget, status, proposal } = req.body;

  const project = await prisma.project.create({
    data: {
      title,
      description,
      budget: normalizeBudget(budget),
      status: status || "DRAFT",
      progress: 0, // Initialize progress to 0
      ownerId: userId
    }
  });

  let createdProposal = null;

  if (proposal?.coverLetter) {
    const freelancerId = proposal.freelancerId || userId;

    createdProposal = await prisma.proposal.create({
      data: {
        coverLetter: proposal.coverLetter,
        amount: normalizeAmount(proposal.amount),
        status: proposal.status || "PENDING",
        freelancerId,
        projectId: project.id
      }
    });
  }

  res.status(201).json({
    data: {
      project,
      proposal: createdProposal
    }
  });
});

export const listProjects = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;

  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  if (!prisma) {
    console.error("Prisma client is null in listProjects");
    throw new AppError("Database client not initialized", 500);
  }

  try {
    const projects = await prisma.project.findMany({
      where: { ownerId: userId },
      include: {
        proposals: {
          include: {
            freelancer: true
          },
          orderBy: { createdAt: "desc" }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json({ data: projects });
  } catch (error) {
    console.error("Error listing projects:", error);
    throw new AppError(`Failed to fetch projects: ${error.message}`, 500);
  }
});

export const getProject = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  const { id } = req.params;

  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      proposals: {
        include: {
          freelancer: true
        },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  // TODO: Add refined permission check if needed (e.g. check if user is owner or freelancer)
  // For now, allow if authenticated (or maybe just restrict to owner?)
  // if (project.ownerId !== userId) { ... }

  res.json({ data: project });
});

export const updateProject = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  const { id } = req.params;
  const updates = req.body;

  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  // Check existence
  const existing = await prisma.project.findUnique({
    where: { id },
    include: {
      proposals: true
    }
  });

  if (!existing) {
    throw new AppError("Project not found", 404);
  }
  
  // Allow owner OR accepted freelancer to update progress/tasks
  const isOwner = existing.ownerId === userId;
  const isAcceptedFreelancer = existing.proposals?.some(
    p => p.freelancerId === userId && p.status === "ACCEPTED"
  );
  
  if (!isOwner && !isAcceptedFreelancer) {
     throw new AppError("Permission denied", 403);
  }

  try {
    const project = await prisma.project.update({
      where: { id },
      data: updates
    });

    res.json({ data: project });
  } catch (error) {
    console.error("Update project error:", error);
    throw new AppError(`Failed to update project: ${error.message}`, 500);
  }
});
