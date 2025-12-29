import { useState, useEffect, useRef, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, User, Bot, RotateCcw } from "lucide-react";
import AITextLoading from "@/components/kokonutui/ai-text-loading";
import { apiClient, SOCKET_IO_URL, SOCKET_OPTIONS, SOCKET_ENABLED } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { io } from "socket.io-client";
import ProposalPanel from "./ProposalPanel";

const getMessageStorageKey = (serviceKey) =>
  serviceKey ? `markify:chatMessages:${serviceKey}` : null;

const loadMessagesFromStorage = (key) => {
  if (typeof window === "undefined" || !key) return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const persistMessagesToStorage = (key, messages) => {
  if (typeof window === "undefined" || !key) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(messages));
  } catch {
    // ignore write errors (quota, private mode, etc.)
  }
};

const RESPONSE_TIMEOUT_MS = 25000;
const normalizeContent = (value) => (value || "").trim();

const ChatDialog = ({ isOpen, onClose, service, services }) => {
  const serviceList = useMemo(() => {
    if (Array.isArray(services) && services.length) return services;
    return service ? [service] : [];
  }, [services, service]);
  const serviceListSignature = useMemo(
    () => serviceList.map((item) => item?.title || "").join("|"),
    [serviceList]
  );
  const isMultiService = serviceList.length > 1;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [activeServiceIndex, setActiveServiceIndex] = useState(0);
  const [activeProposalServiceKey, setActiveProposalServiceKey] = useState(null);
  const safeWindow = typeof window === "undefined" ? null : window;
  const isLocalhost = safeWindow?.location?.hostname === "localhost";
  const [useSocket] = useState(SOCKET_ENABLED && isLocalhost);
  const [answeredOptions, setAnsweredOptions] = useState({});
  const { user } = useAuth();
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const socketRef = useRef(null);
  const loadingSinceRef = useRef(null);
  const responseTimeoutRef = useRef(null);
  const multiServiceSessionsRef = useRef(new Map());
  const completedServiceRef = useRef(new Set());
  const activeService = serviceList[activeServiceIndex] || service;
  const serviceKey = activeService?.title || "Project";
  const serviceStateRef = useRef(new Map());
  const previousServiceKeyRef = useRef(serviceKey);
  const messageStorageKey = useMemo(() => getMessageStorageKey(serviceKey), [serviceKey]);
  const getMessageKey = (msg, index) =>
    msg?.id || msg?._id || msg?.createdAt || `${msg?.serviceKey || "service"}-${index}`;

  // Pricing features removed - no longer showing pricing info in chat


  const formatTime = (value) => {
    if (!value) return "";
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const clearResponseTimeout = () => {
    if (responseTimeoutRef.current) {
      clearTimeout(responseTimeoutRef.current);
      responseTimeoutRef.current = null;
    }
  };

  const startResponseTimeout = (content) => {
    clearResponseTimeout();
    const expected = normalizeContent(content);
    responseTimeoutRef.current = setTimeout(() => {
      setIsLoading(false);
      setMessages((prev) =>
        prev.map((msg) => {
          const isPendingUser =
            msg?.pending &&
            (msg?.role || "").toLowerCase() === "user" &&
            normalizeContent(msg?.content) === expected;
          if (!isPendingUser) return msg;
          return { ...msg, pending: false, failed: true };
        })
      );
      responseTimeoutRef.current = null;
    }, RESPONSE_TIMEOUT_MS);
  };

  useEffect(() => {
    if (!isMultiService) return;
    setActiveServiceIndex(0);
    setActiveProposalServiceKey(null);
    setMessages([]);
    setConversationId(null);
    setAnsweredOptions({});
    setIsLoading(false);
    clearResponseTimeout();
    loadingSinceRef.current = null;
    multiServiceSessionsRef.current = new Map();
    completedServiceRef.current = new Set();
  }, [isMultiService, serviceListSignature]);

  useEffect(() => {
    const previousKey = previousServiceKeyRef.current;
    if (previousKey === serviceKey) return;

    if (isMultiService) {
      if (previousKey) {
        multiServiceSessionsRef.current.set(previousKey, {
          conversationId,
          answeredOptions,
        });
      }

      previousServiceKeyRef.current = serviceKey;

      const cached = multiServiceSessionsRef.current.get(serviceKey);
      setConversationId(cached?.conversationId || null);
      setAnsweredOptions(cached?.answeredOptions || {});
      setInput("");
      clearResponseTimeout();
      setIsLoading(false);
      loadingSinceRef.current = null;
      return;
    }

    if (previousKey) {
      serviceStateRef.current.set(previousKey, {
        conversationId,
        messages,
        answeredOptions,
      });
    }

    previousServiceKeyRef.current = serviceKey;

    const cached = serviceStateRef.current.get(serviceKey);
    const storageKey = `markify:chatConversationId:${serviceKey}`;
    const storedConversationId =
      isLocalhost && typeof window !== "undefined"
        ? window.localStorage.getItem(storageKey)
        : null;
    const storedMessages = loadMessagesFromStorage(getMessageStorageKey(serviceKey));

    setConversationId(cached?.conversationId || storedConversationId || null);
    setMessages(Array.isArray(cached?.messages) ? cached.messages : storedMessages);
    setAnsweredOptions(cached?.answeredOptions || {});
    setInput("");
    clearResponseTimeout();
    setIsLoading(false);
    loadingSinceRef.current = null;
  }, [serviceKey, isLocalhost, isMultiService, messages, conversationId, answeredOptions]);

  // Start or resume a conversation, persisting the id for the session.
  useEffect(() => {
    if (!isOpen || conversationId) return;

    let cancelled = false;

    const ensureConversation = async () => {
      try {
        const storageKey = `markify:chatConversationId:${serviceKey}`;
        if (!isMultiService) {
          // In production, always start a fresh conversation to avoid stale IDs that 404 after deploys.
          if (!isLocalhost && typeof window !== "undefined") {
            window.localStorage.removeItem(storageKey);
          }

          const stored =
            isLocalhost && typeof window !== "undefined"
              ? window.localStorage.getItem(storageKey)
              : null;

          if (stored && isLocalhost) {
            setConversationId(stored);
            return;
          }
        }

        const conversation = await apiClient.createChatConversation({
          service: serviceKey,
          mode: "assistant",
          // Persist conversations in production; only ephemeral for local dev.
          ephemeral: isLocalhost
        });

        if (!cancelled && conversation?.id) {
          setConversationId(conversation.id);
          if (!isMultiService && typeof window !== "undefined") {
            window.localStorage.setItem(storageKey, conversation.id);
          }
          if (isMultiService) {
            multiServiceSessionsRef.current.set(serviceKey, {
              conversationId: conversation.id,
              answeredOptions,
            });
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
  }, [conversationId, isLocalhost, isOpen, serviceKey, isMultiService, answeredOptions]);

  // Load local chat history for this service if present.
  useEffect(() => {
    if (isMultiService || !isOpen || messages.length > 0) return;
    const stored = loadMessagesFromStorage(messageStorageKey);
    if (stored.length) {
      setMessages(stored);
    }
  }, [isOpen, messages.length, messageStorageKey, isMultiService]);

  // Wire up socket.io for real-time chat.
  useEffect(() => {
    if (!isOpen || !conversationId || !useSocket || !SOCKET_IO_URL) return;

    const socket = io(SOCKET_IO_URL, SOCKET_OPTIONS);
    socketRef.current = socket;

    socket.emit("chat:join", { conversationId, service: activeService?.title });

    socket.on("chat:joined", (payload) => {
      if (payload?.conversationId) {
        setConversationId(payload.conversationId);
      }
    });

    socket.on("chat:history", (history = []) => {
      if (isMultiService) return;
      const sorted = [...history].sort((a, b) =>
        new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
      );
      setMessages(sorted);
      persistMessagesToStorage(messageStorageKey, sorted);
    });

    socket.on("chat:message", (message) => {
      setMessages((prev) => {
        const incomingContent = (message?.content || "").trim();
        const incomingRole = (message?.role || "").toLowerCase();
        const isAssistantMessage = incomingRole === "assistant";
        const incomingMessage = message?.serviceKey
          ? message
          : { ...message, serviceKey };

        // Remove optimistic messages that match the incoming one to avoid duplicates.
        const filtered = prev.filter((msg) => {
          const isOptimistic = msg.pending || msg.optimistic || msg.failed;
          if (!isOptimistic) return true;

          const optimisticContent = (msg.content || "").trim();
          const optimisticRole = (msg.role || "").toLowerCase();

          const isSameContent = optimisticContent === incomingContent;
          const isSameRole = optimisticRole === incomingRole;

          if (isSameContent && isSameRole) return false;

          return true;
        });

        const finish = (currentMessages) => {
          // Double check: ensure we don't append a duplicate of the VERY LAST message
          // This handles echoes that might slip through if timing is off
          const lastMsg = currentMessages[currentMessages.length - 1];
          if (lastMsg && !lastMsg.pending &&
            (lastMsg.content || "").trim() === incomingContent &&
            lastMsg.role === incomingMessage?.role) {
            return currentMessages;
          }

          const next = [...currentMessages, incomingMessage];
          if (!isMultiService) {
            persistMessagesToStorage(messageStorageKey, next);
          }

          // Only set loading to false when we receive an assistant message
          if (isAssistantMessage) {
            clearResponseTimeout();
            setIsLoading(false);
          }

          return next;
        };
        if (message?.role === "assistant") {
          const minDelay = 700;
          const elapsed = loadingSinceRef.current
            ? Date.now() - loadingSinceRef.current
            : 0;
          const delay = Math.max(0, minDelay - elapsed);
          if (delay > 0) {
            setTimeout(() => {
              setMessages((prevInner) => finish(prevInner));
            }, delay);
            return filtered;
          }
        }
        return finish(filtered);
      });
    });

    socket.on("chat:error", (payload) => {
      console.error("Socket error:", payload);
      const noticeContent =
        typeof payload?.message === "string" ? payload.message.trim() : "";
      setMessages((prev) => {
        const clearedPending = prev.map((msg) =>
          msg?.pending ? { ...msg, pending: false, optimistic: true } : msg
        );
        let next = clearedPending;

        if (noticeContent) {
          const lastMsg = clearedPending[clearedPending.length - 1];
          const lastContent = (lastMsg?.content || "").trim();
          const lastRole = (lastMsg?.role || "").toLowerCase();
          const isDuplicate =
            lastRole === "assistant" && lastContent === noticeContent;

          if (!isDuplicate) {
            next = [
              ...clearedPending,
              {
                role: "assistant",
                senderName: "Cata",
                senderRole: "assistant",
                content: noticeContent,
                localOnly: true,
                serviceKey,
                createdAt: new Date().toISOString()
              }
            ];
          }
        }

        if (!isMultiService) {
          persistMessagesToStorage(messageStorageKey, next);
        }
        return next;
      });
      clearResponseTimeout();
      setIsLoading(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [conversationId, isOpen, activeService, useSocket, isMultiService, messageStorageKey, serviceKey]);

  // Fallback: fetch messages when sockets are disabled/unavailable.
  useEffect(() => {
    if (isMultiService || !isOpen || !conversationId || useSocket) return;

    const storageKey = `markify:chatConversationId:${serviceKey}`;

    const load = async () => {
      try {
        const payload = await apiClient.fetchChatMessages(conversationId);
        const nextMessages =
          payload?.data?.messages || payload?.messages || [];
        setMessages(nextMessages);
        persistMessagesToStorage(messageStorageKey, nextMessages);
      } catch (error) {
        console.error("Failed to load messages (HTTP):", error);
        const notFound = (error?.message || "").toLowerCase().includes("not found");

        if (notFound) {
          try {
            if (typeof window !== "undefined") {
              window.localStorage.removeItem(storageKey);
              window.localStorage.removeItem(messageStorageKey);
            }
            setConversationId(null);
            setMessages([]);

            const conversation = await apiClient.createChatConversation({
              service: serviceKey,
              mode: "assistant",
              ephemeral: isLocalhost
            });

            if (conversation?.id) {
              setConversationId(conversation.id);
              if (typeof window !== "undefined") {
                window.localStorage.setItem(storageKey, conversation.id);
              }
            }
          } catch (recoveryError) {
            console.error("Failed to recover chat conversation:", recoveryError);
          }
        }
      }
    };

    load();
  }, [conversationId, isOpen, useSocket, messageStorageKey, serviceKey, isLocalhost, isMultiService]);

  // Seed an opening prompt if there is no history.
  useEffect(() => {
    if (!isOpen || !activeService) return;

    if (isMultiService) {
      const hasServiceMessages = messages.some(
        (msg) => msg?.serviceKey === serviceKey && !msg?.localOnly
      );
      if (hasServiceMessages) return;

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Hi! I see you're interested in ${activeService.title}. How can I help you with that?`,
          serviceKey,
        }
      ]);
      queueMicrotask(() => {
        inputRef.current?.focus();
      });
      return;
    }

    if (messages.length) return;

    setMessages([
      {
        role: "assistant",
        content: `Hi! I see you're interested in ${activeService.title}. How can I help you with that?`
      }
    ]);

    queueMicrotask(() => {
      inputRef.current?.focus();
    });
  }, [isOpen, activeService, messages, isMultiService, serviceKey]);

  // Persist any message changes to local storage for this service.
  useEffect(() => {
    if (isMultiService || !messageStorageKey) return;
    persistMessagesToStorage(messageStorageKey, messages);
  }, [messages, messageStorageKey, isMultiService]);

  const handleSend = async (contentOverride) => {
    const msgContent = contentOverride || input;
    if (!msgContent.trim()) return;

    let activeConversationId = conversationId;
    if (!activeConversationId) {
      try {
        const storageKey = `markify:chatConversationId:${serviceKey}`;
        const conversation = await apiClient.createChatConversation({
          service: serviceKey,
          mode: "assistant",
          ephemeral: isLocalhost,
        });

        if (conversation?.id) {
          activeConversationId = conversation.id;
          setConversationId(conversation.id);
          if (!isMultiService && isLocalhost && typeof window !== "undefined") {
            window.localStorage.setItem(storageKey, conversation.id);
          }
        }
      } catch (error) {
        console.error("Failed to initialize chat conversation:", error);
      }
    }

    if (!activeConversationId) return;

    const filteredHistory = messages
      .filter((m) => {
        if (m?.pending || m?.failed || m?.localOnly) return false;
        if (!isMultiService) return true;
        return (m?.serviceKey || serviceKey) === serviceKey;
      })
      .slice(-50)
      .map((m) => ({
        role:
          (m?.role || "").toLowerCase() === "assistant" ||
            (m?.senderName || "").toLowerCase() === "assistant"
            ? "assistant"
            : "user",
        content: m?.content || ""
      }));

    const payload = {
      conversationId: activeConversationId,
      content: msgContent,
      service: serviceKey,
      senderId: user?.id || null,
      senderRole: user?.role || null,
      skipAssistant: false,
      mode: "assistant",
      ephemeral: isLocalhost,
      history: filteredHistory,
      serviceKey
    };

    if (useSocket && socketRef.current) {
      setMessages((prev) => [
        ...prev,
        { ...payload, role: "user", pending: true }
      ]);
      if (!contentOverride) setInput("");
      setIsLoading(true);
      startResponseTimeout(msgContent);
      loadingSinceRef.current = Date.now();
      socketRef.current.emit("chat:message", payload);
      queueMicrotask(() => {
        inputRef.current?.focus();
      });
      return;
    }

    // HTTP fallback when sockets are unavailable.
    setMessages((prev) => [
      ...prev,
      { ...payload, role: "user", pending: true }
    ]);
    if (!contentOverride) setInput("");
    setIsLoading(true);
    startResponseTimeout(msgContent);
    loadingSinceRef.current = Date.now();
    apiClient
      .sendChatMessage(payload)
      .then((response) => {
        const rawUserMsg =
          response?.data?.message || response?.message || payload;
        const userMsg = rawUserMsg?.serviceKey
          ? rawUserMsg
          : { ...rawUserMsg, serviceKey };
        const rawAssistant =
          response?.data?.assistant || response?.assistant || null;
        const assistant = rawAssistant
          ? rawAssistant?.serviceKey
            ? rawAssistant
            : { ...rawAssistant, serviceKey }
          : null;

        const responseConversationId =
          assistant?.conversationId || userMsg?.conversationId || null;
        if (responseConversationId && responseConversationId !== activeConversationId) {
          setConversationId(responseConversationId);
          if (isLocalhost && typeof window !== "undefined") {
            const storageKey = `markify:chatConversationId:${serviceKey}`;
            window.localStorage.setItem(storageKey, responseConversationId);
          }
        }

        const finish = () => {
          setMessages((prev) => {
            const normalized = normalizeContent(msgContent);
            const withoutPending = prev.filter((msg) => {
              if ((msg?.role || "").toLowerCase() !== "user") return true;
              const isOptimistic = msg?.pending || msg?.failed;
              if (!isOptimistic) return true;
              return normalizeContent(msg?.content) !== normalized;
            });
            const next = assistant
              ? [...withoutPending, userMsg, assistant]
              : [...withoutPending, userMsg];
            if (!isMultiService) {
              persistMessagesToStorage(messageStorageKey, next);
            }
            return next;
          });
          clearResponseTimeout();
          setIsLoading(false);
        };

        const minDelay = 700; // ms to simulate "thinking"
        const elapsed = loadingSinceRef.current
          ? Date.now() - loadingSinceRef.current
          : 0;
        const delay = Math.max(0, minDelay - elapsed);
        setTimeout(finish, delay);
      })
      .catch((error) => {
        console.error("Failed to send chat via HTTP:", error);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.pending && msg.role === "user" && msg.content === msgContent
              ? { ...msg, pending: false, failed: true }
              : msg
          )
        );
        clearResponseTimeout();
        setIsLoading(false);
      })
      .finally(() => {
        queueMicrotask(() => inputRef.current?.focus());
      });
  };

  const handleSuggestionSelect = (option, msgKey) => {
    setAnsweredOptions((prev) => ({ ...prev, [msgKey]: option }));
    handleSend(option);
  };

  const proposalMessages = useMemo(() => {
    const byService = new Map();
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const msg = messages[i];
      if (
        typeof msg?.content !== "string" ||
        !/\[PROPOSAL_DATA\][\s\S]*?\[\/PROPOSAL_DATA\]/.test(msg.content)
      ) {
        continue;
      }
      const key = msg?.serviceKey || serviceKey;
      if (!byService.has(key)) {
        byService.set(key, msg);
      }
    }

    const orderMap = new Map(
      serviceList.map((item, index) => [item?.title || "", index])
    );

    return Array.from(byService.entries())
      .map(([key, msg]) => ({ serviceKey: key, message: msg }))
      .sort((a, b) => {
        const orderA = orderMap.has(a.serviceKey) ? orderMap.get(a.serviceKey) : 999;
        const orderB = orderMap.has(b.serviceKey) ? orderMap.get(b.serviceKey) : 999;
        return orderA - orderB;
      });
  }, [messages, serviceKey, serviceList]);

  const proposalMessage = useMemo(() => {
    if (isMultiService) return null;
    return proposalMessages.length ? proposalMessages[proposalMessages.length - 1].message : null;
  }, [proposalMessages, isMultiService]);

  const hasProposals = isMultiService
    ? proposalMessages.length > 0
    : Boolean(proposalMessage);

  const selectedProposalMessage = useMemo(() => {
    if (!isMultiService) return proposalMessage;
    const activeKey =
      activeProposalServiceKey || proposalMessages[0]?.serviceKey || null;
    if (!activeKey) return null;
    return (
      proposalMessages.find((item) => item.serviceKey === activeKey)?.message ||
      proposalMessages[0]?.message ||
      null
    );
  }, [activeProposalServiceKey, isMultiService, proposalMessage, proposalMessages]);

  // Once a proposal is generated, drop any cached chat data so the next chat starts clean.
  useEffect(() => {
    if (isMultiService || !proposalMessage) return;
    const storageKey = `markify:chatConversationId:${serviceKey}`;
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(storageKey);
      if (messageStorageKey) {
        window.localStorage.removeItem(messageStorageKey);
      }
    }
  }, [proposalMessage, messageStorageKey, serviceKey, isMultiService]);

  const resolveSenderChip = (msg) => {
    if ((msg.role || "").toLowerCase() === "assistant" || (msg.senderName || "").toLowerCase() === "assistant") return "Cata";
    return "You";
  };

  useEffect(() => {
    if (!isMultiService || activeProposalServiceKey || proposalMessages.length === 0) return;
    setActiveProposalServiceKey(proposalMessages[0].serviceKey);
  }, [activeProposalServiceKey, isMultiService, proposalMessages]);

  useEffect(() => {
    if (!isMultiService || !serviceKey) return;
    const hasProposalForService = proposalMessages.some(
      (item) => item.serviceKey === serviceKey
    );
    if (!hasProposalForService) return;
    if (completedServiceRef.current.has(serviceKey)) return;

    completedServiceRef.current.add(serviceKey);
    setActiveProposalServiceKey((prev) => prev || serviceKey);

    const nextIndex = activeServiceIndex + 1;
    if (nextIndex >= serviceList.length) return;

    const nextService = serviceList[nextIndex];
    if (nextService?.title) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          senderName: "Cata",
          senderRole: "assistant",
          content: `Next, let's cover ${nextService.title}.`,
          localOnly: true,
          serviceKey: nextService.title,
          createdAt: new Date().toISOString()
        }
      ]);
    }
    setActiveServiceIndex(nextIndex);
  }, [activeServiceIndex, isMultiService, proposalMessages, serviceKey, serviceList]);

  useEffect(() => {
    if (!isMultiService || !serviceKey || !conversationId) return;
    const cached = multiServiceSessionsRef.current.get(serviceKey) || {};
    if (cached.conversationId !== conversationId || cached.answeredOptions !== answeredOptions) {
      multiServiceSessionsRef.current.set(serviceKey, {
        ...cached,
        conversationId,
        answeredOptions,
      });
    }
  }, [answeredOptions, conversationId, isMultiService, serviceKey]);

  useEffect(() => {
    // Auto-scroll to the latest message/loading indicator.
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, hasProposals]);

  const handleResetChat = () => {
    if (isMultiService) {
      clearResponseTimeout();
      setIsLoading(false);
      loadingSinceRef.current = null;
      setConversationId(null);
      setMessages([]);
      setAnsweredOptions({});
      setActiveServiceIndex(0);
      setActiveProposalServiceKey(null);
      multiServiceSessionsRef.current = new Map();
      completedServiceRef.current = new Set();
      return;
    }

    const storageKey = `markify:chatConversationId:${serviceKey}`;

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(storageKey);
      window.localStorage.removeItem(messageStorageKey);
    }
    serviceStateRef.current.delete(serviceKey);
    clearResponseTimeout();
    setIsLoading(false);
    loadingSinceRef.current = null;
    setConversationId(null);
    setMessages([]);
    setAnsweredOptions({});
    apiClient.createChatConversation({ service: serviceKey, forceNew: true, mode: "assistant", ephemeral: true }).then(conversation => {
      if (conversation?.id) {
        setConversationId(conversation.id);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(storageKey, conversation.id);
        }
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`h-[85vh] flex flex-col overflow-hidden transition-all duration-300 ${hasProposals ? "max-w-[90vw] lg:max-w-6xl" : "max-w-2xl"}`}>
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-4 pr-5">
          <div className="space-y-1">
            <DialogTitle>
              Chat about {activeService?.title || "Project"}{isMultiService ? ` (${activeServiceIndex + 1}/${serviceList.length})` : ""}
            </DialogTitle>
            <DialogDescription>
              Discuss your requirements and get a proposal.
            </DialogDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleResetChat} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            New Chat
          </Button>
        </DialogHeader>

        <div className={`flex-1 overflow-hidden grid gap-6 min-h-0 ${hasProposals ? "lg:grid-cols-[1fr_400px]" : "grid-cols-1"}`}>
          {/* Chat Area */}
          <div className="flex flex-col h-full min-h-0 overflow-hidden">
            <ScrollArea className="flex-1 min-h-0 pr-4">
              <div className="space-y-4 min-w-0 pb-4">
                {messages.map((msg, index) => {
                  const msgKey = getMessageKey(msg, index);
                  const isAssistant = (msg.role || "").toLowerCase() === "assistant" || (msg.senderName || "").toLowerCase() === "assistant";
                  // For AI chat: user messages (role !== "assistant") go on RIGHT
                  // Assistant messages go on LEFT
                  const isUserMessage = !isAssistant;
                  const alignment = isUserMessage ? "flex-row-reverse" : "flex-row";
                  const hasUserReplyAfter = messages
                    .slice(index + 1)
                    .some((next) => {
                      const nextIsAssistant =
                        (next.role || "").toLowerCase() === "assistant" ||
                        (next.senderName || "").toLowerCase() === "assistant";
                      return !nextIsAssistant;
                    });

                  const bubbleTone = (() => {
                    if (isAssistant) return "bg-muted text-foreground";
                    if (msg.senderRole === "CLIENT")
                      return "bg-amber-100 text-amber-900 dark:bg-amber-900/20 dark:text-amber-100";
                    if (msg.senderRole === "FREELANCER")
                      return "bg-sky-100 text-sky-900 dark:bg-sky-900/25 dark:text-sky-50";
                    // User messages in AI chat get primary color
                    return "bg-primary text-primary-foreground";
                  })();
                  const serviceLabel = msg?.serviceKey || serviceKey;
                  const previousServiceLabel = messages[index - 1]?.serviceKey || serviceKey;
                  const showServiceLabel =
                    isMultiService && serviceLabel && serviceLabel !== previousServiceLabel;

                  // Parse content for suggestions and multi-select
                  const suggestionMatch = msg.content?.match(/\[SUGGESTIONS:\s*([\s\S]*?)\]/i);
                  const suggestions = suggestionMatch ? suggestionMatch[1].split("|").map(s => s.trim()) : [];

                  const multiSelectMatch = msg.content?.match(/\[MULTI_SELECT:\s*([\s\S]*?)\]/i);
                  const multiSelectOptions = multiSelectMatch ? multiSelectMatch[1].split("|").map(s => s.trim()) : [];

                  const maxSelectMatch = msg.content?.match(/\[MAX_SELECT:\s*(\d+)\s*\]/i);
                  const maxSelect = maxSelectMatch ? parseInt(maxSelectMatch[1], 10) : null;

                  // Parse proposal data
                  const proposalMatch = msg.content?.match(/\[PROPOSAL_DATA\]([\s\S]*?)\[\/PROPOSAL_DATA\]/);
                  const hasProposal = !!proposalMatch;

                  // Clean content for display
                  let cleanContent = msg.content
                    ?.replace(/\[SUGGESTIONS:[\s\S]*?\]/i, "")
                    .replace(/\[MULTI_SELECT:[\s\S]*?\]/i, "")
                    .replace(/\[MAX_SELECT:[\s\S]*?\]/i, "")
                    .replace(/\[QUESTION_KEY:[\s\S]*?\]/i, "")
                    .replace(/\[PROPOSAL_DATA\][\s\S]*?\[\/PROPOSAL_DATA\]/, "")
                    .trim();

                  if (hasProposal && !cleanContent) {
                    cleanContent = "I've generated a proposal based on your requirements. You can view it in the panel on the right.";
                  }

                  return (
                    <div
                      key={msg.id || index}
                      className={`flex flex-col gap-2 min-w-0 ${isUserMessage ? "items-end" : "items-start"}`}
                    >
                      {showServiceLabel && (
                        <span className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
                          {serviceLabel}
                        </span>
                      )}
                      <div className={`flex items-start gap-3 max-w-[85%] ${alignment}`}>
                        <div
                          className={`p-2 rounded-full flex-shrink-0 ${isUserMessage ? "bg-primary text-primary-foreground" : "bg-muted"
                            }`}
                        >
                          {isAssistant ? (
                            <Bot className="w-4 h-4" />
                          ) : (
                            <User className="w-4 h-4" />
                          )}
                        </div>
                        <div
                          className={`p-3 rounded-lg min-w-0 text-sm break-words overflow-wrap-anywhere hyphens-auto ${bubbleTone}`}
                          style={{
                            wordBreak: "break-word",
                            overflowWrap: "anywhere",
                            whiteSpace: "pre-wrap"
                          }}
                        >
                          <div className="mb-1 text-[10px] uppercase tracking-[0.12em] opacity-70">
                            {resolveSenderChip(msg)}
                            {msg.createdAt ? (
                              <span className="ml-2 lowercase text-[9px] opacity-60">
                                {formatTime(msg.createdAt)}
                              </span>
                            ) : null}
                          </div>
                          {cleanContent || msg.content}
                          {msg.failed && (
                            <div className="mt-2 text-xs text-destructive">
                              Failed to send.
                              <button
                                type="button"
                                className="ml-2 underline underline-offset-2"
                                onClick={() => {
                                  setInput(msg.content || "");
                                  queueMicrotask(() => inputRef.current?.focus());
                                }}
                              >
                                Retry
                              </button>
                            </div>
                          )}
                          {hasProposal && (
                            <Button
                              variant="link"
                              className="p-0 h-auto text-xs mt-2 text-primary underline"
                              onClick={() => {
                                if (isMultiService && msg?.serviceKey) {
                                  setActiveProposalServiceKey(msg.serviceKey);
                                }
                              }}
                            >
                              View Proposal
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Render Single Select Suggestions */}
                      {suggestions.length > 0 &&
                        msg.role === "assistant" &&
                        !isLoading &&
                        !answeredOptions[msgKey] && (
                          <div className="flex flex-wrap gap-2 pl-12">
                            {suggestions.map((suggestion, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleSuggestionSelect(suggestion, msgKey)}
                                className="text-xs bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-full transition-colors border border-primary/20 disabled:opacity-40 disabled:pointer-events-none"
                                disabled={isLoading}
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        )}

                      {answeredOptions[msgKey] && (
                        <div className="pl-12 space-y-1">
                          <div className="text-xs text-muted-foreground">
                            Selected: {answeredOptions[msgKey]}
                          </div>
                        </div>
                      )}

                      {/* Render Multi-Select Options */}
                      {multiSelectOptions.length > 0 &&
                        msg.role === "assistant" &&
                        !isLoading &&
                        !hasUserReplyAfter && (
                        <div className="flex flex-col gap-2 pl-12 w-full max-w-sm">
                          <div className="flex flex-wrap gap-2">
                            {multiSelectOptions.map((option, idx) => {
                              const currentSelections = input ? input.split(",").map(s => s.trim()).filter(Boolean) : [];
                              const isSelected = currentSelections.includes(option);
                              const isLimitReached =
                                Number.isFinite(maxSelect) &&
                                maxSelect > 0 &&
                                currentSelections.length >= maxSelect &&
                                !isSelected;

                              return (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    let next;
                                    if (isSelected) {
                                      next = currentSelections.filter(c => c !== option);
                                    } else {
                                      next = [...currentSelections, option];
                                    }
                                    setInput(next.join(", "));
                                    inputRef.current?.focus();
                                  }}
                                  disabled={isLimitReached}
                                  className={`text-xs px-3 py-1.5 rounded-full transition-colors border ${isSelected
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : isLimitReached
                                      ? "bg-background border-input opacity-40 cursor-not-allowed"
                                      : "bg-background hover:bg-muted border-input"
                                    }`}
                                >
                                  {option}
                                </button>
                              );
                            })}
                          </div>
                          {input && multiSelectOptions.length > 0 && (
                            <Button
                              size="sm"
                              className="self-start mt-1"
                              onClick={() => handleSend()}
                            >
                              Done
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {isLoading && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-muted">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="p-2 rounded-lg text-center flex items-center">
                      <AITextLoading
                        texts={["thinking..."]}
                        interval={1000}
                        className="text-base font-normal p-0 m-0 leading-none"
                      />
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            <div className="pt-4 border-t mt-auto">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex w-full items-center space-x-2"
              >
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  disabled={!conversationId}
                />
                <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>

          {/* Proposal Panel */}
          {hasProposals && (
            <div className="h-full min-h-0 border-l pl-6 hidden lg:flex flex-col gap-3 overflow-hidden">
              {isMultiService && proposalMessages.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {proposalMessages.map((item) => (
                    <Button
                      key={item.serviceKey}
                      variant={
                        item.serviceKey === activeProposalServiceKey ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setActiveProposalServiceKey(item.serviceKey)}
                    >
                      {item.serviceKey}
                    </Button>
                  ))}
                </div>
              )}
              <ProposalPanel content={selectedProposalMessage?.content} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatDialog;
