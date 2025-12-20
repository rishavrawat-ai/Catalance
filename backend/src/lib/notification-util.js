// Notification utility - shared socket.io reference for sending notifications
// This avoids circular dependencies between socket.js and controllers

let io = null;

// Set the socket.io instance (called from socket.js when initialized)
export const setIoInstance = (ioInstance) => {
  io = ioInstance;
  console.log("[NotificationUtil] Socket.IO instance set");
};

// Get the socket.io instance
export const getIoInstance = () => io;

// Send a notification to a specific user
export const sendNotificationToUser = (userId, notification) => {
  if (!io || !userId) {
    console.log(`[NotificationUtil] ❌ Cannot send - io: ${!!io}, userId: ${userId}`);
    return false;
  }
  
  const roomName = `user:${userId}`;
  const payload = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    ...notification,
    createdAt: new Date().toISOString()
  };
  
  // Debug: Check if anyone is in this room
  const room = io.sockets.adapter.rooms.get(roomName);
  const socketsInRoom = room ? room.size : 0;
  
  console.log(`[NotificationUtil] 📤 Sending to room "${roomName}": ${socketsInRoom} socket(s) connected`);
  console.log(`[NotificationUtil] 📦 Payload:`, { type: notification.type, title: notification.title });
  
  io.to(roomName).emit("notification:new", payload);
  
  if (socketsInRoom === 0) {
    console.log(`[NotificationUtil] ⚠️ Warning: No sockets in room ${roomName}. User may not be connected.`);
  } else {
    console.log(`[NotificationUtil] ✅ Notification sent to ${socketsInRoom} socket(s) in ${roomName}`);
  }
  
  return true;
};
