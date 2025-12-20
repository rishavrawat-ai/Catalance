import { Router } from "express";
import {
  chatController,
  listUserConversations,
  createConversation,
  getConversationMessages,
  addConversationMessage
} from "../controllers/chat.controller.js";
import { requireAuth } from "../middlewares/require-auth.js";
import { optionalAuth } from "../middlewares/optional-auth.js";

export const chatRouter = Router();

chatRouter.post("/", chatController);
// Protected conversation routes
chatRouter.get("/conversations", requireAuth, listUserConversations);
chatRouter.post("/conversations", optionalAuth, createConversation);
chatRouter.get("/conversations/:id/messages", optionalAuth, getConversationMessages);
chatRouter.post("/conversations/:id/messages", optionalAuth, addConversationMessage);
