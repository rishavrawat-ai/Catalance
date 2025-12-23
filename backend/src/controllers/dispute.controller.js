import { asyncHandler } from "../utils/async-handler.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";

export const createDispute = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) throw new AppError("Authentication required", 401);

  const { description, projectId } = req.body;

  if (!description || !projectId) {
    throw new AppError("Description and Project ID are required", 400);
  }

  const dispute = await prisma.dispute.create({
    data: {
      description,
      projectId,
      raisedById: userId,
      status: "OPEN"
    }
  });

  res.status(201).json({ data: dispute });
});

export const listDisputes = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) throw new AppError("Authentication required", 401);

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError("User not found", 401);
  }

  let where = {};
  if (user.role === "PROJECT_MANAGER" || user.role === "ADMIN") {
    // PM sees all
  } else {
    // User sees only their raised disputes
    where = { raisedById: userId };
  }

  const disputes = await prisma.dispute.findMany({
    where,
    include: {
      project: {
        include: {
          owner: true,
          proposals: {
            where: { status: 'ACCEPTED' },
            include: {
              freelancer: true
            }
          }
        }
      },
      raisedBy: true,
      manager: true
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({ data: disputes });
});

export const getDispute = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  const { id } = req.params;

  const dispute = await prisma.dispute.findUnique({
    where: { id },
    include: {
      project: true,
      raisedBy: true,
      manager: true
    }
  });

  if (!dispute) throw new AppError("Dispute not found", 404);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("User not found", 401);

  if (user.role !== 'PROJECT_MANAGER' && user.role !== 'ADMIN' && dispute.raisedById !== userId) {
    throw new AppError("Access denied", 403);
  }

  res.json({ data: dispute });
});

export const updateDispute = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  const { id } = req.params;
  const { status, resolutionNotes, meetingLink, meetingDate } = req.body;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("User not found", 401);

  if (user.role !== 'PROJECT_MANAGER' && user.role !== 'ADMIN') {
    throw new AppError("Only Project Managers can update disputes", 403);
  }

  // Sanitize updates
  const data = {};
  if (status !== undefined) data.status = status;
  if (resolutionNotes !== undefined) data.resolutionNotes = resolutionNotes;
  if (meetingLink !== undefined) data.meetingLink = meetingLink;
  if (meetingDate !== undefined) data.meetingDate = meetingDate;

  // Optionally auto-assign if manager touches it
  // Check if already has manager
  const currentDispute = await prisma.dispute.findUnique({ where: { id } });
  if (!currentDispute) throw new AppError("Dispute not found", 404);

  if (!currentDispute.managerId) {
    data.managerId = userId;
  }

  const dispute = await prisma.dispute.update({
    where: { id },
    data
  });

  res.json({ data: dispute });
});

export const reassignFreelancer = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  const { id } = req.params; // disputeId
  const { newFreelancerId } = req.body;

  if (!newFreelancerId) throw new AppError("New freelancer ID is required", 400);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || (user.role !== 'PROJECT_MANAGER' && user.role !== 'ADMIN')) {
    throw new AppError("Access denied", 403);
  }

  const dispute = await prisma.dispute.findUnique({
    where: { id },
    include: {
      project: {
        include: {
          proposals: { where: { status: 'ACCEPTED' } }
        }
      }
    }
  });

  if (!dispute) throw new AppError("Dispute not found", 404);

  const newFreelancer = await prisma.user.findUnique({ where: { id: newFreelancerId } });
  if (!newFreelancer) throw new AppError("Freelancer not found", 404);

  // Transaction to atomic update
  await prisma.$transaction(async (tx) => {
    // 1. Terminate/Reject existing accepted proposals
    if (dispute.project.proposals.length > 0) {
      await tx.proposal.updateMany({
        where: {
          projectId: dispute.projectId,
          status: 'ACCEPTED'
        },
        data: {
          status: 'REJECTED' // Or a specific status if available
        }
      });
    }

    // 2. Create new accepted proposal for new freelancer
    const originalProposal = dispute.project.proposals[0];
    await tx.proposal.create({
      data: {
        projectId: dispute.projectId,
        freelancerId: newFreelancerId,
        amount: originalProposal ? originalProposal.amount : (dispute.project.budget || 0),
        coverLetter: "Reassigned by Project Manager via Dispute Resolution",
        status: 'ACCEPTED'
      }
    });

    // 3. Update dispute resolution notes if needed
    await tx.dispute.update({
      where: { id },
      data: {
        resolutionNotes: (dispute.resolutionNotes || "") + `\n[System]: Reassigned to ${newFreelancer.fullName} (${newFreelancer.email}).`,
        status: 'RESOLVED' // Auto-resolve? Maybe optional, but user implied "after meeting done... assign"
      }
    });
  });

  res.json({ message: "Project reassigned successfully" });
});
