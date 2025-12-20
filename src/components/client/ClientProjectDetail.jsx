"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, AlertCircle, FileText, DollarSign, Send, Upload, StickyNote } from "lucide-react";
import { ProjectNotepad } from "@/components/ui/notepad";
import { Input } from "@/components/ui/input";
import { RoleAwareSidebar } from "@/components/dashboard/RoleAwareSidebar";
import { ClientTopBar } from "@/components/client/ClientTopBar";
import { SOP_TEMPLATES } from "@/data/sopTemplates";
import { useAuth } from "@/context/AuthContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// Skeleton Loading Component
const ProjectDetailSkeleton = () => (
  <div className="min-h-screen bg-background text-foreground p-6 md:p-8 w-full">
    <div className="w-full max-w-full mx-auto space-y-6">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border border-border/60 bg-card/80">
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-3" />
            <Skeleton className="h-2 w-full" />
          </CardContent>
        </Card>
        <Card className="border border-border/60 bg-card/80">
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-12 mb-2" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
      </div>

      {/* Main Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Phases Card Skeleton */}
          <Card className="border border-border/60 bg-card/80">
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start gap-3 pb-3 border-b border-border/60 last:border-0">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-2 w-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Tasks Card Skeleton */}
          <Card className="border border-border/60 bg-card/80">
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-36" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border/60">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-7 w-16 rounded" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Skeleton */}
        <div className="space-y-4">
          <Card className="border border-border/60 bg-card/80">
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
          <Card className="border border-border/60 bg-card/80">
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
          <Card className="border border-border/60 bg-card/80 h-96">
            <CardHeader>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-40" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-10 w-2/3 ml-auto" />
              <Skeleton className="h-10 w-3/4" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
);

const initialMessages = [];

const getPhaseIcon = (status) => {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    case "in-progress":
      return <AlertCircle className="w-5 h-5 text-blue-600" />;
    default:
      return <Circle className="w-5 h-5 text-gray-400" />;
  }
};

const getStatusBadge = (status) => {
  const variants = {
    completed: "default",
    "in-progress": "secondary",
    pending: "outline"
  };
  return variants[status] || "outline";
};

const mapStatus = (status = "") => {
  const normalized = status.toString().toUpperCase();
  if (normalized === "COMPLETED") return "completed";
  if (normalized === "IN_PROGRESS" || normalized === "OPEN") return "in-progress";
  return "pending";
};

