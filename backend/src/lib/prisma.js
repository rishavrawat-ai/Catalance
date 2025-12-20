import { PrismaClient } from "@prisma/client";
import { env } from "../config/env.js";

const globalForPrisma = globalThis;

let prismaInitError = null;

if (!globalForPrisma.__prisma) {
  try {
    globalForPrisma.__prisma = new PrismaClient({
      log: env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"]
    });
  } catch (error) {
    // Capture initialization errors (e.g. missing generated client on Vercel)
    console.error("Prisma client initialization failed:", error);
    prismaInitError = error;
    globalForPrisma.__prisma = null;
  }
}

export const prisma = globalForPrisma.__prisma;
export { prismaInitError };
