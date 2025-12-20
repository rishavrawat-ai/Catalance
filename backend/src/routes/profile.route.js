import { Router } from "express";
import { getProfile, saveProfile } from "../controllers/profile.controller.js";

export const profileRouter = Router();

profileRouter.get("/", getProfile);
profileRouter.post("/", saveProfile);
