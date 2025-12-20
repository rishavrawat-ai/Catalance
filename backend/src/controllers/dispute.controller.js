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
          owner: true
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
