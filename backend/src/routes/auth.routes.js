import { Router } from "express";
import {
  signupHandler,
  loginHandler,
  profileHandler
} from "../controllers/auth.controller.js";
import { validateResource } from "../middlewares/validate-resource.js";
import {
  createUserSchema,
  loginSchema
} from "../modules/users/user.schema.js";
import { requireAuth } from "../middlewares/require-auth.js";

export const authRouter = Router();

authRouter.post("/signup", validateResource(createUserSchema), signupHandler);
authRouter.post("/login", validateResource(loginSchema), loginHandler);
authRouter.get("/profile", requireAuth, profileHandler);
