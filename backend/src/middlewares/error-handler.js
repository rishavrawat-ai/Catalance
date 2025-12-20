import { ZodError } from "zod";
import { AppError } from "../utils/app-error.js";

export const errorHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: "Validation failed",
      issues: error.flatten()
    });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
      details: error.details
    });
  }

  console.error(error);

  return res.status(500).json({
    message: error?.message || "Internal server error"
  });
};
