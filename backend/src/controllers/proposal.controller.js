import { Prisma } from "@prisma/client";
import { asyncHandler } from "../utils/async-handler.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";
import { sendNotificationToUser } from "../lib/notification-util.js";

const normalizeAmount = (value) => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return 0;
  }
  const parsed = Math.round(Number(value));
  return parsed < 0 ? 0 : parsed;
};

export const createProposal = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;

  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  const { projectId, coverLetter, amount, status, freelancerId } = req.body;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true, title: true }
  });

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  const actingFreelancerId = freelancerId || userId;
  const isOwner = project.ownerId === userId;
  const isSelf = actingFreelancerId === userId;

  if (!isOwner && !isSelf) {
    throw new AppError(
      "You do not have permission to add a proposal to this project",
      403
    );
  }

  const proposal = await prisma.proposal.create({
    data: {
      coverLetter,
      amount: normalizeAmount(amount),
      status: status || "PENDING",
      freelancerId: actingFreelancerId,
      projectId
    }
  });

  // Determine who should receive the notification:
  // - If CLIENT (project owner) is sending the proposal TO a freelancer -> notify the FREELANCER
  // - If FREELANCER is sending the proposal TO a client's project -> notify the CLIENT (owner)
  // The sender should NEVER receive the notification
  
  const isClientSendingToFreelancer = isOwner && freelancerId && freelancerId !== userId;
  const isFreelancerSendingToClient = !isOwner && actingFreelancerId === userId;
  
  console.log(`[Proposal] Notification check - isOwner: ${isOwner}, userId: ${userId}, freelancerId: ${freelancerId}, actingFreelancerId: ${actingFreelancerId}`);
  console.log(`[Proposal] isClientSendingToFreelancer: ${isClientSendingToFreelancer}, isFreelancerSendingToClient: ${isFreelancerSendingToClient}`);
  
  if (isClientSendingToFreelancer) {
    // Client is sending a proposal TO a freelancer - notify the freelancer
    console.log(`[Proposal] Client sending to freelancer - notifying freelancer: ${freelancerId}`);
    try {
      sendNotificationToUser(freelancerId, {
        type: "proposal",
        title: "New Proposal Received",
        message: `You received a new proposal for project "${project.title}" from a client.`,
        data: { 
          projectId: projectId,
          proposalId: proposal.id 
        }
      });
    } catch (error) {
      console.error("Failed to send proposal notification to freelancer:", error);
    }
  } else if (isFreelancerSendingToClient) {
    // Freelancer is sending a proposal TO a client's project - notify the client (owner)
    console.log(`[Proposal] Freelancer sending to client - notifying owner: ${project.ownerId}`);
    try {
      sendNotificationToUser(project.ownerId, {
        type: "proposal",
        title: "New Proposal Received",
        message: `You received a new proposal for project "${project.title}" from a freelancer.`,
        data: { 
          projectId: projectId,
          proposalId: proposal.id 
        }
      });
    } catch (error) {
      console.error("Failed to send proposal notification to owner:", error);
    }
  } else {
    console.log(`[Proposal] Skipping notification - sender is recipient or unknown scenario`);
  }

  res.status(201).json({ data: proposal });
});

export const getProposal = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  const proposalId = req.params.id;

  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: {
      project: {
        include: {
          owner: true
        }
      },
      freelancer: true
    }
  });

  if (!proposal) {
    throw new AppError("Proposal not found", 404);
  }

  // Check if user has permission to view this proposal
  const isOwner = proposal.project?.ownerId === userId;
  const isFreelancer = proposal.freelancerId === userId;

  if (!isOwner && !isFreelancer) {
    throw new AppError("You do not have permission to view this proposal", 403);
  }

  res.json({ data: proposal });
});

export const listProposals = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;

  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  const mode = req.query.as === "owner" ? "owner" : "freelancer";

  const proposals = await prisma.proposal.findMany({
    where:
      mode === "owner"
        ? { project: { ownerId: userId } }
        : { freelancerId: userId },
    include: {
      project: {
        include: {
          owner: true
        }
      },
      freelancer: true
    },
    orderBy: { createdAt: "desc" }
  });

  // Fetch chat conversations to get latest activity
  const serviceKeys = proposals.map(p => {
    const ownerId = p.project.ownerId;
    const freelancerId = p.freelancerId;
    return `CHAT:${ownerId}:${freelancerId}`;
  });

  const conversations = await prisma.chatConversation.findMany({
    where: { service: { in: serviceKeys } },
    select: { service: true, updatedAt: true }
  });

  const conversationMap = new Map();
  conversations.forEach(c => {
    if (c.service) conversationMap.set(c.service, c.updatedAt);
  });

  const proposalsWithActivity = proposals.map(p => {
    const key = `CHAT:${p.project.ownerId}:${p.freelancerId}`;
    const chatUpdated = conversationMap.get(key);
    // Use the later of proposal update or chat update
    const lastActivity = chatUpdated ? new Date(chatUpdated) : new Date(p.updatedAt);
    return { ...p, lastActivity };
  });

  // Sort by last activity descending
  const sortedProposals = proposalsWithActivity.sort((a, b) => 
    b.lastActivity.getTime() - a.lastActivity.getTime()
  );

  res.json({ data: sortedProposals });
});