const ProjectDashboard = () => {
  const { projectId } = useParams();
  const { authFetch, isAuthenticated, user } = useAuth();
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [completedTaskIds, setCompletedTaskIds] = useState(new Set());
  const [verifiedTaskIds, setVerifiedTaskIds] = useState(new Set());
  const fileInputRef = useRef(null);

  // Dispute Report State
  const [reportOpen, setReportOpen] = useState(false);
  const [issueText, setIssueText] = useState("");
  const [isReporting, setIsReporting] = useState(false);

  const handleReport = async () => {
    if (!issueText.trim()) {
      toast.error("Please describe the issue");
      return;
    }
    setIsReporting(true);
    try {
      const res = await authFetch('/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: issueText, projectId: project?.id || projectId })
      });
      if (res.ok) {
        toast.success("Dispute raised. A Project Manager will review it shortly.");
        setReportOpen(false);
        setIssueText("");
      } else {
        toast.error("Failed to raise dispute");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error raising dispute");
    } finally {
      setIsReporting(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    let active = true;
    const fetchProject = async () => {
      setIsLoading(true);
      try {
        const response = await authFetch(`/projects/${projectId}`);
        const payload = await response.json().catch(() => null);
        const data = payload?.data || null;

        if (active && data) {
          setProject(data);
          // Load saved task progress from database
          if (Array.isArray(data.completedTasks)) {
            setCompletedTaskIds(new Set(data.completedTasks));
          }
          if (Array.isArray(data.verifiedTasks)) {
            setVerifiedTaskIds(new Set(data.verifiedTasks));
          }
        }
      } catch (error) {
        console.error("Failed to load project detail:", error);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchProject();
    return () => {
      active = false;
    };
  }, [authFetch, isAuthenticated, projectId]);

  const updateProjectProgress = async (newProgress, completedArr, verifiedArr) => {
    if (!project?.id) return;

    // Optimistic update
    setProject((prev) => ({ ...prev, progress: newProgress }));

    try {
      await authFetch(`/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          progress: newProgress,
          completedTasks: completedArr,
          verifiedTasks: verifiedArr
        })
      });
    } catch (error) {
      console.error("Failed to update project progress:", error);
    }
  };

  // Chat & Conversation Logic
  const [conversationId, setConversationId] = useState(null);
  const [isSending, setIsSending] = useState(false);

  // 1. Ensure Conversation Exists
  useEffect(() => {
    if (!project?.id || !authFetch) return;

    let key = `project:${project.id}`;
    // Check for accepted proposal to sync with DM chat
    const acceptedProposal = project.proposals?.find(p => p.status === "ACCEPTED");

    console.log("Chat Init - Project:", project?.id, "User:", user?.id, "Owner:", project?.ownerId);

    // Logic matches ClientChat.jsx: CHAT:PROJECT_ID:CLIENT_ID:FREELANCER_ID
    if (acceptedProposal && user?.id && acceptedProposal.freelancerId) {
      key = `CHAT:${project.id}:${user.id}:${acceptedProposal.freelancerId}`;
      console.log("Using Project-Based Chat Key (User):", key);
    } else if (acceptedProposal && project.ownerId && acceptedProposal.freelancerId) {
      // Fallback to ownerId if user isn't loaded yet (though auth should prevent this)
      key = `CHAT:${project.id}:${project.ownerId}:${acceptedProposal.freelancerId}`;
      console.log("Using Project-Based Chat Key (Owner Fallback):", key);
    } else {
      console.log("Using Project Chat Key (Fallback):", key);
    }

    const initChat = async () => {
      try {
        const res = await authFetch("/chat/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            service: key,
            projectTitle: project?.title || "Project Chat"
          })
        });
        const payload = await res.json().catch(() => null);
        const convo = payload?.data || payload;
        if (convo?.id) setConversationId(convo.id);
      } catch (e) {
        console.error("Chat init error:", e);
      }
    };
    initChat();
  }, [project, authFetch, user]);

  // 2. Fetch Messages
  useEffect(() => {
    if (!conversationId || !authFetch) return;
    const fetchMessages = async () => {
      try {
        const res = await authFetch(`/chat/conversations/${conversationId}/messages`);
        const payload = await res.json().catch(() => null);
        const msgs = payload?.data?.messages || [];

        const mapped = msgs.map(m => {
          const isMe = (user?.id && m.senderId === user.id) || m.senderRole === "CLIENT";
          return {
            id: m.id,
            sender: m.role === "assistant" ? "assistant" : (isMe ? "user" : "other"),
            text: m.content,
            timestamp: new Date(m.createdAt),
            attachment: m.attachment, // { name, size, type, url? }
            senderName: m.senderName
          };
        });
        // Merge logic: Use backend data but preserve local pending messages if not yet in backend
        setMessages(prev => {
          const pending = prev.filter(m => m.pending);
          const backendIds = new Set(mapped.map(m => m.id));
          const stillPending = pending.filter(p => !backendIds.has(p.id));
          return [...mapped, ...stillPending];
        });
      } catch (e) {
        console.error("Fetch messages error:", e);
      }
    };
    fetchMessages();
    // Poll every 5s for new messages (simple real-time)
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [conversationId, authFetch]);

  const handleSendMessage = async () => {
    if (!input.trim() || !conversationId) return;

    const tempId = Date.now().toString();
    const userMessage = {
      id: tempId,
      sender: "user",
      text: input,
      timestamp: new Date(),
      pending: true
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      // Build the correct service key for notifications
      const acceptedProposal = project?.proposals?.find(p => p.status === "ACCEPTED");
      let serviceKey = `project:${project?.id || projectId}`;
      if (acceptedProposal && user?.id && acceptedProposal.freelancerId) {
        serviceKey = `CHAT:${project?.id || projectId}:${user.id}:${acceptedProposal.freelancerId}`;
      }

      await authFetch(`/chat/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: userMessage.text,
          service: serviceKey,
          senderRole: "CLIENT",
          senderName: user?.fullName || user?.name || user?.email || "Client",
          skipAssistant: true // Force persistence to DB
        })
      });
      // Optionally refetch or let poller handle it. 
      // The API returns the assistant response too, we could append it immediately.
    } catch (error) {
      console.error("Send message error:", error);
      // setMessages(prev => prev.filter(m => m.id !== tempId)); // Revert on fail?
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file && conversationId) {
      // Ideally we upload to an /upload endpoint -> get URL.
      // Since we don't have one, we mock the upload URL but store metadata in chat.
      const attachment = {
        name: file.name,
        size: `${(file.size / 1024).toFixed(2)} KB`,
        type: file.type
      };

      const tempId = Date.now().toString();
      const userMessage = {
        id: tempId,
        sender: "user",
        text: `Uploaded document: ${file.name}`,
        timestamp: new Date(),
        attachment,
        pending: true
      };
      setMessages(prev => [...prev, userMessage]);

      try {
        // Build the correct service key for notifications
        const acceptedProposal = project?.proposals?.find(p => p.status === "ACCEPTED");
        let serviceKey = `project:${project?.id || projectId}`;
        if (acceptedProposal && user?.id && acceptedProposal.freelancerId) {
          serviceKey = `CHAT:${project?.id || projectId}:${user.id}:${acceptedProposal.freelancerId}`;
        }

        await authFetch(`/chat/conversations/${conversationId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: `Uploaded document: ${file.name}`,
            service: serviceKey,
            senderRole: "CLIENT",
            senderName: user?.fullName || user?.name || user?.email || "Client",
            attachment, // Send attachment metadata
            skipAssistant: true // Force persistence to DB
          })
        });
      } catch (err) {
        console.error("Upload error:", err);
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const docs = useMemo(() => {
    return messages.filter(m => m.attachment).map(m => m.attachment);
  }, [messages]);

  // ... (SOP and Progress logic remains same) ...

  // Budget - use actual project budget, default to 0 if not set
  const totalBudget = useMemo(() => {
    if (project?.budget !== undefined && project?.budget !== null) {
      const value = Number(project.budget);
      if (Number.isFinite(value)) return Math.max(0, value);
    }
    return 0;
  }, [project]);

  const spentBudget = useMemo(() => {
    // Use dynamic spent if available
    return project?.spent ? Number(project.spent) : 0;
  }, [project]);

  const remainingBudget = useMemo(() => Math.max(0, totalBudget - spentBudget), [spentBudget, totalBudget]);

  // Render ...
  // Update Documents Card to use `docs`

  /* Inside JSX for Documents Card: */
  /*
     <CardContent>
        {docs.length > 0 ? (
          <div className="space-y-2">
            {docs.map((doc, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm p-2 border border-border/60 rounded bg-muted/20">
                 <FileText className="w-4 h-4 text-primary" />
                 <span className="truncate flex-1">{doc.name}</span>
                 <span className="text-xs text-muted-foreground">{doc.size}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No documents attached yet. Upload project documentation here.
          </p>
        )}
      </CardContent>
  */


  const activeSOP = useMemo(() => {
    if (!project?.title) return SOP_TEMPLATES.WEBSITE;
    const title = project.title.toLowerCase();
    if (
      title.includes("app") ||
      title.includes("mobile") ||
      title.includes("ios") ||
      title.includes("android")
    ) {
      return SOP_TEMPLATES.APP;
    }
    if (title.includes("software") || title.includes("platform") || title.includes("system") || title.includes("crm")) {
      return SOP_TEMPLATES.SOFTWARE;
    }
    if (
      title.includes("security") ||
      title.includes("audit") ||
      title.includes("penetration") ||
      title.includes("cyber") ||
      title.includes("iso") ||
      title.includes("gdpr")
    ) {
      return SOP_TEMPLATES.CYBERSECURITY;
    }
    if (
      title.includes("brand") ||
      title.includes("strategy") ||
      title.includes("identity") ||
      title.includes("positioning")
    ) {
      return SOP_TEMPLATES.BRAND_STRATEGY;
    }
    if (title.includes("pr") || title.includes("public relations")) {
      return SOP_TEMPLATES.PUBLIC_RELATIONS;
    }
    if (title.includes("seo") || title.includes("search engine")) {
      return SOP_TEMPLATES.SEO;
    }
    if (title.includes("smo") || title.includes("social media")) {
      return SOP_TEMPLATES.SMO;
    }
    if (
      title.includes("lead generation") ||
      title.includes("sales") ||
      title.includes("prospecting")
    ) {
      return SOP_TEMPLATES.LEAD_GENERATION;
    }
    if (title.includes("qualification") || title.includes("scoring")) {
      return SOP_TEMPLATES.LEAD_QUALIFICATION;
    }
    if (title.includes("business leads") || title.includes("b2b leads")) {
      return SOP_TEMPLATES.BUSINESS_LEADS;
    }
    if (title.includes("content marketing") || title.includes("inbound")) {
      return SOP_TEMPLATES.CONTENT_MARKETING;
    }
    if (
      title.includes("social lead") ||
      title.includes("paid social") ||
      title.includes("social ads")
    ) {
      return SOP_TEMPLATES.SOCIAL_MEDIA_LEAD_GEN;
    }
    if (title.includes("customer support") || title.includes("helpdesk")) {
      return SOP_TEMPLATES.CUSTOMER_SUPPORT;
    }
    if (title.includes("technical support") || title.includes("it support")) {
      return SOP_TEMPLATES.TECHNICAL_SUPPORT;
    }
    if (
      title.includes("project management") ||
      title.includes("pm") ||
      title.includes("coordination")
    ) {
      return SOP_TEMPLATES.PROJECT_MANAGEMENT;
    }
    if (
      title.includes("data entry") ||
      title.includes("typing") ||
      title.includes("excel") ||
      title.includes("spreadsheet")
    ) {
      return SOP_TEMPLATES.DATA_ENTRY;
    }
    if (title.includes("transcription") || title.includes("transcribe")) {
      return SOP_TEMPLATES.TRANSCRIPTION;
    }
    if (title.includes("translation") || title.includes("translate")) {
      return SOP_TEMPLATES.TRANSLATION;
    }
    if (
      title.includes("tutoring") ||
      title.includes("tutor") ||
      title.includes("teaching")
    ) {
      return SOP_TEMPLATES.TUTORING;
    }
    if (title.includes("coaching") || title.includes("coach")) {
      return SOP_TEMPLATES.COACHING;
    }
    if (title.includes("course") || title.includes("curriculum")) {
      return SOP_TEMPLATES.COURSE_DEVELOPMENT;
    }
    if (
      title.includes("legal") ||
      title.includes("law") ||
      title.includes("contract")
    ) {
      return SOP_TEMPLATES.LEGAL_CONSULTING;
    }
    if (
      title.includes("intellectual property") ||
      title.includes("trademark") ||
      title.includes("patent") ||
      title.includes("copyright")
    ) {
      return SOP_TEMPLATES.IP_SERVICES;
    }
    return SOP_TEMPLATES.WEBSITE;
  }, [project]);

  const overallProgress = useMemo(() => {
    // If progress is explicit in the DB, use it
    if (project?.progress !== undefined && project?.progress !== null) {
      const value = Number(project.progress);
      return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
    }
    // Fallback logic if needed (or default to 0)
    return 0;
  }, [project]);

  const derivedPhases = useMemo(() => {
    const phases = activeSOP.phases;
    const step = 100 / phases.length;
    return phases.map((phase, index) => {
      // Calculate how much "progress" this phase accounts for
      const phaseValue = Math.max(0, Math.min(step, overallProgress - index * step));
      const normalized = Math.round((phaseValue / step) * 100);
      let status = "pending";
      if (normalized >= 100) status = "completed";
      else if (normalized > 0) status = "in-progress";
      return {
        ...phase,
        status,
        progress: normalized,
        index // Keep track of original index
      };
    });
  }, [overallProgress, activeSOP]);

  // Handle phase click to update progress
  const handlePhaseClick = (phaseIndex) => {
    // Determine the progress value required to complete THIS phase
    const phases = activeSOP.phases;
    const step = 100 / phases.length;

    // If clicking the current phase, verify if we should complete it or uncomplete it?
    // Simplified logic: Clicking a phase completes it (and all before it).
    // If it's already complete, maybe doing nothing or toggle?
    // Let's assume clicking sets the progress to the end of that phase.

    const targetProgress = Math.round((phaseIndex + 1) * step);

    // Logic refinement: if I click the last completed phase, maybe I want to undo it?
    // Let's stick to "Click to complete up to here".
    updateProjectProgress(targetProgress);
  };

  const visiblePhases = useMemo(() => {
    let foundCurrent = false;
    return derivedPhases.filter((phase) => {
      if (foundCurrent) return false;
      if (phase.status !== "completed") {
        foundCurrent = true;
        return true;
      }
      return true;
    });
  }, [derivedPhases]);

  // Find the current active phase (first non-completed phase)
  const currentActivePhase = useMemo(() => {
    return derivedPhases.find((p) => p.status !== "completed") || derivedPhases[derivedPhases.length - 1];
  }, [derivedPhases]);

  const derivedTasks = useMemo(() => {
    const tasks = activeSOP.tasks;
    // Show ALL tasks from all phases
    return tasks.map((task) => {
      // Use unique key combining phase and task id
      const uniqueKey = `${task.phase}-${task.id}`;
      const isCompleted = completedTaskIds.has(uniqueKey);
      const isVerified = verifiedTaskIds.has(uniqueKey);
      const taskPhase = derivedPhases.find((p) => p.id === task.phase);
      const phaseStatus = taskPhase?.status || task.status;

      // Check if task is manually completed by user
      if (isCompleted) {
        return { ...task, uniqueKey, status: "completed", verified: isVerified, phaseName: taskPhase?.name };
      }
      if (phaseStatus === "completed") {
        return { ...task, uniqueKey, status: "completed", verified: isVerified, phaseName: taskPhase?.name };
      }
      if (phaseStatus === "in-progress" && task.status === "completed") {
        return { ...task, uniqueKey, verified: isVerified, phaseName: taskPhase?.name };
      }
      return {
        ...task,
        uniqueKey,
        status: phaseStatus === "in-progress" ? "in-progress" : "pending",
        verified: false,
        phaseName: taskPhase?.name
      };
    });
  }, [derivedPhases, activeSOP, completedTaskIds, verifiedTaskIds]);

  // Group tasks by phase for display
  const tasksByPhase = useMemo(() => {
    const grouped = {};
    derivedTasks.forEach((task) => {
      if (!grouped[task.phase]) {
        const phase = derivedPhases.find((p) => p.id === task.phase);
        grouped[task.phase] = {
          phaseId: task.phase,
          phaseName: phase?.name || `Phase ${task.phase}`,
          phaseStatus: phase?.status || "pending",
          tasks: []
        };
      }
      grouped[task.phase].tasks.push(task);
    });
    return Object.values(grouped);
  }, [derivedTasks, derivedPhases]);

  // Handle task click to toggle completion (just marks as checked, not verified)
  const handleTaskClick = async (e, uniqueKey) => {
    e.stopPropagation();
    e.preventDefault();

    let newCompleted, newVerified;

    setCompletedTaskIds((prev) => {
      const updated = new Set(prev);
      if (updated.has(uniqueKey)) {
        updated.delete(uniqueKey);
      } else {
        updated.add(uniqueKey);
      }
      newCompleted = Array.from(updated);
      return updated;
    });

    // Also remove from verified if unchecking
    setVerifiedTaskIds((prev) => {
      const updated = new Set(prev);
      if (!newCompleted.includes(uniqueKey)) {
        updated.delete(uniqueKey);
      }
      newVerified = Array.from(updated);
      return updated;
    });

    // Save to database
    if (project?.id && authFetch) {
      try {
        await authFetch(`/projects/${project.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            completedTasks: newCompleted,
            verifiedTasks: newVerified
          })
        });
      } catch (error) {
        console.error("Failed to save task state:", error);
      }
    }
  };

  // Handle verify button click - this updates progress
  const handleVerifyTask = async (e, uniqueKey) => {
    e.stopPropagation();
    e.preventDefault();

    let newVerified;

    setVerifiedTaskIds((prev) => {
      const updated = new Set(prev);
      updated.add(uniqueKey);
      newVerified = Array.from(updated);
      return updated;
    });

    // Calculate new progress
    const allTasks = activeSOP.tasks;
    const totalTasks = allTasks.length;
    const verifiedCount = allTasks.filter((t) =>
      newVerified.includes(`${t.phase}-${t.id}`)
    ).length;
    const newProgress = Math.round((verifiedCount / totalTasks) * 100);

    // Save to database
    const currentCompleted = Array.from(completedTaskIds);
    updateProjectProgress(newProgress, currentCompleted, newVerified);
  };

  const completedPhases = derivedPhases.filter((p) => p.status === "completed").length;
  const pageTitle = project?.title ? `Project: ${project.title}` : "Project Dashboard";


  // Show skeleton while loading
  if (isLoading) {
    return (
      <RoleAwareSidebar>
        <div className="mt-5 ml-5">
          <ClientTopBar title="Loading..." />
        </div>
        <ProjectDetailSkeleton />
      </RoleAwareSidebar>
    );
  }

  return (
    <RoleAwareSidebar>
      <div className="mt-5 ml-5">
        <ClientTopBar title={pageTitle} />
      </div>

      <div className="min-h-screen bg-background text-foreground p-6 md:p-8 w-full">
        <div className="w-full max-w-full mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">{pageTitle}</h1>
              <p className="text-sm text-muted-foreground">
                {isLoading ? "Loading project details..." : "Track project progress and manage tasks efficiently"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="destructive" size="sm" onClick={() => setReportOpen(true)}>
                <AlertCircle className="w-4 h-4 mr-2" />
                Report Issue
              </Button>
              <ProjectNotepad projectId={project?.id || projectId} />
            </div>
          </div>
          {!isLoading && !project && (
            <div className="rounded-lg border border-border/60 bg-accent/40 px-4 py-3 text-sm text-muted-foreground">
              No project data found for this link. Showing sample progress so you can preview the layout.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border border-border/60 bg-card/80 shadow-sm backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground/90">Overall Progress</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-foreground">{Math.round(overallProgress)}%</div>
                <Progress value={overallProgress} className="mt-3 h-2" />
              </CardContent>
            </Card>

            <Card className="border border-border/60 bg-card/80 shadow-sm backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground/90">Completed Phases</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-foreground">
                  {completedPhases}/{activeSOP.phases.length}
                </div>
                <p className="text-xs text-muted-foreground mt-2">phases completed</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <Card className="border border-border/60 bg-card/80 shadow-sm backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-foreground">Project Phases</CardTitle>
                  <CardDescription className="text-muted-foreground">Monitor each phase of your project</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {derivedPhases.map((phase, index) => (
                    <div
                      key={phase.id}
                      className="flex items-start gap-3 pb-3 border-b border-border/60 last:border-0 last:pb-0 p-2 rounded"
                    >
                      <div className="mt-1">{getPhaseIcon(phase.status)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-sm text-foreground">{phase.name}</h3>
                          <Badge
                            variant={getStatusBadge(phase.status)}
                            className="rounded-full bg-primary text-primary-foreground text-[11px] font-medium px-2 py-0.5"
                          >
                            {phase.status === "in-progress"
                              ? "In Progress"
                              : phase.status === "completed"
                                ? "Completed"
                                : "Pending"}
                          </Badge>
                        </div>
                        <Progress value={phase.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">{phase.progress}% complete</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* All Tasks Grouped by Phase - Accordion */}
              <Card className="border border-border/60 bg-card/80 shadow-sm backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-foreground">Project Tasks</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {derivedTasks.filter((t) => t.verified).length} of {derivedTasks.length} tasks verified
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible defaultValue={currentActivePhase?.id} className="w-full">
                    {tasksByPhase.map((phaseGroup) => (
                      <AccordionItem key={phaseGroup.phaseId} value={phaseGroup.phaseId} className="border-border/60">
                        <AccordionTrigger className="hover:no-underline py-3">
                          <div className="flex items-center gap-3 flex-1">
                            {getPhaseIcon(phaseGroup.phaseStatus)}
                            <div className="flex-1 text-left">
                              <div className="font-semibold text-sm text-foreground">{phaseGroup.phaseName}</div>
                              <div className="text-xs text-muted-foreground">
                                {phaseGroup.tasks.filter((t) => t.verified).length} of {phaseGroup.tasks.length} verified
                              </div>
                            </div>
                            <Badge
                              variant={phaseGroup.phaseStatus === "completed" ? "default" : "outline"}
                              className={phaseGroup.phaseStatus === "completed" ? "bg-emerald-500 text-white" : ""}
                            >
                              {phaseGroup.phaseStatus === "completed" ? "Completed" :
                                phaseGroup.phaseStatus === "in-progress" ? "In Progress" : "Pending"}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 pt-2">
                            {phaseGroup.tasks.map((task) => (
                              <div
                                key={task.uniqueKey}
                                className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-card hover:bg-accent/60 transition-colors cursor-pointer"
                                onClick={(e) => handleTaskClick(e, task.uniqueKey)}
                              >
                                {task.status === "completed" ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                ) : (
                                  <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                )}
                                <span
                                  className={`flex-1 text-sm ${task.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"
                                    }`}
                                >
                                  {task.title}
                                </span>
                                {task.status === "completed" && (
                                  task.verified ? (
                                    <Badge className="h-7 px-3 text-xs bg-emerald-500 text-white">
                                      Verified
                                    </Badge>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 px-3 text-xs border-primary text-primary hover:bg-primary/10"
                                      onClick={(e) => handleVerifyTask(e, task.uniqueKey)}
                                    >
                                      Verify
                                    </Button>
                                  )
                                )}
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              {/* Project Chat - First */}
              <Card className="flex flex-col h-96 border border-border/60 bg-card/80 shadow-sm backdrop-blur">
                <CardHeader className="border-b border-border/60">
                  <CardTitle className="text-base text-foreground">Project Chat</CardTitle>
                  <CardDescription className="text-muted-foreground">Ask questions and share documents</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto space-y-3 py-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-2 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div className="space-y-1">
                        {message.sender === "other" && message.senderName && (
                          <span className="text-[10px] text-muted-foreground ml-1">{message.senderName}</span>
                        )}
                        <div
                          className={`max-w-xs px-3 py-2 rounded-lg text-sm whitespace-pre-wrap ${message.sender === "user"
                              ? "bg-primary text-primary-foreground rounded-br-none"
                              : "bg-muted text-foreground rounded-bl-none border border-border/60"
                            }`}
                        >
                          {message.text}
                        </div>
                        {message.attachment && (
                          <div
                            className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${message.sender === "user"
                                ? "bg-primary/20 text-foreground"
                                : "bg-accent text-accent-foreground border border-border/60"
                              }`}
                          >
                            <FileText className="w-3 h-3" />
                            {message.attachment.name} ({message.attachment.size})
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
                <div className="border-t border-border/60 p-3 flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    className="h-9 text-sm bg-muted border-border/60"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    size="sm"
                    variant="outline"
                    className="h-9 w-9 p-0 border-border/60"
                    title="Upload document"
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
                  />
                  <Button onClick={handleSendMessage} size="sm" variant="default" className="h-9 w-9 p-0">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </Card>

              {/* Documents - Second */}
              <Card className="border border-border/60 bg-card/80 shadow-sm backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-foreground">
                    <FileText className="w-4 h-4" />
                    Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {docs.length > 0 ? (
                    <div className="space-y-2">
                      {docs.map((doc, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm p-2 border border-border/60 rounded bg-muted/20">
                          <FileText className="w-4 h-4 text-primary" />
                          <span className="truncate flex-1">{doc.name}</span>
                          <span className="text-xs text-muted-foreground">{doc.size}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No documents attached yet. Upload project documentation here.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Budget Summary - Third */}
              <Card className="border border-border/60 bg-card/80 shadow-sm backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-foreground">
                    <DollarSign className="w-4 h-4" />
                    Budget Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex justify-between items-center pb-2 border-b border-border/60">
                    <span>Total Budget</span>
                    <span className="font-semibold text-foreground">₹{totalBudget.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-border/60">
                    <span>Spent</span>
                    <span className="font-semibold text-emerald-600">₹{spentBudget.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Remaining</span>
                    <span className="font-semibold text-foreground">₹{remainingBudget.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report an Issue</DialogTitle>
            <DialogDescription>
              Describe the issue or dispute regarding this project. A Project Manager will get involved to resolve it.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Textarea
              placeholder="Describe the issue..."
              value={issueText}
              onChange={e => setIssueText(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReport} disabled={isReporting}>
              {isReporting ? "Sending..." : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RoleAwareSidebar >
  );
};

const ClientProjectDetail = () => <ProjectDashboard />;

export default ClientProjectDetail;
