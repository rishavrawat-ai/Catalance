import { Router } from "express";
import { createDispute, listDisputes, getDispute, updateDispute } from "../controllers/dispute.controller.js";
import { requireAuth } from "../middlewares/require-auth.js";

export const disputeRouter = Router();

disputeRouter.get("/", requireAuth, listDisputes);
disputeRouter.post("/", requireAuth, createDispute);
disputeRouter.get("/:id", requireAuth, getDispute);
disputeRouter.patch("/:id", requireAuth, updateDispute);
