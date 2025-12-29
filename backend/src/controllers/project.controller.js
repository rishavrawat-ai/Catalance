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
    // Auto-assign Project Manager logic removed to fix production 500 error
    // (Database schema missing managerId column)
    
    const project = await prisma.project.create({
      data: {
        title,
        description,
        budget: normalizeBudget(budget),
        status: status || "DRAFT",
        progress: 0,
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
    // Get user role to determine what projects to show
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    // Build query based on role
    let where = {};

    // Project Managers and Admins can see all projects
    if (user?.role === "PROJECT_MANAGER" || user?.role === "ADMIN") {
      // No filter - show all projects
      where = {};
    } else {
      // Clients only see their own projects
      where = { ownerId: userId };
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        owner: {
          select: { id: true, fullName: true, email: true }
        },
        proposals: {
          include: {
            freelancer: {
              select: { id: true, fullName: true, email: true }
            }
          },
          orderBy: { createdAt: "desc" }
        },
        disputes: {
          select: { id: true, status: true }
        },
        _count: {
          select: { proposals: true }
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
      owner: {
        select: { id: true, fullName: true, email: true }
      },
      proposals: {
        include: {
          freelancer: {
            select: { id: true, fullName: true, email: true }
          }
        },
        orderBy: { createdAt: "desc" }
      },
      disputes: {
        select: { id: true, status: true }
      },
      _count: {
        select: { proposals: true }
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

// Pay 50% upfront to activate project
export const payUpfront = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  const { id } = req.params;

  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  // Find the project
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      proposals: {
        where: { status: "ACCEPTED" },
        include: { freelancer: true }
      }
    }
  });

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  // Only owner can pay
  if (project.ownerId !== userId) {
    throw new AppError("Only the project owner can make payments", 403);
  }

  // Project must not have been paid yet (spent === 0 or null) OR be in AWAITING_PAYMENT status
  const hasBeenPaid = project.spent && project.spent > 0;
  if (hasBeenPaid) {
    throw new AppError("Payment has already been made for this project", 400);
  }

  // Calculate upfront payment based on budget tiers
  const acceptedProposal = project.proposals?.[0];
  const amount = acceptedProposal?.amount || project.budget || 0;
  
  let parts = 2; // Default to 2 parts (< 50k)
  let percentage = 50;

  if (amount > 200000) {
    parts = 4; // 2L - 10L+
    percentage = 25;
  } else if (amount >= 50000) {
    parts = 3; // 50k - 2L
    percentage = 33;
  }

  const upfrontPayment = Math.round(amount / parts);

  // Update project: set spent and change status to IN_PROGRESS
  const updatedProject = await prisma.project.update({
    where: { id },
    data: {
      spent: upfrontPayment,
      status: "IN_PROGRESS"
    }
  });

  res.json({
    data: {
      project: updatedProject,
      paymentAmount: upfrontPayment,
      message: `${percentage}% upfront payment processed. Project is now active.`
    }
  });
});
