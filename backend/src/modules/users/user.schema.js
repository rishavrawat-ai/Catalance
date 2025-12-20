import { z } from "zod";

export const userRoleEnum = z.enum(["CLIENT", "FREELANCER", "ADMIN"]);

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email(),
    fullName: z.string().min(2).max(120),
    password: z.string().min(8).max(72),
    role: userRoleEnum.default("FREELANCER"),
    bio: z.string().max(500).optional(),
    skills: z.array(z.string()).default([]),
    hourlyRate: z.coerce.number().positive().optional()
  })
});

export const listUsersSchema = z.object({
  query: z.object({
    role: userRoleEnum.optional()
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8).max(72)
  })
});
