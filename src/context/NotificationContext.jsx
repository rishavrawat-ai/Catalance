"use client";

import PropTypes from "prop-types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef
} from "react";
import { io } from "socket.io-client";
import { useAuth } from "@/context/AuthContext";
import { SOCKET_IO_URL, SOCKET_OPTIONS, SOCKET_ENABLED } from "@/lib/api-client";

const NotificationContext = createContext(null);
NotificationContext.displayName = "NotificationContext";

// Maximum notifications to store
const MAX_NOTIFICATIONS = 50;

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const connectedRef = useRef(false);

  // Add a new notification
  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: notification.id || `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      type: notification.type || "general",
      title: notification.title || "Notification",
      message: notification.message || "",
      read: false,
      createdAt: notification.createdAt || new Date().toISOString(),
      data: notification.data || {}
    };

    setNotifications((prev) => {
      const updated = [newNotification, ...prev].slice(0, MAX_NOTIFICATIONS);
      return updated;
    });
    setUnreadCount((prev) => prev + 1);
    // Track chat-specific notifications for Messages badge
    if (notification.type === "chat") {
      setChatUnreadCount((prev) => prev + 1);
    }
  }, []);

  // Mark a single notification as read
  const markAsRead = useCallback((notificationId) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    setChatUnreadCount(0);
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    setChatUnreadCount(0);
  }, []);

  // Connect to socket.io for real-time notifications
  useEffect(() => {
    console.log("[Notification] Checking connection prerequisites:", {
      SOCKET_ENABLED,
      SOCKET_IO_URL,
      isAuthenticated,
      userId: user?.id
    });

    if (!SOCKET_ENABLED || !SOCKET_IO_URL || !isAuthenticated || !user?.id) {
      console.log("[Notification] Prerequisites not met, skipping socket connection");
      return;
    }

    // Avoid double connections
    if (connectedRef.current) {
      console.log("[Notification] Already connected, skipping");
      return;
    }

    console.log("[Notification] Connecting to:", SOCKET_IO_URL, "with userId:", user.id, "type:", typeof user.id);
    
    const newSocket = io(SOCKET_IO_URL, {
      ...SOCKET_OPTIONS,
      query: { userId: user.id }
    });

    setSocket(newSocket);
    connectedRef.current = true;

    newSocket.on("connect", () => {
      console.log("[Notification] ✅ Socket connected! Socket ID:", newSocket.id);
      // Join the user's notification room
      newSocket.emit("notification:join", { userId: user.id });
      console.log("[Notification] Emitted notification:join for user:", user.id);
    });

    // Listen for room join confirmation
    newSocket.on("notification:joined", ({ room, userId }) => {
      console.log(`[Notification] 🎉 Successfully joined room: ${room} for user: ${userId}`);
    });

    // Listen for room join errors
    newSocket.on("notification:join_error", ({ error }) => {
      console.error(`[Notification] ❌ Failed to join notification room:`, error);
    });

    // Listen for new notifications
    newSocket.on("notification:new", (notification) => {
      console.log("[Notification] 📬 Received notification:new:", notification);
      
      // Filter "New Proposal Received" notifications - only clients should see these
      // But allow freelancers to see their own proposal status updates (accepted, rejected, awarded to another)
      if (notification.type === "proposal" && 
          notification.title === "New Proposal Received" && 
          user?.role?.toUpperCase() === "FREELANCER") {
        console.log("[Notification] Skipping 'New Proposal Received' for freelancer");
        return;
      }
      
      addNotification(notification);
    });

    newSocket.on("disconnect", () => {
      console.log("[Notification] Socket disconnected");
      connectedRef.current = false;
    });

    // Listen for chat messages (create notification for new messages)
    newSocket.on("chat:message", (message) => {
      // Only notify if the message is not from the current user
      if (message.senderId !== user.id && message.senderRole !== user.role) {
        addNotification({
          type: "chat",
          title: "New Message",
          message: `${message.senderName || "Someone"}: ${message.content?.slice(0, 50)}${message.content?.length > 50 ? "..." : ""}`,
          data: { 
            conversationId: message.conversationId, 
            messageId: message.id,
            senderId: message.senderId,
            service: message.service
          }
        });
      }
    });

    newSocket.on("disconnect", () => {
      console.log("[Notification] Socket disconnected");
    });

    newSocket.on("connect_error", (error) => {
      console.error("[Notification] Connection error:", error.message);
    });

    return () => {
      newSocket.disconnect();
      setSocket(null);
      connectedRef.current = false;
    };
  }, [isAuthenticated, user?.id, user?.role, addNotification]);

  // Function to mark chat notifications as read (when opening Messages)
  const markChatAsRead = useCallback(() => {
    setChatUnreadCount(0);
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      chatUnreadCount,
      socket,
      addNotification,
      markAsRead,
      markAllAsRead,
      markChatAsRead,
      clearAll
    }),
    [notifications, unreadCount, chatUnreadCount, socket, addNotification, markAsRead, markAllAsRead, markChatAsRead, clearAll]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }

  return context;
};

export { NotificationContext };
