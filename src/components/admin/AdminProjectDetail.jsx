import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { 
  ArrowLeft, FileText, User, AlertCircle, Briefcase, Mail, CheckCircle, CheckCircle2, Circle
} from "lucide-react";
import { format } from "date-fns";
import DisputeDetailsDialog from "./DisputeDetailsDialog";
import ProposalsListDialog from "./ProposalsListDialog";
import ProjectDescriptionDialog from "./ProjectDescriptionDialog";
import { SOP_TEMPLATES } from "@/data/sopTemplates";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const AdminProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [proposalsDialogOpen, setProposalsDialogOpen] = useState(false);
  const [descriptionDialogOpen, setDescriptionDialogOpen] = useState(false);

  // SOP State
  const [completedTaskIds, setCompletedTaskIds] = useState(new Set());
  const [verifiedTaskIds, setVerifiedTaskIds] = useState(new Set());

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  const fetchProjectDetails = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`/admin/projects/${id}`);
      const data = await res.json();
      if (data?.data?.project) {
        setProject(data.data.project);
        if (Array.isArray(data.data.project.completedTasks)) {
          setCompletedTaskIds(new Set(data.data.project.completedTasks));
        }
        if (Array.isArray(data.data.project.verifiedTasks)) {
          setVerifiedTaskIds(new Set(data.data.project.verifiedTasks));
        }
      }
    } catch (err) {
      console.error("Failed to fetch project details:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₹${(amount || 0).toLocaleString("en-IN")}`;
  };

  const getStatusBadge = (status) => {
    const colors = {
      DRAFT: "bg-gray-500",
      OPEN: "bg-blue-500",
      IN_PROGRESS: "bg-yellow-500",
      COMPLETED: "bg-green-500"
    };
    return (
      <Badge className={`${colors[status] || "bg-gray-500"} text-white`}>
        {status?.replace("_", " ")}
      </Badge>
    );
  };

  // --- SOP LOGIC ---
  const activeSOP = useMemo(() => {
     if (!project?.title) return SOP_TEMPLATES.WEBSITE;
     const title = project.title.toLowerCase();
     if (title.includes("app") || title.includes("mobile")) return SOP_TEMPLATES.APP;
     if (title.includes("software") || title.includes("platform")) return SOP_TEMPLATES.SOFTWARE;
     if (title.includes("seo")) return SOP_TEMPLATES.SEO;
     if (title.includes("brand")) return SOP_TEMPLATES.BRAND_STRATEGY;
     if (title.includes("content")) return SOP_TEMPLATES.CONTENT_MARKETING;
     return SOP_TEMPLATES.WEBSITE; 
  }, [project]);

  const overallProgress = useMemo(() => {
    if (project?.progress !== undefined && project?.progress !== null) {
      return Number.isFinite(Number(project.progress)) ? Math.max(0, Math.min(100, Number(project.progress))) : 0;
    }
    return 0;
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
      return { ...phase, status, progress: normalized, index };
    });
  }, [overallProgress, activeSOP]);

  const derivedTasks = useMemo(() => {
    const tasks = activeSOP.tasks;
    return tasks.map((task) => {
      const uniqueKey = `${task.phase}-${task.id}`;
      const isCompleted = completedTaskIds.has(uniqueKey);
      const isVerified = verifiedTaskIds.has(uniqueKey);
      const taskPhase = derivedPhases.find((p) => p.id === task.phase);
      const phaseStatus = taskPhase?.status || task.status;

      if (isCompleted || phaseStatus === "completed") {
        return { ...task, uniqueKey, status: "completed", verified: isVerified, phaseName: taskPhase?.name };
      }
      return {
        ...task,
        uniqueKey,
        status: phaseStatus === "in-progress" ? "in-progress" : "pending",
        verified: isVerified,
        phaseName: taskPhase?.name
      };
    });
  }, [derivedPhases, activeSOP, completedTaskIds, verifiedTaskIds]);

  const getPhaseIcon = (status) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "in-progress": return <AlertCircle className="w-5 h-5 text-blue-600" />;
      default: return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-pulse text-muted-foreground">Loading project details...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!project) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground opacity-50" />
          <h2 className="text-xl font-semibold">Project not found</h2>
          <Button variant="outline" onClick={() => navigate("/admin/projects")}>
            Back to Projects
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="relative flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <Button 
            variant="ghost" 
            className="w-fit pl-0 hover:bg-transparent hover:underline"
            onClick={() => navigate("/admin/projects")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
                {getStatusBadge(project.status)}
              </div>
              <p className="text-muted-foreground">
                Created on {format(new Date(project.createdAt), "PPP")}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Overview</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setDescriptionDialogOpen(true)}>
                    <FileText className="h-4 w-4 mr-2" />
                    View Description
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t mt-4">
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Client Budget</span>
                    <span className="font-semibold text-lg">
                      {formatCurrency(project.proposals?.find(p => p.status === 'ACCEPTED')?.amount || project.budget)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Freelancer Pay</span>
                    <span className="font-semibold text-lg text-emerald-600">
                      {formatCurrency((project.proposals?.find(p => p.status === 'ACCEPTED')?.amount || project.budget) * 0.7)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Spent</span>
                    <span className="font-semibold text-lg">{formatCurrency(project.spent)}</span>
                  </div>
                  <div>
                     <span className="text-xs text-muted-foreground block mb-1">Disputes</span>
                     <span className={`font-semibold text-lg ${project.disputes?.filter(d => d.status !== 'RESOLVED').length > 0 ? 'text-red-500' : ''}`}>
                       {project.disputes?.filter(d => d.status !== 'RESOLVED').length || 0}
                     </span>
                  </div>
                </div>
              </CardContent>
            </Card>

             {/* Disputes Section */}
             {project.disputes?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Active Disputes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                   <div className="space-y-3">
                     {project.disputes.map(dispute => {
                       const statusStyle = (() => {
                         const s = (dispute.status || "").toUpperCase();
                         if (s === "RESOLVED") {
                           return {
                             container: "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800 hover:bg-emerald-100/50",
                             text: "text-emerald-900 dark:text-emerald-200",
                             muted: "text-emerald-700 dark:text-emerald-300",
                             badge: "text-emerald-600 border-emerald-200"
                           };
                         }
                         if (s === "IN_PROGRESS") {
                           return {
                             container: "bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800 hover:bg-amber-100/50",
                             text: "text-amber-900 dark:text-amber-200",
                             muted: "text-amber-700 dark:text-amber-300",
                             badge: "text-amber-600 border-amber-200"
                           };
                         }
                         return {
                           container: "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-800 hover:bg-red-100/50",
                           text: "text-red-900 dark:text-red-200",
                           muted: "text-red-700 dark:text-red-300",
                           badge: "text-red-600 border-red-200"
                         };
                       })();

                       return (
                         <div 
                           key={dispute.id} 
                           className={`p-3 rounded border cursor-pointer transition-colors ${statusStyle.container}`}
                           onClick={() => {
                             setSelectedDispute(dispute);
                             setDisputeDialogOpen(true);
                           }}
                         >
                           <div className="flex justify-between items-start mb-1">
                              <span className={`font-medium text-sm ${statusStyle.text}`}>
                                Raised by {dispute.raisedBy?.fullName}
                              </span>
                              <Badge variant="outline" className={`${statusStyle.badge}`}>{dispute.status}</Badge>
                           </div>
                           <p className={`text-sm line-clamp-2 ${statusStyle.muted}`}>
                             {dispute.description}
                           </p>
                         </div>
                       );
                     })}
                   </div>
                </CardContent>
              </Card>
            )}

            {/* Project Phases */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Project Phases</CardTitle>
                <CardDescription>Overall progress: {Math.round(overallProgress)}%</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {derivedPhases.map((phase) => (
                   <div key={phase.id} className="flex items-start gap-3 pb-3 border-b border-border/60 last:border-0 rounded p-2">
                      <div className="mt-1">{getPhaseIcon(phase.status)}</div>
                      <div className="flex-1 min-w-0">
                         <div className="flex items-center gap-2 mb-2">
                           <h3 className="font-semibold text-sm">{phase.name}</h3>
                           <Badge variant={phase.status === 'completed' ? 'default' : 'outline'} className={phase.status === 'completed' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                             {phase.status === 'completed' ? 'Completed' : phase.status === 'in-progress' ? 'In Progress' : 'Pending'}
                           </Badge>
                         </div>
                         <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                           <div className="h-full bg-primary/80 transition-all duration-500" style={{ width: `${phase.progress}%` }} />
                         </div>
                      </div>
                   </div>
                ))}
              </CardContent>
            </Card>

            {/* Project Tasks */}
             <Card>
              <CardHeader>
                <CardTitle>Project Tasks</CardTitle>
                <CardDescription>
                  Detailed breakdown of SOP tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {derivedPhases.map((phase) => {
                    const phaseTasks = derivedTasks.filter(t => t.phase === phase.id);
                    return (
                      <AccordionItem key={phase.id} value={phase.id}>
                        <AccordionTrigger className="hover:no-underline py-3">
                          <div className="flex items-center gap-2">
                             {getPhaseIcon(phase.status)}
                             <span className="font-medium text-sm">{phase.name}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                           <div className="space-y-2 pt-2">
                             {phaseTasks.map(task => (
                               <div key={task.uniqueKey} className="flex items-center gap-3 p-3 rounded-lg border bg-card/50">
                                  {task.status === "completed" ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                  ) : (
                                    <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                  )}
                                  <span className={`text-sm flex-1 ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                                    {task.title}
                                  </span>
                                  {task.verified && (
                                     <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100">Verified</Badge>
                                  )}
                               </div>
                             ))}
                           </div>
                        </AccordionContent>
                      </AccordionItem>
                    )
                  })}
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Right Column */}
          <div className="space-y-6">
            
            {/* Project Chat */}
            <Card className="flex flex-col h-[500px]">
              <CardHeader className="border-b pb-3">
                <CardTitle className="text-base">Communication Log</CardTitle>
                <CardDescription className="text-xs">
                  Client & Freelancer Messages
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {project.conversation ? (
                  <>
                     {project.conversation.messages && project.conversation.messages.length > 0 ? (
                       project.conversation.messages.map((msg) => (
                         <div key={msg.id} className={`flex flex-col ${msg.sender?.role === 'CLIENT' ? 'items-start' : 'items-end'}`}>
                           <div className={`max-w-[90%] rounded-lg p-2.5 text-sm ${
                             msg.sender?.role === 'CLIENT' 
                               ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100 rounded-tl-none' 
                               : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100 rounded-tr-none'
                           }`}>
                             <div className="text-[10px] font-bold mb-0.5 opacity-70">
                               {msg.sender?.fullName || msg.role}
                             </div>
                             <p className="whitespace-pre-wrap leading-snug">{msg.content}</p>
                           </div>
                           <span className="text-[10px] text-muted-foreground mt-0.5 px-1">
                             {format(new Date(msg.createdAt), "MMM d, h:mm a")}
                           </span>
                         </div>
                       ))
                     ) : (
                       <p className="text-center text-muted-foreground py-10 text-sm">No messages yet.</p>
                     )}
                  </>
                ) : (
                   <div className="flex flex-col items-center justify-center h-full text-muted-foreground bg-muted/10 rounded border border-dashed">
                     <Mail className="h-8 w-8 mb-2 opacity-50" />
                     <p className="text-sm">No chat history found.</p>
                   </div>
                )}
              </CardContent>
            </Card>

            {/* Client Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" /> Club (Client)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                 <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                     {project.owner?.fullName?.[0]}
                   </div>
                   <div>
                     <div className="font-medium">{project.owner?.fullName}</div>
                     <div className="text-sm text-muted-foreground">{project.owner?.email}</div>
                   </div>
                 </div>
                 <div className="pt-2 text-xs text-muted-foreground border-t mt-2">
                    Joined {format(new Date(project.owner?.createdAt || new Date()), "MMM yyyy")}
                 </div>
              </CardContent>
            </Card>

            {/* Freelancer Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-emerald-600" /> Freelancer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {project.freelancer ? (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                        {project.freelancer?.fullName?.[0]}
                      </div>
                      <div>
                        <div className="font-medium">{project.freelancer?.fullName}</div>
                        <div className="text-sm text-muted-foreground">{project.freelancer?.email}</div>
                      </div>
                    </div>
                    <div className="pt-2 text-xs text-muted-foreground border-t mt-2">
                       Status: <span className="text-emerald-600 font-medium">Active on Project</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 text-muted-foreground text-sm italic">
                    No freelancer assigned yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <DisputeDetailsDialog 
        dispute={selectedDispute}
        open={disputeDialogOpen}
        onOpenChange={setDisputeDialogOpen}
      />
      
      <ProposalsListDialog
        proposals={project.proposals}
        open={proposalsDialogOpen}
        onOpenChange={setProposalsDialogOpen}
      />

      <ProjectDescriptionDialog
        description={project.description}
        open={descriptionDialogOpen}
        onOpenChange={setDescriptionDialogOpen}
      />
    </AdminLayout>
  );
};

export default AdminProjectDetail;
