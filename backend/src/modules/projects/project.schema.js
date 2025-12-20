import { z } from "zod";

const projectStatusEnum = z.enum(["DRAFT", "OPEN", "IN_PROGRESS", "COMPLETED"]);
const proposalStatusEnum = z.enum(["PENDING", "ACCEPTED", "REJECTED"]);

const proposalPayload = z
  .object({
    coverLetter: z.string().min(1),
    amount: z.coerce.number().int().nonnegative().default(0),
    status: proposalStatusEnum.optional(),
    freelancerId: z.string().cuid().optional()
  })
  .partial({ status: true, freelancerId: true });

export const createProjectSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(160),
    description: z.string().min(4),
    budget: z.coerce.number().int().nonnegative().optional(),
    status: projectStatusEnum.optional(),
    proposal: proposalPayload.optional()
  })
});