export const deleteProposal = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  const proposalId = req.params.id;

  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: {
      project: { select: { ownerId: true } }
    }
  });

  if (!proposal) {
    throw new AppError("Proposal not found", 404);
  }

  const isOwner = proposal.project?.ownerId === userId;
  const isFreelancer = proposal.freelancerId === userId;

  if (!isOwner && !isFreelancer) {
    throw new AppError("You do not have permission to delete this proposal", 403);
  }

  await prisma.proposal.delete({
    where: { id: proposalId }
  });

  res.json({ data: { deleted: true } });
});

export const updateProposalStatus = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  const proposalId = req.params.id;
  const { status } = req.body || {};

  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  const normalizedStatus = (() => {
    const incoming = (status || "").toString().trim().toUpperCase();
    if (incoming === "RECEIVED") return "PENDING";
    if (["PENDING", "ACCEPTED", "REJECTED"].includes(incoming)) {
      return incoming;
    }
    return null;
  })();

  if (!normalizedStatus) {
    throw new AppError("Invalid proposal status", 400);
  }

  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: {
      project: { select: { ownerId: true } }
    }
  });

  if (!proposal) {
    throw new AppError("Proposal not found", 404);
  }
  if (!proposal.project) {
    throw new AppError("Proposal project not found", 404);
  }

  const isOwner = proposal.project.ownerId === userId;
  const isFreelancer = proposal.freelancerId === userId;

  if (!isOwner && !isFreelancer) {
    throw new AppError("You do not have permission to update this proposal", 403);
  }

  try {
    // Use a transaction to atomically check and update to prevent race conditions
    const { updated, rejectedFreelancerIds, projectTitle } = await prisma.$transaction(async (tx) => {
      let rejectedFreelancerIds = [];
      
      // Check AGAIN inside transaction to prevent race conditions
      if (normalizedStatus === "ACCEPTED") {
        const existingAccepted = await tx.proposal.findFirst({
          where: {
            projectId: proposal.projectId,
            status: "ACCEPTED",
            id: { not: proposalId }
          }
        });

        if (existingAccepted) {
          throw new AppError(
            "This project has already been awarded to another freelancer. You cannot accept this proposal.",
            409
          );
        }
        
        // Get list of other pending proposals to reject and notify their freelancers
        const otherPendingProposals = await tx.proposal.findMany({
          where: {
            projectId: proposal.projectId,
            id: { not: proposalId },
            status: "PENDING"
          },
          select: { id: true, freelancerId: true }
        });
        
        rejectedFreelancerIds = otherPendingProposals.map(p => p.freelancerId);
        
        // Auto-reject all other pending proposals for the same project
        if (otherPendingProposals.length > 0) {
          await tx.proposal.updateMany({
            where: {
              projectId: proposal.projectId,
              id: { not: proposalId },
              status: "PENDING"
            },
            data: { status: "REJECTED" }
          });
        }
      }
      
      // Now do the update atomically
      const updated = await tx.proposal.update({
        where: { id: proposalId },
        data: { status: normalizedStatus },
        include: {
          project: { include: { owner: true } },
          freelancer: true
        }
      });
      
      return { 
        updated, 
        rejectedFreelancerIds,
        projectTitle: updated.project?.title || "the project"
      };
    });
    
    // Send notifications to freelancers whose proposals were auto-rejected
    if (rejectedFreelancerIds && rejectedFreelancerIds.length > 0) {
      for (const freelancerId of rejectedFreelancerIds) {
        try {
          sendNotificationToUser(freelancerId, {
            type: "proposal",
            title: "Project Awarded to Another",
            message: `The project "${projectTitle}" has been awarded to another freelancer.`,
            data: { 
              projectId: proposal.projectId,
              status: "REJECTED"
            }
          });
        } catch (err) {
          console.error(`Failed to notify freelancer ${freelancerId}:`, err);
        }
      }
    }

    // Notify Freelancer if Client changes status
    if (isOwner && proposal.status !== normalizedStatus) {
      let title = "Proposal Update";
      let message = `Your proposal for "${proposal.project.title}" was updated to ${normalizedStatus}`;
      
      if (normalizedStatus === "ACCEPTED") {
        title = "Proposal Accepted! 🎉";
        message = `Congratulations! Your proposal for "${proposal.project.title}" has been accepted.`;
      } else if (normalizedStatus === "REJECTED") {
        title = "Proposal Rejected";
        message = `Your proposal for "${proposal.project.title}" was declined.`;
      }

      try {
        sendNotificationToUser(proposal.freelancerId, {
          type: "proposal",
          title,
          message,
          data: { 
            projectId: proposal.projectId, 
            proposalId: proposal.id,
            status: normalizedStatus
          }
        });
      } catch (err) {
        console.error("Failed to notify freelancer:", err);
      }
    }

    // MARKIFY: If status is ACCEPTED (by freelancer), send an automated chat message to the client.
    if (normalizedStatus === "ACCEPTED" && isFreelancer) {
      // Notify the client that freelancer accepted their proposal
      try {
        const freelancerName = updated.freelancer?.fullName || updated.freelancer?.name || "A freelancer";
        sendNotificationToUser(updated.project.ownerId, {
          type: "proposal",
          title: "Proposal Accepted! 🎉",
          message: `${freelancerName} has accepted your proposal for "${updated.project.title}".`,
          data: { 
            projectId: updated.projectId, 
            proposalId: updated.id,
            status: normalizedStatus
          }
        });
      } catch (err) {
        console.error("Failed to notify client about acceptance:", err);
      }

      // 1. Update Project Status to "IN_PROGRESS" to close it for other proposals
      try {
        await prisma.project.update({
          where: { id: updated.projectId },
          data: { status: "IN_PROGRESS" }
        });
      } catch (projError) {
        console.error("Failed to update project status:", projError);
      }

      try {
        const projectId = updated.projectId;
        const ownerId = updated.project.ownerId;
        const freelancerId = updated.freelancerId;
        const projectTitle = updated.project.title || "Project Chat";
        
        // Use new project-based key format: CHAT:PROJECT_ID:CLIENT_ID:FREELANCER_ID
        const serviceKey = `CHAT:${projectId}:${ownerId}:${freelancerId}`;

        // 2. Find or create conversation
        let conversation = await prisma.chatConversation.findFirst({
          where: { service: serviceKey }
        });

        if (!conversation) {
          conversation = await prisma.chatConversation.create({
            data: {
              service: serviceKey,
              projectTitle: projectTitle,
              createdById: freelancerId
            }
          });
        }

        // 3. Create the message with earnings after 30% platform fee
        const freelancerName = updated.freelancer.fullName || updated.freelancer.name || updated.freelancer.email || "Freelancer";
        const proposalAmount = updated.amount || 0;
        const freelancerEarnings = Math.round(proposalAmount * 0.7); // 70% after 30% platform fee
        const formattedEarnings = freelancerEarnings.toLocaleString('en-IN');
        const messageContent = `I have accepted your proposal for "${projectTitle}". My earnings for this project: ₹${formattedEarnings} (after platform fee). I'm ready to start!`;
        const userMessage = await prisma.chatMessage.create({
          data: {
            conversationId: conversation.id,
            senderId: freelancerId,
            senderName: freelancerName,
            senderRole: "FREELANCER",
            role: "user",
            content: messageContent
          }
        });

        // 4. Update conversation timestamp
        await prisma.chatConversation.update({
          where: { id: conversation.id },
          data: { updatedAt: new Date() }
        });

        // 5. Send notification to client about the new message
        try {
          sendNotificationToUser(ownerId, {
            type: "chat",
            title: "New Message",
            message: `${freelancerName}: ${messageContent}`,
            data: { 
              conversationId: conversation.id,
              projectId: projectId,
              service: serviceKey,
              senderId: freelancerId
            }
          });
        } catch (notifyErr) {
          console.error("Failed to notify client about auto-message:", notifyErr);
        }
        
      } catch (chatError) {
        console.error("Failed to send automated acceptance message:", chatError);
        // Don't fail the request, just log it.
      }
    }

    res.json({ data: updated });
  } catch (error) {
    console.error("Failed to update proposal status", {
      proposalId,
      normalizedStatus,
      error
    });
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2004"
    ) {
      throw new AppError("Invalid proposal status value", 400);
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new AppError(`Database error (${error.code}) updating proposal`, 500, {
        code: error.code,
        meta: error.meta
      });
    }

    throw error;
  }
});
