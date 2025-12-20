import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/async-handler.js";

export const getHealthStatus = asyncHandler(async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;

  res.json({
    status: "ok",
    timestamp: new Date().toISOString()
  });
});
