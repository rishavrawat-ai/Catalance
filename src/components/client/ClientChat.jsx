"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { RoleAwareSidebar } from "@/components/dashboard/RoleAwareSidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { SendHorizontal, Paperclip, Bot, User, Loader2, Clock4, Check, CheckCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient, SOCKET_IO_URL, SOCKET_OPTIONS, SOCKET_ENABLED } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { ClientTopBar } from "@/components/client/ClientTopBar";
import { useSearchParams } from "react-router-dom";
import ProposalPanel from "./ProposalPanel";

const SERVICE_LABEL = "Project Chat";

const filterAssistantMessages = (list = []) =>
  list.filter((msg) => msg?.role !== "assistant");

const formatTime = (value) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const ChatArea = ({
  conversationName,
  avatar,
  messages,
  messageInput,
  onMessageInputChange,
  onSendMessage,
  sending,
  currentUser,
  typingUsers,
  online
}) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <div className="relative flex h-full flex-1 flex-col overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-background to-background/70">
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, var(--grid-line-color) 1px, transparent 0)",
          backgroundSize: "20px 20px",
        }}
      />
      <div className="sticky top-0 z-10 flex items-center gap-4 border-b border-border/40 bg-card/60 px-8 py-5 backdrop-blur-xl">
        <div className="relative">
          <Avatar className="h-12 w-12">
            <AvatarImage src={avatar} alt={conversationName} />
            <AvatarFallback className="bg-primary text-primary-foreground font-bold">
              {conversationName?.[0] || "C"}
            </AvatarFallback>
          </Avatar>
        </div>
        <div>
          <p className="text-lg font-semibold">{conversationName}</p>
          <p className="text-xs text-muted-foreground">
            {online ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto overflow-x-hidden px-6 py-4">
        {messages.map((message, index) => {
          const isSelf = (message.senderId && currentUser?.id && message.senderId == currentUser.id) || message.senderRole === "CLIENT";
          const isAssistant = message.role === "assistant";
          const align = isAssistant || !isSelf ? "justify-start" : "justify-end";
          const isDeleted = message.deleted || message.isDeleted;
          const bubbleClass = (() => {
            if (isAssistant) {
              return "bg-muted/50 text-muted-foreground border border-border/50";
            }
            if (isDeleted) {
              return "bg-muted/30 text-muted-foreground border border-border/50 italic";
            }
            if (isSelf) {
              // Self: Primary color (Yellow)
              return "bg-primary text-primary-foreground shadow-sm border-none shadow-sm";
            }
            // Received (Freelancer): Muted/Grey
            return "bg-card text-card-foreground border border-border/50 shadow-sm";
          })();

          const prevMessage = messages[index - 1];
          const currentDate = message.createdAt ? new Date(message.createdAt) : new Date();
          const prevDate = prevMessage?.createdAt ? new Date(prevMessage.createdAt) : null;
          const showDateDivider = !prevDate || !isSameDay(currentDate, prevDate);

          return (
            <React.Fragment key={message.id || index}>
              {showDateDivider && (
                <div className="flex justify-center my-4">
                  <span className="bg-muted/40 px-3 py-1 rounded-full text-[10px] uppercase font-medium tracking-wide text-muted-foreground/70">
                    {isToday(currentDate)
                      ? "Today"
                      : isYesterday(currentDate)
                      ? "Yesterday"
                      : format(currentDate, "MMMM d, yyyy")}
                  </span>
                </div>
              )}
              <div className={`flex ${align}`}>
                <div
                  className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-2.5 text-sm flex items-baseline gap-2 overflow-hidden ${
                    isSelf ? "rounded-tr-sm" : "rounded-tl-sm"
                  } ${bubbleClass}`}
                  role="group"
                >
                  {isDeleted ? (
                    <>
                      <Clock4 className="h-4 w-4 flex-shrink-0 opacity-70" />
                      <span className="italic text-foreground/90 flex-1">
                        {isSelf ? "You deleted this message." : "This message was deleted."}
                      </span>
                    </>
                  ) : (
                    <p
                      className="leading-relaxed whitespace-pre-wrap flex-1"
                      style={{
                        overflowWrap: "break-word",
                        wordBreak: "break-all"
                      }}
                    >
                      {message.content}
                    </p>
                  )}
                  <div className="flex items-center gap-1 self-end mt-1">
                    {message.createdAt ? (
                      <span className="text-[10px] lowercase opacity-70 whitespace-nowrap">
                        {formatTime(message.createdAt)}
                      </span>
                    ) : null}
                    {isSelf && (
                      <span className="ml-1" title={message.readAt ? `Read ${formatTime(message.readAt)}` : "Sent"}>
                        {message.readAt ? (
                          <CheckCheck className="h-3.5 w-3.5 text-blue-600" strokeWidth={2.5} />
                        ) : (
                          <Check className="h-3.5 w-3.5 text-black/50" strokeWidth={2} />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        {typingUsers.length > 0 ? (
          <div className="flex justify-start">
            <div className="max-w-[60%] rounded-sm border border-border/60 bg-card/70 px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                {typingUsers[0]} {typingUsers.length > 1 ? "and others" : ""} typing...
              </span>
            </div>
          </div>
        ) : null}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border/40 px-6 py-5">
        <div className="flex items-center gap-3 rounded-full bg-card/60 px-4 py-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-muted"
            type="button"
            disabled
            title="Attachments coming soon"
          >
            <Paperclip className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Input
            placeholder="Type a message..."
            value={messageInput}
            onChange={(event) => onMessageInputChange(event.target.value)}
            onKeyDown={handleKeyPress}
            className="border-none bg-transparent focus-visible:ring-0"
            disabled={sending}
          />
          <Button
            onClick={onSendMessage}
            size="icon"
            className="rounded-full bg-primary"
            disabled={sending || !messageInput.trim()}
          >
            <SendHorizontal className="h-5 w-5 text-primary-foreground" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const ClientChatContent = () => {
  const { user, authFetch, token, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { socket: notificationSocket } = useNotifications();
  const [searchParams] = useSearchParams();
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [useSocket, setUseSocket] = useState(SOCKET_ENABLED);
  const socketRef = useRef(null);
  const pollRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const drafts = useRef({});
  const [typingUsers, setTypingUsers] = useState([]);
  const [online, setOnline] = useState(false);
  const seededAutoMessage = useRef(new Set());

  // Reset state when switching conversation to avoid cross-chat bleed.
  useEffect(() => {
    setConversationId(null);
    setMessages([]);
    setTypingUsers([]);
    setOnline(false);
  }, [selectedConversation?.serviceKey, selectedConversation?.id]);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const fetchMessages = async () => {
    if (!conversationId) return;
    try {
      if (token && isAuthenticated && authFetch) {
        const response = await authFetch(`/chat/conversations/${conversationId}/messages`, {
          method: "GET",
          skipLogoutOn401: true
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch messages (status ${response.status})`);
        }
        const payload = await response.json().catch(() => null);
        const nextMessages =
          payload?.data?.messages || payload?.messages || [];
        setMessages(filterAssistantMessages(nextMessages));
      } else {
        const payload = await apiClient.fetchChatMessages(conversationId);
        const nextMessages =
          payload?.data?.messages || payload?.messages || [];
        setMessages(filterAssistantMessages(nextMessages));
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  const emitTyping = () => {
    if (!useSocket || !socketRef.current || !conversationId) return;
    const payload = {
      conversationId,
      typing: true,
      userId: user?.id || socketRef.current.id,
      userName: user?.fullName || user?.name || user?.email || "Someone"
    };
    socketRef.current.emit("chat:typing", payload);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("chat:typing", {
        ...payload,
        typing: false
      });
    }, 1500);
  };

  const startPolling = () => {
    stopPolling();
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 5000);
  };

  // Load conversations based on proposals (active freelancers)
  useEffect(() => {
    let cancelled = false;
    const loadConversations = async () => {
      if (!authFetch || !token || !isAuthenticated || authLoading) {
        setLoading(false);
        return;
      }
      try {
        // Fetch proposals where I am the owner of the project
        const response = await authFetch("/proposals?as=owner", {
          skipLogoutOn401: true
        });

        if (response.status === 401) {
          if (!cancelled) {
            setConversations([]);
            setSelectedConversation(null);
          }
          return;
        }

        const payload = await response.json().catch(() => null);
        const items = Array.isArray(payload?.data) ? payload.data : [];

        const uniq = [];
        const seen = new Set();

        for (const item of items) {
          // Filter: Only show accepted proposals (active projects)
          if (item.status !== "ACCEPTED") continue;

          const freelancer = item.freelancer;
          if (!freelancer?.id) continue;

          // Filter: Exclude self if the current user is listed as the freelancer
          if (freelancer.id === user?.id) continue;
          
          const projectId = item.project?.id;
          if (!projectId) continue;

          // Create unique key PER PROJECT (not per freelancer)
          // Format: CHAT:PROJECT_ID:CLIENT_ID:FREELANCER_ID
          const sharedKey = `CHAT:${projectId}:${user?.id}:${freelancer.id}`;
          
          // Dedupe by project (not by freelancer)
          if (seen.has(sharedKey)) continue;
          seen.add(sharedKey);

          uniq.push({
            id: projectId, // Use projectId as the conversation id
            freelancerId: freelancer.id,
            name: freelancer.fullName || freelancer.name || freelancer.email || "Freelancer",
            avatar: freelancer.avatar,
            label: item.project?.title || "Project Chat",
            serviceKey: sharedKey,
            projectTitle: item.project?.title || "Project Chat",
            // Add timestamp for sorting - use backend provided lastActivity if available
            lastActivity: new Date(item.lastActivity || item.updatedAt || item.createdAt || 0).getTime(),
            unreadCount: 0
          });
        }

        // Sort by most recent activity (newest first)
        const finalList = uniq.sort((a, b) => b.lastActivity - a.lastActivity);

        if (!cancelled) {
          setConversations(finalList);
          // Default to param-based or first conversation if none selected
          if (!selectedConversation) {
             const paramProjectId = searchParams.get("projectId");
             let target = null;

             if (paramProjectId) {
                target = finalList.find(c => String(c.id) === String(paramProjectId));
             }

             if (!target && finalList.length > 0) {
               target = finalList[0];
             }
             setSelectedConversation(target || null);
          }
        }
      } catch (error) {
        console.error("Failed to load conversations:", error);
        if (!cancelled) setConversations([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadConversations();
    return () => {
      cancelled = true;
    };
  }, [authFetch, user?.id, token, isAuthenticated, authLoading]);

  useEffect(() => {
    if (!selectedConversation) return;
    let cancelled = false;

    const ensureConversation = async () => {
      const baseKey = selectedConversation.serviceKey || selectedConversation.id;
      const storageKey = `markify:chatConversationId:${baseKey}`;

      try {
        const stored =
          typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null;
        
        if (stored) {
          setConversationId(stored);
          return;
        }

        if (!authFetch || !token || !isAuthenticated) {
          return;
        }

        const response = await authFetch("/chat/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            service: selectedConversation.serviceKey || selectedConversation.label || SERVICE_LABEL,
            projectTitle: selectedConversation.projectTitle || selectedConversation.label || "Project Chat"
          }),
          skipLogoutOn401: true
        });
        if (response.status === 401) {
          return;
        }
        const payload = await response.json().catch(() => null);
        const conversation = payload?.data || payload;
        if (!cancelled && conversation?.id) {
          setConversationId(conversation.id);
          if (typeof window !== "undefined") {
            window.localStorage.setItem(storageKey, conversation.id);
          }
        }
      } catch (error) {
        console.error("Failed to start chat conversation:", error);
      }
    };
    ensureConversation();

    return () => {
      cancelled = true;
    };
  }, [selectedConversation]);

  useEffect(() => {
    if (!conversationId || !selectedConversation) return;

    const storageKey = `markify:chatConversationId:${selectedConversation.serviceKey || selectedConversation.id}`;
    const socket = useSocket && SOCKET_IO_URL ? io(SOCKET_IO_URL, SOCKET_OPTIONS) : null;
    socketRef.current = socket;

    if (!socket) {
      startPolling();
      return () => stopPolling();
    }

    socket.emit("chat:join", {
      conversationId,
      service: selectedConversation.serviceKey || selectedConversation.label || SERVICE_LABEL,
      senderId: user?.id || null
    });

    socket.on("chat:joined", (payload) => {
      if (payload?.conversationId) {
        setConversationId(payload.conversationId);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(storageKey, payload.conversationId);
        }
        // Mark as read immediately upon joining
        socket.emit("chat:read", { conversationId: payload.conversationId, userId: user?.id });
      }
    });

    socket.on("chat:read_receipt", ({ conversationId: cid, readerId, readAt }) => {
       if (cid !== conversationId) return;
       setMessages(prev => prev.map(msg => {
         // Mark all messages sent by ME (or as 'user') as read if reader is someone else
         // Simplification: just mark anything unread as read if it's not the reader's own message
         // But effectively, if we get a receipt, it implies the other person read everything visible.
         // We'll update independent of who sent it for consistency, or check senderId.
         if (msg.senderId === user?.id || msg.role === "user") { 
             return { ...msg, readAt: readAt || new Date().toISOString() };
         }
         return msg;
       }));
    });

    socket.on("chat:history", (history = []) => {
      const sorted = [...history].sort(
        (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
      );
      setMessages(filterAssistantMessages(sorted));

      if (
        sorted.length === 0 &&
        selectedConversation?.accepted &&
        conversationId &&
        !seededAutoMessage.current.has(conversationId)
      ) {
        seededAutoMessage.current.add(conversationId);
        socket.emit("chat:message", {
          conversationId,
          content: "Freelancer accepted the project.",
          service: selectedConversation.serviceKey || selectedConversation.label || SERVICE_LABEL,
          senderId: selectedConversation.id || null,
          senderRole: "FREELANCER",
          senderName: selectedConversation.name || "Freelancer",
          skipAssistant: true
        });
      }
    });

    socket.on("chat:message", (message) => {
      if (message?.role === "assistant") {
        setSending(false);
        return;
      }
      setMessages((prev) => {
        const filtered = prev.filter(
          (msg) =>
            !msg.pending ||
            msg.content !== message?.content ||
            msg.role !== message?.role
        );
        return [...filtered, message];
      });
      setSending(false);
      
      // Move this conversation to the top (local update for active chat)
      setConversations((prev) => {
        const updated = prev.map((conv) => {
          if ((conv.serviceKey || conv.id) === (selectedConversation?.serviceKey || selectedConversation?.id)) {
            return { ...conv, lastActivity: Date.now() };
          }
          return conv;
        });
        return updated.sort((a, b) => (b.lastActivity || 0) - (a.lastActivity || 0));
      });


      // If we are viewing this conversation, mark the new message as read immediately
      if (message.conversationId === conversationId && message.senderId !== user?.id) {
         socket.emit("chat:read", { conversationId, userId: user?.id });
      }
    });





    socket.on("chat:error", (payload) => {
      console.error("Socket error:", payload);
      setSending(false);
    });

    socket.on("chat:typing", ({ conversationId: cid, typing, userId: uid, userName }) => {
      if (!cid || cid !== conversationId) return;
      if (uid && user?.id && uid === user.id) return;
      setTypingUsers((prev) => {
        const existing = new Map(prev.map((u) => [u.id, u.name]));
        if (typing) {
          existing.set(uid || userName || "unknown", userName || "Someone");
        } else {
          existing.delete(uid || userName || "unknown");
        }
        return Array.from(existing.entries()).map(([id, name]) => ({
          id,
          name
        }));
      });
    });

    socket.on("chat:presence", ({ conversationId: cid, online: list = [] }) => {
      if (!cid || cid !== conversationId) return;
      const selfId = user?.id;
      const othersOnline = list.some((id) => (selfId ? id !== selfId : true));
      setOnline(othersOnline);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error?.message || error);
      setUseSocket(false);
      stopPolling();
      startPolling();
      socket.disconnect();
    });

    return () => {
      stopPolling();
      if (socket) {
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [conversationId, selectedConversation, useSocket, user?.id]);

  // Separate effect for global notifications (sorting and unread counts)
  useEffect(() => {
    if (!notificationSocket) return;

    const handleNotification = (data) => {
      console.log("[ClientChat] Notification received:", data); // Debug log
      if (data.type === "chat" && data.data) {
         const { service, senderId } = data.data;
         
         setConversations((prev) => {
           console.log("[ClientChat] Updating conversations for service:", service, "Sender:", senderId);
           const updated = prev.map(c => {
             // Match by serviceKey (best) or ID (fallback)
             const isMatch = (c.serviceKey && c.serviceKey === service) || 
                             (c.id === senderId); // Match freelancer ID
             
             if (isMatch) {
               console.log("[ClientChat] Matched conversation:", c.name);
               // Check if this conversation is currently selected
               const isSelected = (c.serviceKey || c.id) === (selectedConversation?.serviceKey || selectedConversation?.id);
               return { 
                 ...c, 
                 lastActivity: Date.now(),
                 unreadCount: isSelected ? 0 : (c.unreadCount || 0) + 1
               };
             }
             return c;
           });
           
           return updated.sort((a, b) => (b.lastActivity || 0) - (a.lastActivity || 0));
         });
      }
    };
    
    notificationSocket.on("notification:new", handleNotification);
    return () => {
      notificationSocket.off("notification:new", handleNotification);
    };
  }, [notificationSocket, selectedConversation]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !conversationId) return;

    const payload = {
      conversationId,
      content: messageInput,
      service: selectedConversation?.serviceKey || selectedConversation?.label || SERVICE_LABEL,
      senderId: user?.id || null,
      senderRole: user?.role || "GUEST",
      senderName: user?.fullName || user?.name || user?.email || "Client",
      skipAssistant: true
    };

    setMessages((prev) => [...prev, { ...payload, role: "user", pending: true }]);
    setMessageInput("");
    setSending(true);
    
    // Move this conversation to the top immediately when sending (like WhatsApp)
    setConversations((prev) => {
      const updated = prev.map((conv) => {
        if ((conv.serviceKey || conv.id) === (selectedConversation?.serviceKey || selectedConversation?.id)) {
          return { ...conv, lastActivity: Date.now() };
        }
        return conv;
      });
      return updated.sort((a, b) => (b.lastActivity || 0) - (a.lastActivity || 0));
    });

    if (useSocket && socketRef.current) {
      socketRef.current.emit("chat:message", payload);
    } else {
      const sender = token && isAuthenticated && authFetch
        ? authFetch(`/chat/conversations/${conversationId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...payload, conversationId }),
            skipLogoutOn401: true
          }).then(async (response) => {
            if (!response.ok) {
              throw new Error(`Send failed (status ${response.status})`);
            }
            const resPayload = await response.json().catch(() => null);
            return resPayload?.data?.message || resPayload?.message || payload;
          })
        : apiClient
            .sendChatMessage({ ...payload, conversationId })
            .then((res) => res?.data?.message || res?.message || payload);

      sender
        .then((userMsg) => {
          setMessages((prev) => {
            const filtered = prev.filter(
              (msg) =>
                !msg.pending ||
                msg.content !== payload.content ||
                msg.role !== "user"
            );
            return [...filtered, userMsg];
          });
        })
        .catch((error) => {
          console.error("Failed to send message via HTTP:", error);
        })
        .finally(() => setSending(false));
    }
  };

  const handleInputChange = (value) => {
    setMessageInput(value);
    emitTyping();
  };

  const activeMessages = useMemo(() => messages, [messages]);

  // Find the latest proposal
  const proposalMessage = useMemo(() => {
    return [...messages]
      .reverse()
      .find(
        (m) =>
          typeof m?.content === "string" &&
          /\[PROPOSAL_DATA\][\s\S]*?\[\/PROPOSAL_DATA\]/.test(m.content)
      );
  }, [messages]);

  return (
    <div className="flex h-screen flex-col gap-4 overflow-hidden p-2">
      <ClientTopBar />

      <div className={`grid h-full gap-4 overflow-hidden ${proposalMessage ? "lg:grid-cols-[320px_minmax(0,1fr)_400px]" : "lg:grid-cols-[320px_minmax(0,1fr)]"}`}>
        <Card className="border border-border/50 bg-card/70">
          <CardContent className="flex h-full flex-col gap-4 overflow-hidden p-4">
            <div className="border-b border-border/40 pb-4 space-y-1">
              <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">
                Conversations
              </p>
              {selectedConversation?.name ? (
                <p className="text-lg font-semibold">{selectedConversation.name}</p>
              ) : null}
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading chats...
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center space-y-3 py-10 text-center text-sm text-muted-foreground">
                  <div className="rounded-full bg-muted p-3">
                    <SendHorizontal className="h-6 w-6 opacity-30" />
                  </div>
                  <p>No conversations yet.</p>
                  <p className="text-xs opacity-60">
                    Accepted proposals will appear here.
                  </p>
                </div>
              ) : (
                conversations.map((conversation) => {
                  const isActive =
                    (conversation.serviceKey || conversation.id) ===
                    (selectedConversation?.serviceKey || selectedConversation?.id);
                  const nameClass = isActive ? "text-black font-bold" : "text-foreground";
                  const labelClass = isActive ? "text-gray-800" : "text-muted-foreground";
                  return (
                    <button
                      key={conversation.serviceKey || conversation.id}
                      className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${isActive
                        ? "bg-primary border-primary shadow-sm"
                        : "border-border/50 hover:border-primary/30 hover:bg-muted/50"
                        }`}
                      onClick={() => {
                        // Save draft for current conversation
                        if (selectedConversation) {
                          const currentKey = selectedConversation.serviceKey || selectedConversation.id;
                          drafts.current[currentKey] = messageInput;
                        }

                        // Load draft for new conversation
                        const newKey = conversation.serviceKey || conversation.id;
                        setMessageInput(drafts.current[newKey] || "");

                        setMessages([]);
                        setConversationId(null);
                        setSelectedConversation(conversation);
                        // Reset unread count
                        setConversations(prev => prev.map(c => 
                          (c.serviceKey === conversation.serviceKey) ? { ...c, unreadCount: 0 } : c
                        ));
                      }}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={conversation.avatar}
                          alt={conversation.name}
                        />
                        <AvatarFallback className={`${isActive ? "bg-primary-foreground text-primary" : "bg-primary text-primary-foreground"} font-bold`}>
                          {conversation.name?.[0] || "C"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between items-center mb-1">
                          <p className={`truncate font-medium transition-colors ${nameClass}`}>
                            {conversation.label}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className={`truncate text-xs transition-colors ${labelClass}`}>
                          {conversation.name}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {selectedConversation ? (
          <>
            <ChatArea
              conversationName={selectedConversation?.label || selectedConversation?.name || SERVICE_LABEL}
              avatar={selectedConversation?.avatar}
              messages={activeMessages}
              messageInput={messageInput}
              onMessageInputChange={handleInputChange}
              onSendMessage={handleSendMessage}
              sending={sending}
              currentUser={user}
              typingUsers={typingUsers.map((u) => u.name)}
              online={online}
            />
            {proposalMessage && (
              <ProposalPanel content={proposalMessage.content} />
            )}
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 rounded-3xl border border-border/40 bg-card/30 p-8 text-center backdrop-blur-sm">
            <div className="rounded-full bg-muted/50 p-6">
              <Paperclip className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">No Chat Selected</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                Select a conversation from the sidebar to send messages or review proposals.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ClientChat = () => (
  <RoleAwareSidebar>
    <ClientChatContent />
  </RoleAwareSidebar>
);

export default ClientChat;
