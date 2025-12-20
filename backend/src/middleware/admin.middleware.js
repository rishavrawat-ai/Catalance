import { AppError } from "../utils/app-error.js";
import { prisma } from "../lib/prisma.js";

export const requireAdmin = async (req, res, next) => {
  try {
    // Check if prisma is available
    if (!prisma) {
      console.error("requireAdmin: Prisma client is not initialized");
      return next(new AppError("Database connection not available", 500));
    }

    // JWT payload uses 'sub' for user ID (see user.service.js issueAccessToken)
    const userId = req.user?.sub || req.user?.id;
    
    console.log("requireAdmin: Checking user", userId);
    
    if (!userId) {
      throw new AppError("User ID not found in token", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    console.log("requireAdmin: Found user with role", user?.role);

    if (!user || user.role !== "ADMIN") {
      throw new AppError("Access denied: Admin privileges required.", 403);
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("requireAdmin error:", error.message);
    next(error);
  }
};
