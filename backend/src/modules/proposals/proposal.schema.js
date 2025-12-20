import { z } from "zod";

const proposalStatusEnum = z.enum(["PENDING", "ACCEPTED", "REJECTED", "DRAFT"]);

export const createProposalSchema = z.object({
  body: z.object({
    projectId: z.string().min(1),
    coverLetter: z.string().min(1),
    amount: z.coerce.number().int().nonnegative(),
    status: proposalStatusEnum.optional(),
    freelancerId: z.string().cuid().optional()
  })
});

export const listProposalsSchema = z.object({
  query: z.object({
    as: z.enum(["owner", "freelancer"]).optional()
  })
});
