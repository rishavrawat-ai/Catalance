import { Server } from "socket.io";
import { env } from "../config/env.js";
import { prisma } from "./prisma.js";
import { generateChatReplyWithState } from "../controllers/chat.controller.js";
import {
  ensureConversation,
  createConversation as createInMemoryConversation,
  addMessage,
  listMessages,
  getConversation
} from "./chat-store.js";
import { setIoInstance, sendNotificationToUser } from "./notification-util.js";

const normalizeOrigin = (value = "") => value.trim().replace(/\/$/, "");
const parseOrigins = (value = "") =>
  value
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean);

const allowedOrigins = [
  ...parseOrigins(env.CORS_ORIGIN || ""),
  normalizeOrigin(env.LOCAL_CORS_ORIGIN || ""),
  normalizeOrigin(env.VERCEL_CORS_ORIGIN || ""),
  "http://localhost:5173",
  "http://localhost:5174"
].filter(Boolean);

const serializeMessage = (message) => ({
  id: message.id,
  conversationId: message.conversationId,
  content: message.content,
  role: message.role, // CRITICAL: frontend uses this to identify assistant messages
  senderId: message.senderId,
  senderRole: message.senderRole,
  senderName: message.senderName,
  readAt: message.readAt,
  createdAt:
    message.createdAt instanceof Date
      ? message.createdAt.toISOString()
      : message.createdAt
});

const toHistoryMessage = (message) => ({
  role: message.role === "assistant" ? "assistant" : "user",
  content: message.content
});

