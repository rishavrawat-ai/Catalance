import { asyncHandler } from "../utils/async-handler.js";
import { createUser, listUsers } from "../modules/users/user.service.js";

export const getUsers = asyncHandler(async (req, res) => {
  const filters = req.query;
  const users = await listUsers(filters);
  res.json({ data: users });
});

export const createUserHandler = asyncHandler(async (req, res) => {
  const payload = req.body;
  const user = await createUser(payload);
  res.status(201).json({ data: user });
});
