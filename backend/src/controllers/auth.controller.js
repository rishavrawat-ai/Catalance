import { asyncHandler } from "../utils/async-handler.js";
import {
  authenticateUser,
  getUserById,
  registerUser
} from "../modules/users/user.service.js";
import { AppError } from "../utils/app-error.js";

export const signupHandler = asyncHandler(async (req, res) => {
  const authPayload = await registerUser(req.body);
  res.status(201).json({ data: authPayload });
});

export const loginHandler = asyncHandler(async (req, res) => {
  const authPayload = await authenticateUser(req.body);
  res.json({ data: authPayload });
});

export const profileHandler = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;

  if (!userId) {
    throw new AppError("User not found", 404);
  }

  const user = await getUserById(userId);
  res.json({ data: user });
});