export const initSocket = (server) => {
  const corsOrigins =
    allowedOrigins.includes("*") || allowedOrigins.length === 0
      ? true
      : allowedOrigins;

  const conversationPresence = new Map(); // conversationId -> Set<userId>

  const io = new Server(server, {
    path: env.SOCKET_IO_PATH || "/socket.io",
    cors: {
      origin: corsOrigins,
      credentials: true
    }
  });

  // Store io globally for use in HTTP controllers via notification-util
  setIoInstance(io);

  io.on("connection", (socket) => {
    const handshakeUserId = socket.handshake?.query?.userId;
    console.log(`[Socket] 🔌 New connection: ${socket.id}, userId from query: ${handshakeUserId || 'none'}`);
    
    const joinedConversations = new Set();
    const presenceKeys = new Map(); // conversationId -> userKey

    const broadcastPresence = (conversationId) => {
      const set = conversationPresence.get(conversationId) || new Set();
      const online = Array.from(set);
      io.to(conversationId).emit("chat:presence", {
        conversationId,
        online
      });
    };

    // Helper to send notification to a specific user
    const sendNotification = (userId, notification) => {
      if (!userId) return;
      const roomName = `user:${userId}`;
      io.to(roomName).emit("notification:new", {
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        ...notification,
        createdAt: new Date().toISOString()
      });
    };

    // Join user's personal notification room
    // SECURITY: Use the userId from socket handshake (set during connection) 
    // instead of trusting client-provided userId to ensure users only join their own room
    socket.on("notification:join", ({ userId }) => {
      // Use the authenticated userId from the socket's handshake query
      const authenticatedUserId = socket.handshake?.query?.userId;
      
      if (!authenticatedUserId) {
        console.log(`[Socket] ❌ notification:join rejected - no authenticated userId`);
        socket.emit("notification:join_error", { error: "No authenticated userId" });
        return;
      }
      
      // Only allow joining own notification room
      if (userId && userId !== authenticatedUserId) {
        console.log(`[Socket] ❌ notification:join rejected - userId mismatch: requested ${userId}, authenticated ${authenticatedUserId}`);
        socket.emit("notification:join_error", { error: "userId mismatch" });
        return;
      }
      
      const roomName = `user:${authenticatedUserId}`;
      socket.join(roomName);
      console.log(`[Socket] ✅ User ${authenticatedUserId} joined notification room: ${roomName}`);
      
      // Send confirmation back to client
      socket.emit("notification:joined", { room: roomName, userId: authenticatedUserId });
    });

    socket.on("chat:join", async ({ conversationId, service, senderId }) => {
      console.log(`[Socket] chat:join request:`, { conversationId, service, senderId, socketId: socket.id });
      try {
        const serviceKey = service ? service.toString().trim() : null;
        let useMemory = false;
        let conversation = getConversation(conversationId);
        if (conversation) {
          useMemory = true;
        }

        if (!conversation && conversationId) {
          conversation = await prisma.chatConversation.findUnique({
            where: { id: conversationId }
          });
        }

        if (!conversation) {
          if (serviceKey) {
            const candidates = await prisma.chatConversation.findMany({
              where: { service: serviceKey },
              include: {
                _count: { select: { messages: true } }
              },
              orderBy: { updatedAt: "desc" }
            });
            conversation = candidates.find(c => c._count.messages > 0) || candidates[0];
          }
        }

        if (!conversation) {
          // Default to persisted conversation for client/freelancer chat.
          console.log(`[Socket] Creating new conversation for service: ${serviceKey}`);
          conversation = await prisma.chatConversation.create({
            data: { service: serviceKey || null, createdById: senderId || null }
          });
        }

        console.log(`[Socket] Joining conversation: ${conversation.id} for service: ${serviceKey}`);
        socket.join(conversation.id);
        socket.emit("chat:joined", { conversationId: conversation.id });
        joinedConversations.add(conversation.id);

        // Track presence
        const userKey = senderId || socket.id;
        const set = conversationPresence.get(conversation.id) || new Set();
        set.add(userKey);
        conversationPresence.set(conversation.id, set);
        presenceKeys.set(conversation.id, userKey);
        broadcastPresence(conversation.id);

        const history = useMemory
          ? listMessages(conversation.id, 100)
          : await prisma.chatMessage.findMany({
              where: { conversationId: conversation.id },
              orderBy: { createdAt: "asc" },
              take: 100
            });

        if (history.length) {
          socket.emit(
            "chat:history",
            history.map((msg) => serializeMessage(msg))
          );
        }
      } catch (error) {
        console.error("chat:join failed", error);
        socket.emit("chat:error", {
          message: "Unable to join chat. Please try again."
        });
      }
    });

    socket.on("chat:read", async ({ conversationId, userId }) => {
      if (!conversationId || !userId) return;

      try {
        // Mark messages as read in DB where sender is NOT the current user
        await prisma.chatMessage.updateMany({
          where: {
            conversationId,
            senderId: { not: userId }, // Mark others' messages as read
            readAt: null
          },
          data: {
            readAt: new Date()
          }
        });

        // Broadcast read receipt to the room (so the sender sees blue ticks)
        io.to(conversationId).emit("chat:read_receipt", {
          conversationId,
          readerId: userId,
          readAt: new Date().toISOString()
        });
      } catch (error) {
        console.error("Failed to mark messages as read:", error);
      }
    });

    socket.on(
      "chat:message",
      async ({
        conversationId,
        content,
        service,
        senderId,
        senderRole,
        senderName,
        skipAssistant = false,
        history: clientHistory
      }) => {
        if (!content) {
          socket.emit("chat:error", {
            message: "Message content is required"
          });
          return;
        }

        try {
          const serviceKey = service ? service.toString().trim() : null;
          const memoryConversation = getConversation(conversationId);
          const useMemory = !skipAssistant || Boolean(memoryConversation);

          // Ephemeral AI chat path
          if (useMemory) {
            let conversation = ensureConversation({
              id: conversationId,
              service: serviceKey || null,
              createdById: senderId || null
            });

            if (!conversationId || conversation.id !== conversationId) {
              socket.emit("chat:joined", { conversationId: conversation.id });
            }

            socket.join(conversation.id);

            const userMessage = addMessage({
              conversationId: conversation.id,
              senderId: senderId || null,
              senderName: senderName || null,
              senderRole: senderRole || null,
              role: "user",
              content
            });

            io.to(conversation.id).emit(
              "chat:message",
              serializeMessage(userMessage)
            );

            if (skipAssistant) return;

            const serverHistory = listMessages(conversation.id, 100).map(toHistoryMessage);
            const fallbackHistory = Array.isArray(clientHistory)
              ? clientHistory.map(toHistoryMessage)
              : [];

            // Prefer server-side history when it exists; otherwise use client-provided history.
            // This prevents repeated questions when the in-memory conversation is missing
            // (e.g., after a restart or in multi-instance deployments).
            const dbHistory =
              fallbackHistory.length > 0 && serverHistory.length <= 1
                ? fallbackHistory
                : serverHistory;

            let assistantReply = null;
            try {
              const { reply, state: nextState } = await generateChatReplyWithState({
                message: content,
                service: service || conversation.service || "",
                history: dbHistory,
                state: conversation.assistantState
              });
              assistantReply = reply;
              conversation.assistantState = nextState;
            } catch (error) {
              console.error("Assistant generation failed", error);
              socket.emit("chat:error", {
                message:
                  "Assistant is temporarily unavailable. Please continue the chat."
              });
            }

            if (assistantReply) {
              const assistantMessage = addMessage({
                conversationId: conversation.id,
                senderName: "Assistant",
                senderRole: "assistant",
                role: "assistant", // Ensuring role is 'assistant'
                content: assistantReply
              });

              console.log("[Socket] Emitting assistant response:", serializeMessage(assistantMessage));

              io.to(conversation.id).emit(
                "chat:message",
                serializeMessage(assistantMessage)
              );
            }
            return;
          }

          // Persisted client/freelancer chat path
          let conversation = null;

          if (conversationId) {
            conversation = await prisma.chatConversation.findUnique({
              where: { id: conversationId }
            });
          }

          if (!conversation) {
            if (serviceKey) {
              const candidates = await prisma.chatConversation.findMany({
                where: { service: serviceKey },
                include: {
                  _count: { select: { messages: true } }
                },
                orderBy: { updatedAt: "desc" }
              });
              conversation = candidates.find(c => c._count.messages > 0) || candidates[0];
            }
          }

          if (!conversation) {
            conversation = await prisma.chatConversation.create({
              data: {
                service: serviceKey || null,
                createdById: senderId || null
              }
            });
            socket.emit("chat:joined", { conversationId: conversation.id });
          }

          socket.join(conversation.id);

          const userMessage = await prisma.chatMessage.create({
            data: {
              conversationId: conversation.id,
              senderId: senderId || null,
              senderName: senderName || null,
              senderRole: senderRole || null,
              role: "user",
              content
            }
          });

          // Update conversation timestamp for sorting
          await prisma.chatConversation.update({
            where: { id: conversation.id },
            data: { updatedAt: new Date() }
          });

            io.to(conversation.id).emit(
              "chat:message",
              serializeMessage(userMessage)
            );

            // Send notification to the other participant
            const convService = serviceKey || conversation.service || "";
            console.log(`[Socket] Checking notification for service: ${convService}, senderId: ${senderId}`);
            
            if (convService.startsWith("CHAT:")) {
              const parts = convService.split(":");
              let recipientId = null;
              
              // Support both formats:
              // Old: CHAT:clientId:freelancerId (3 parts)
              // New: CHAT:projectId:clientId:freelancerId (4 parts)
              if (parts.length === 4) {
                // New format: CHAT:projectId:clientId:freelancerId
                const [, , clientId, freelancerId] = parts;
                recipientId = String(senderId) === String(clientId) ? freelancerId : clientId;
              } else if (parts.length >= 3) {
                // Old format: CHAT:id1:id2
                const [, id1, id2] = parts;
                recipientId = String(senderId) === String(id1) ? id2 : id1;
              }
                
              console.log(`[Socket] Notification recipient: ${recipientId}, sender: ${senderId}`);
              
              if (recipientId && String(recipientId) !== String(senderId)) {
                sendNotificationToUser(recipientId, {
                  type: "chat",
                  title: "New Message",
                  message: `${senderName || "Someone"}: ${content.slice(0, 50)}${content.length > 50 ? "..." : ""}`,
                  data: { 
                    conversationId: conversation.id, 
                    messageId: userMessage.id,
                    service: convService,
                    senderId
                  }
                });
              }
            } else {
              console.log(`[Socket] Skipping notification - service doesn't start with CHAT: ${convService}`);
            }
        } catch (error) {
          console.error("chat:message failed", error);
          socket.emit("chat:error", {
            message: "Unable to send message right now."
          });
        }
      }
    );

    socket.on(
      "chat:typing",
      ({ conversationId, typing = true, userId, userName }) => {
        if (!conversationId) return;
        socket.to(conversationId).emit("chat:typing", {
          conversationId,
          typing,
          userId: userId || socket.id,
          userName
        });
      }
    );

    socket.on("disconnect", () => {
      joinedConversations.forEach((conversationId) => {
        const set = conversationPresence.get(conversationId);
        if (!set) return;
        const key = presenceKeys.get(conversationId) || socket.id;
        set.delete(key);
        if (set.size === 0) {
          conversationPresence.delete(conversationId);
        } else {
          conversationPresence.set(conversationId, set);
        }
        broadcastPresence(conversationId);
      });
    });
  });

  return io;
};
