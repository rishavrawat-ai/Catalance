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
import { Input } from "@/components/ui/input";
import { CheckCircle2, Circle, AlertCircle, FileText, DollarSign, Send, Upload, StickyNote } from "lucide-react";
import { ProjectNotepad } from "@/components/ui/notepad";
import { RoleAwareSidebar } from "@/components/dashboard/RoleAwareSidebar";
import { FreelancerTopBar } from "@/components/freelancer/FreelancerTopBar";
import { useAuth } from "@/context/AuthContext";
import { SOP_TEMPLATES } from "@/data/sopTemplates";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// Skeleton Loading Component
const ProjectDetailSkeleton = () => (
  <div className="min-h-screen bg-background text-foreground p-6 md:p-8 w-full">
    <div className="w-full max-w-full mx-auto space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border border-border/60 bg-card/80">
          <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-3" />
            <Skeleton className="h-2 w-full" />
          </CardContent>
        </Card>
        <Card className="border border-border/60 bg-card/80">
          <CardHeader className="pb-2"><Skeleton className="h-4 w-32" /></CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-12 mb-2" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
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
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="border border-border/60 bg-card/80">
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-28" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border/60">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card className="border border-border/60 bg-card/80">
            <CardHeader className="pb-3"><Skeleton className="h-4 w-24" /></CardHeader>
            <CardContent><Skeleton className="h-4 w-full mb-2" /><Skeleton className="h-4 w-3/4" /></CardContent>
          </Card>
          <Card className="border border-border/60 bg-card/80 h-96">
            <CardHeader><Skeleton className="h-4 w-24" /></CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-10 w-2/3 ml-auto" />
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

const FreelancerProjectDetailContent = () => {
  const { projectId } = useParams();
  const { authFetch, isAuthenticated, user } = useAuth();

  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(true);
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef(null);

  // Dispute Report State
  const [reportOpen, setReportOpen] = useState(false);
  const [issueText, setIssueText] = useState("");
  const [isReporting, setIsReporting] = useState(false);

  // Handle reporting a dispute (same logic as client)
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
        const response = await authFetch("/proposals");
        const payload = await response.json().catch(() => null);
        const proposals = Array.isArray(payload?.data) ? payload.data : [];
        const match = proposals.find((p) => String(p?.project?.id) === String(projectId));

        if (match?.project && active) {
          const normalizedProgress = (() => {
            const value = Number(match.project.progress ?? match.progress ?? 0);
            return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
          })();

          const normalizedBudget = (() => {
            const value = Number(match.project.budget ?? match.budget ?? 0);
            return Number.isFinite(value) ? Math.max(0, value) : 0;
          })();

          setProject({
            id: match.project.id,
            ownerId: match.project.ownerId, // Needed for chat key
            title: match.project.title || "Project",
            client:
              match.project.owner?.fullName ||
              match.project.owner?.name ||
              match.project.owner?.email ||
              "Client",
            progress: normalizedProgress,
            status: match.project.status || match.status || "IN_PROGRESS",
            budget: normalizedBudget,
            currency: match.project.currency || match.currency || "₹",
            spent: Number(match.project.spent || 0)
          });
          setIsFallback(false);
        } else if (active) {
          setProject(null);
          setIsFallback(true);
        }
      } catch (error) {
        console.error("Failed to load freelancer project detail:", error);
        if (active) {
          setProject(null);
          setIsFallback(true);
        }
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

  // Create or reuse a chat conversation for this project
  useEffect(() => {
    if (!project || !authFetch || !user?.id) return;
    
    // Key Logic: CHAT:PROJECT_ID:OWNER_ID:FREELANCER_ID (User is Freelancer)
    // Fallback to project:ID only if owner unknown, but for sync needs CHAT:...
    let key = `project:${project.id}`;
    if (project.ownerId && user.id) {
        key = `CHAT:${project.id}:${project.ownerId}:${user.id}`;
    }
    
    console.log("Freelancer Chat Init - Key:", key);
    
    let cancelled = false;

    const ensureConversation = async () => {
      try {
        const response = await authFetch("/chat/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            service: key,
            projectTitle: project?.title || "Project Chat",
            forceNew: false
          })
        });

        const payload = await response.json().catch(() => null);
        const convo = payload?.data || payload;
        if (convo?.id && !cancelled) {
          setConversationId(convo.id);
        }
      } catch (error) {
        console.error("Failed to create project chat conversation", error);
      }
    };

    ensureConversation();
    return () => {
      cancelled = true;
    };
  }, [authFetch, project, user]);

  // Load chat history
  useEffect(() => {
    if (!conversationId || !authFetch) return;
    let cancelled = false;
    const loadMessages = async () => {
      try {
        const response = await authFetch(`/chat/conversations/${conversationId}/messages`);
        const payload = await response.json().catch(() => null);
        const list = Array.isArray(payload?.data?.messages)
          ? payload.data.messages
          : payload?.messages || [];
          
        if (!cancelled) {
          const normalized = list.map((msg) => {
             // Logic: I am the freelancer.
             // If senderId == my id, it's me.
             // If senderRole == 'FREELANCER', it's me.
             // Everything else (Client/Assistant) is 'other'.
             const isMe = (user?.id && String(msg.senderId) === String(user.id)) || 
                          msg.senderRole === "FREELANCER"; // Check for explicit role
             
             return {
                id: msg.id,
                sender: msg.role === "assistant" ? "assistant" : (isMe ? "user" : "other"),
                text: msg.content,
                timestamp: msg.createdAt ? new Date(msg.createdAt) : new Date(),
                attachment: msg.attachment,
                senderName: msg.senderName
             };
          });
          
          // Merge logic to keep pending messages
          setMessages(prev => {
             const pending = prev.filter(m => m.pending);
             // Dedupe based on signature (sender + text) as ID might change from temp to DB
             const backendSignatures = new Set(normalized.map(m => `${m.sender}:${m.text}`));
             
             const stillPending = pending.filter(p => {
                const signature = `${p.sender}:${p.text}`;
                return !backendSignatures.has(signature);
             });
             return [...normalized, ...stillPending];
          });
        }
      } catch (error) {
        console.error("Failed to load project chat messages", error);
      }
    };
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => {
      clearInterval(interval);
      cancelled = true;
    };
  }, [authFetch, conversationId, user]);

  const handleSendMessage = async () => {
    if (!input.trim() || !conversationId || !authFetch) return;
    
    // Optimistic message
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
      const serviceKey = (project?.ownerId && user?.id) 
        ? `CHAT:${project?.id || projectId}:${project.ownerId}:${user.id}` 
        : `project:${project?.id || projectId}`;
        
      await authFetch(`/chat/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: userMessage.text,
            service: serviceKey,
            senderRole: "FREELANCER",
            senderName: user?.fullName || user?.name || user?.email || "Freelancer",
            skipAssistant: true // Persist to DB
          })
        });
        // Polling will fetch the real message
    } catch (error) {
      console.error("Failed to send project chat message", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file && conversationId) {
      const attachment = {
          name: file.name,
          size: `${(file.size / 1024).toFixed(2)} KB`,
          type: file.type
      };
      
      const userMessage = {
        id: Date.now().toString(),
        sender: "user",
        text: `Uploaded document: ${file.name}`,
        timestamp: new Date(),
        attachment,
        pending: true
      };

      setMessages((prev) => [...prev, userMessage]);

      try {
         // Build the correct service key for notifications
         const serviceKey = (project?.ownerId && user?.id) 
           ? `CHAT:${project?.id || projectId}:${project.ownerId}:${user.id}` 
           : `project:${project?.id || projectId}`;
           
         await authFetch(`/chat/conversations/${conversationId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                content: `Uploaded document: ${file.name}`,
                service: serviceKey,
                senderRole: "FREELANCER",
                senderName: user?.fullName || user?.name || user?.email || "Freelancer",
                attachment,
                skipAssistant: true
            })
         });
      } catch(e) {
         console.error("Upload failed", e);
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const docs = useMemo(() => {
    return messages.filter(m => m.attachment).map(m => m.attachment);
  }, [messages]);

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
    if (
      title.includes("software") ||
      title.includes("platform") ||
      title.includes("system") ||
      title.includes("crm")
    ) {
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
    if (project?.progress !== undefined && project?.progress !== null) {
      const value = Number(project.progress);
      return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
    }
    const status = mapStatus(project?.status);
    if (status === "completed") return 100;
    if (status === "in-progress") return 45;
    return 10;
  }, [project]);

  const derivedPhases = useMemo(() => {
    const phases = activeSOP.phases;
    const step = 100 / phases.length;
    return phases.map((phase, index) => {
      const phaseValue = Math.max(0, Math.min(step, overallProgress - index * step));
      const normalized = Math.round((phaseValue / step) * 100);
      let status = "pending";
      if (normalized >= 100) status = "completed";
      else if (normalized > 0) status = "in-progress";
      return {
        ...phase,
        status,
        progress: normalized
      };
    });
  }, [overallProgress, activeSOP]);

  const derivedTasks = useMemo(() => {
    return activeSOP.tasks.map((task) => {
      const phaseStatus = derivedPhases.find((p) => p.id === task.phase)?.status || task.status;
      if (phaseStatus === "completed") {
        return { ...task, status: "completed" };
      }
      if (phaseStatus === "in-progress" && task.status === "completed") {
        return task;
      }
      return { ...task, status: phaseStatus === "in-progress" ? "in-progress" : "pending" };
    });
  }, [derivedPhases, activeSOP]);

  const completedPhases = derivedPhases.filter((p) => p.status === "completed").length;
  const pageTitle = project?.title ? `Project: ${project.title}` : "Project Dashboard";

  const totalBudget = useMemo(() => {
    if (project?.budget !== undefined && project?.budget !== null) {
      const value = Number(project.budget);
      // Reduce 30% platform fee - Freelancer sees 70%
      if (Number.isFinite(value)) return Math.max(0, value * 0.7);
    }
    return 0;
  }, [project]);
  
  const spentBudget = useMemo(() => {
     // If database has spent value, use it. Otherwise derive from progress.
     if (project?.spent && project.spent > 0) return Number(project.spent);
     return Math.round((totalBudget * overallProgress) / 100);
  }, [project, totalBudget, overallProgress]);
  
  const remainingBudget = useMemo(() => Math.max(0, totalBudget - spentBudget), [spentBudget, totalBudget]);

  const activePhase = useMemo(() => {
    return derivedPhases.find(p => p.status !== "completed") || derivedPhases[derivedPhases.length - 1];
  }, [derivedPhases]);

  const visibleTasks = useMemo(() => {
    if (!activePhase) return [];
    return derivedTasks.filter(t => t.phase === activePhase.id);
  }, [derivedTasks, activePhase]);

  // Show skeleton while loading
  if (isLoading) {
    return (
      <RoleAwareSidebar>
        <div className="mt-5 ml-5 mr-5">
          <FreelancerTopBar label="Loading..." />
        </div>
        <ProjectDetailSkeleton />
      </RoleAwareSidebar>
    );
  }

  return (
    <RoleAwareSidebar>
      <div className="mt-5 ml-5 mr-5">

      <FreelancerTopBar label={pageTitle} />
      </div>
      <div className="min-h-screen bg-background text-foreground p-6 md:p-8 w-full">
        <div className="w-full max-w-full mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">{pageTitle}</h1>
              <p className="text-sm text-muted-foreground">
                {isLoading
                  ? "Loading project details..."
                  : isFallback
                  ? "Previewing layout with sample data."
                  : "Track project progress and deliverables in one place."}
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

          {!isLoading && isFallback && (
            <div className="rounded-lg border border-border/60 bg-accent/40 px-4 py-3 text-sm text-muted-foreground">
              Project details for this link are unavailable. Previewing layout with sample data.
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
                  {completedPhases}/{derivedPhases.length}
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
                  {derivedPhases.map((phase) => (
                    <div
                      key={phase.id}
                      className="flex items-start gap-3 pb-3 border-b border-border/60 last:border-0 last:pb-0"
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

              <Card className="border border-border/60 bg-card/80 shadow-sm backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-foreground">
                    Tasks & Checklist {activePhase ? `- ${activePhase.name}` : ""}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {derivedTasks.filter((t) => t.status === "completed").length} of {derivedTasks.length} total tasks
                    completed
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {visibleTasks.length > 0 ? (
                    visibleTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-card hover:bg-accent transition-colors"
                    >
                      {task.status === "completed" ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      )}
                      <span
                        className={`flex-1 text-sm ${
                          task.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"
                        }`}
                      >
                        {task.title}
                      </span>
                      <Badge variant="outline" className="text-xs border-border/60 text-muted-foreground">
                        Phase {task.phase}
                      </Badge>
                    </div>
                  ))
                  ) : (
                     <p className="text-sm text-muted-foreground">No tasks available for this phase.</p>
                  )}
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
                        <div
                          className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                            message.sender === "user"
                              ? "bg-primary text-primary-foreground rounded-br-none"
                              : "bg-muted text-foreground rounded-bl-none border border-border/60"
                          }`}
                        >
                          {message.text}
                        </div>
                        {message.attachment && (
                          <div
                            className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
                              message.sender === "user"
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
                    <span className="font-semibold text-foreground">{project?.currency || "₹"}{totalBudget.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-border/60">
                    <span>Spent</span>
                    <span className="font-semibold text-emerald-600">{project?.currency || "₹"}{spentBudget.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Remaining</span>
                    <span className="font-semibold text-foreground">{project?.currency || "₹"}{remainingBudget.toLocaleString()}</span>
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
    </RoleAwareSidebar>
  );
};

const FreelancerProjectDetail = () => {
  return <FreelancerProjectDetailContent />;
};

export default FreelancerProjectDetail;
