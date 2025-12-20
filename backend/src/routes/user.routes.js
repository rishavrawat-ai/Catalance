import { Router } from "express";
import { validateResource } from "../middlewares/validate-resource.js";
import {
  createUserSchema,
  listUsersSchema
} from "../modules/users/user.schema.js";
import {
  createUserHandler,
  getUsers
} from "../controllers/user.controller.js";

export const userRouter = Router();

userRouter.get("/", validateResource(listUsersSchema), getUsers);
userRouter.post("/", validateResource(createUserSchema), createUserHandler);
