 import React, { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  CalendarRange,
  Clock,
  Copy,
  MessageSquare,
  PanelLeftClose,
  Sparkles,
  Banknote,
  Save,
  Send,
  FileText,
  Star,
  MapPin,
  CheckCircle,
  Heart,
  ChevronRight,
  Zap,
  X,
  Trash2,
  Loader2,
} from "lucide-react";
import { RoleAwareSidebar } from "@/components/dashboard/RoleAwareSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { getSession } from "@/lib/auth-storage";
import { ClientTopBar } from "@/components/client/ClientTopBar";
import { listFreelancers } from "@/lib/api-client";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

// No static fallback data - all metrics loaded from API

const SAVED_PROPOSAL_STORAGE_KEYS = [
  "markify:savedProposal",
  "savedProposal",
];

const PRIMARY_PROPOSAL_STORAGE_KEY = SAVED_PROPOSAL_STORAGE_KEYS[0];
const PROPOSAL_DRAFT_STORAGE_KEY = "markify:pendingProposal";

const loadSavedProposalFromStorage = () => {
  if (typeof window === "undefined") {
    return null;
  }

  for (const storageKey of SAVED_PROPOSAL_STORAGE_KEYS) {
    const rawValue = window.localStorage.getItem(storageKey);
    if (!rawValue) continue;
    try {
      const parsed = JSON.parse(rawValue);
      // Load any valid proposal for the Dashboard view
      // The Drafts page has its own stricter filtering for saved drafts
      if (parsed && (parsed.content || parsed.summary || parsed.projectTitle)) {
        return parsed;
      }
    } catch {
      // If can't parse, skip
      continue;
    }
  }

  return null;
};

const persistSavedProposalToStorage = (proposal) => {
  if (typeof window === "undefined" || !proposal) {
    return;
  }

  window.localStorage.setItem(
    PRIMARY_PROPOSAL_STORAGE_KEY,
    JSON.stringify(proposal)
  );
};

const persistProposalDraftToStorage = (proposal) => {
  if (typeof window === "undefined" || !proposal) {
    return;
  }
  window.localStorage.setItem(
    PROPOSAL_DRAFT_STORAGE_KEY,
    JSON.stringify(proposal)
  );
};

const clearSavedProposalFromStorage = () => {
  if (typeof window === "undefined") {
    return;
  }

  SAVED_PROPOSAL_STORAGE_KEYS.forEach((storageKey) => {
    window.localStorage.removeItem(storageKey);
  });
  window.localStorage.removeItem("markify:savedProposalSynced");
};

const FreelancerCard = ({ freelancer, onSend, canSend, onViewProfile }) => {
  return (
    <Card className="group w-full hover:shadow-xl hover:border-primary/20 flex flex-col overflow-hidden bg-card transition-all duration-300">
      {/* Header Section - Name and Avatar */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-4">
          <div className="relative flex h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-background shadow-sm ring-1 ring-border">
            {freelancer.avatar ? (
              <img
                className="aspect-square h-full w-full object-cover"
                src={freelancer.avatar}
                alt={freelancer.name}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary font-bold text-lg">
                {freelancer.name?.charAt(0) || "F"}
              </div>
            )}
          </div>
          <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
            {freelancer.name}
          </h3>
        </div>
        
        {/* Skills */}
        {(freelancer.skills || []).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {(freelancer.skills || []).slice(0, 4).map((skill, index) => (
              <Badge key={index} variant="outline" className="bg-muted/50 text-xs">
                {skill}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="px-6 pb-6 mt-auto">
         <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="w-full font-semibold"
              onClick={() => onViewProfile?.(freelancer)}
            >
              View Profile
            </Button>
            <Button 
              className="w-full gap-2 font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => onSend(freelancer)}
              disabled={!canSend}
            >
              Proposal <ChevronRight className="w-4 h-4" />
            </Button>
         </div>
      </div>
    </Card>
  );
};

const FreelancerCardSkeleton = () => (
  <Card className="w-full flex flex-col overflow-hidden bg-card">
    <div className="p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-14 w-14 rounded-full shrink-0" />
        <Skeleton className="h-6 w-32" />
      </div>
    </div>
    <div className="px-6 pb-6 mt-auto">
        <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    </div>
  </Card>
);

// Freelancer Profile Dialog - shows full profile details with premium design
const FreelancerProfileDialog = ({ freelancer, isOpen, onClose }) => {
  if (!freelancer) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto p-0 border-0 bg-gradient-to-b from-card via-card to-background shadow-2xl">
        {/* Animated Header with glassmorphism */}
        <div className="relative overflow-hidden">
          {/* Background gradient animation */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-purple-500/20 to-pink-500/10" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
          
          {/* Decorative circles */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />
          
          <div className="relative p-8 pb-20">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 rounded-full p-2 bg-background/50 backdrop-blur-sm border border-border/50 hover:bg-background/80 hover:scale-110 transition-all duration-200 z-10"
            >
              <X className="h-4 w-4" />
            </button>
            
            {/* Profile header */}
            <div className="flex items-start gap-5">
              {/* Avatar with glow effect */}
              <div className="relative group">
                <div className="absolute inset-0 bg-primary/50 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative flex h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-background shadow-2xl ring-2 ring-primary/40 group-hover:ring-primary/60 transition-all duration-300">
                  {freelancer.avatar ? (
                    <img
                      className="aspect-square h-full w-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                      src={freelancer.avatar}
                      alt={freelancer.name}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/40 text-primary font-bold text-3xl">
                      {freelancer.name?.charAt(0) || "F"}
                    </div>
                  )}
                </div>
                {/* Online indicator */}
                <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-background shadow-lg" />
              </div>
              
              {/* Name and info */}
              <div className="flex-1 min-w-0 pt-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-bold text-foreground truncate">
                    {freelancer.name}
                  </h2>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 border border-primary/30">
                    <CheckCircle className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[10px] font-semibold text-primary uppercase tracking-wide">Verified</span>
                  </div>
                </div>
                <p className="text-muted-foreground flex items-center gap-2 mt-2 text-sm">
                  <Briefcase className="w-4 h-4 text-primary/70" />
                  <span className="font-medium">{freelancer.specialty || "Freelancer"}</span>
                </p>
                {freelancer.availability && (
                  <p className="text-sm text-muted-foreground/70 flex items-center gap-2 mt-1">
                    <Clock className="w-3.5 h-3.5" />
                    {freelancer.availability}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Floating Stats Card */}
        <div className="flex justify-center -mt-12 px-6 relative z-10">
          <div className="flex items-center bg-card/95 backdrop-blur-xl border border-border/60 rounded-2xl shadow-xl overflow-hidden">
            {/* Rating */}
            <div className="flex flex-col items-center px-6 py-4 hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-2xl text-foreground">{freelancer.rating || "4.7"}</span>
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              </div>
              <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mt-1">Rating</span>
            </div>
            
            <div className="w-px h-12 bg-gradient-to-b from-transparent via-border to-transparent" />
            
            {/* Projects */}
            <div className="flex flex-col items-center px-6 py-4 hover:bg-muted/30 transition-colors">
              <span className="font-bold text-2xl text-foreground">{freelancer.projects || "4+"}</span>
              <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mt-1">Projects</span>
            </div>
            
            <div className="w-px h-12 bg-gradient-to-b from-transparent via-border to-transparent" />
            
            {/* Success Rate */}
            <div className="flex flex-col items-center px-6 py-4 hover:bg-muted/30 transition-colors">
              <span className="font-bold text-2xl text-emerald-500">{freelancer.successRate || "98%"}</span>
              <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mt-1">Success</span>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="p-6 pt-8 space-y-6">
          {/* About Section */}
          <div className="space-y-3 p-5 rounded-2xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/40">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-primary" />
              </div>
              About
            </h3>
            <p className="text-foreground/90 leading-relaxed text-[15px]">
              {(() => {
                // Handle bio that might be JSON string or object
                let bioText = freelancer.bio;
                if (typeof bioText === 'string' && bioText.startsWith('{')) {
                  try {
                    const parsed = JSON.parse(bioText);
                    bioText = parsed.bio || parsed.about || null;
                  } catch { /* keep original */ }
                }
                if (typeof bioText === 'object' && bioText !== null) {
                  bioText = bioText.bio || bioText.about || null;
                }
                return bioText || `Experienced ${freelancer.specialty || "freelancer"} professional with a passion for delivering high-quality work. Ready to help bring your project to life with expertise and dedication.`;
              })()}
            </p>
          </div>

          {/* Projects Section - Image Gallery */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground px-1">Projects</h3>
            <div className="grid grid-cols-3 gap-3">
              {/* Sample project images - in real app, these would come from freelancer.projects */}
              {[1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  className="aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-muted/50 to-muted/30 border border-border/40 hover:border-primary/40 transition-all duration-200 cursor-pointer group"
                >
                  {freelancer.projectImages?.[i - 1] ? (
                    <img 
                      src={freelancer.projectImages[i - 1]} 
                      alt={`Project ${i}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                      <FileText className="w-8 h-8" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Skills Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground px-1">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {(freelancer.skills?.length ? freelancer.skills : freelancer.specialty?.split(",") || ["Freelancer"]).map((skill, idx) => (
                <Badge 
                  key={idx} 
                  variant="secondary"
                  className="px-4 py-1.5 text-sm font-medium bg-primary/5 border border-primary/20 text-foreground hover:bg-primary/10 hover:border-primary/40 hover:scale-105 transition-all duration-200 cursor-default"
                >
                  {typeof skill === 'string' ? skill.trim() : skill}
                </Badge>
              ))}
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Hourly Rate */}
            {freelancer.hourlyRate && (
              <div className="group p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-200">
                <div className="flex items-center gap-2 mb-2">
                  <Banknote className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Hourly Rate</h3>
                </div>
                <p className="text-2xl font-bold text-emerald-500">
                  ₹{freelancer.hourlyRate}<span className="text-sm font-normal text-muted-foreground">/hr</span>
                </p>
              </div>
            )}

            {/* Member Since */}
            {freelancer.memberSince && (
              <div className="group p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-200">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Member Since</h3>
                </div>
                <p className="text-xl font-bold text-foreground">
                  {freelancer.memberSince}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-2 flex gap-3 border-t border-border/40 bg-gradient-to-t from-muted/20 to-transparent">
          <Button variant="outline" className="flex-1 h-12 font-semibold" onClick={onClose}>
            Close
          </Button>
          <Button className="flex-1 h-12 gap-2 font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20">
            <Send className="w-4 h-4" />
            Send Proposal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ClientDashboardContent = () => {
  const [sessionUser, setSessionUser] = useState(null);
  const [savedProposal, setSavedProposal] = useState(null);
  const [proposalDeliveryState, setProposalDeliveryState] = useState("idle");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [proposalDraft, setProposalDraft] = useState("");
  const [proposalDraftContent, setProposalDraftContent] = useState("");
  const [isFreelancerModalOpen, setIsFreelancerModalOpen] = useState(false);
  const [pendingSendFreelancer, setPendingSendFreelancer] = useState(null);
  const [isSendConfirmOpen, setIsSendConfirmOpen] = useState(false);
  const [isSendingProposal, setIsSendingProposal] = useState(false);
  const [freelancers, setFreelancers] = useState([]);
  const [freelancersLoading, setFreelancersLoading] = useState(false);
  const { authFetch } = useAuth();
  const [notificationsChecked, setNotificationsChecked] = useState(false);
  const [projects, setProjects] = useState([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const heroSubtitle = "Review proposals, unlock talent, and keep budgets on track.";
  const [metrics, setMetrics] = useState([]);
  const [viewProfileFreelancer, setViewProfileFreelancer] = useState(null);

  const handleViewProfile = (freelancer) => {
    setViewProfileFreelancer(freelancer);
  };

  useEffect(() => {
    const session = getSession();
    setSessionUser(session?.user ?? null);
  }, []);

  useEffect(() => {
    setSavedProposal(loadSavedProposalFromStorage());
  }, []);

  // Load projects for metrics
  useEffect(() => {
    const loadProjects = async () => {
      if (!authFetch) return;
      try {
        setIsLoadingProjects(true);
        const response = await authFetch("/projects");
        const payload = await response.json().catch(() => null);
        const list = Array.isArray(payload?.data) ? payload.data : [];
        setProjects(list);

        // Build metrics from project data
        // Active projects = projects with at least one accepted proposal (work has started)
        const projectsWithAccepted = list.filter((p) => {
          const hasAccepted = (p.proposals || []).some(
            (pr) => (pr.status || "").toUpperCase() === "ACCEPTED"
          );
          return hasAccepted;
        });
        const activeCount = projectsWithAccepted.filter(
          (p) => (p.status || "").toUpperCase() !== "COMPLETED"
        ).length;
        
        const completed = list.filter(
          (p) => (p.status || "").toUpperCase() === "COMPLETED"
        );
        const proposalsSent = list.reduce(
          (acc, project) => acc + (project.proposals?.filter(p => p.status !== 'DRAFT').length || 0),
          0
        );
        const inProgress = list.filter(
          (p) => ["IN_PROGRESS", "OPEN"].includes((p.status || "").toUpperCase())
        );
        
        // Total spend from projects with accepted proposals
        const totalSpend = projectsWithAccepted.reduce((acc, project) => {
          const budget = parseInt(project.budget) || 0;
          return acc + budget;
        }, 0);
        
        // Count projects awaiting review (pending proposals or no accepted freelancer yet)
        const awaitingReview = list.filter((p) => {
          const hasAccepted = (p.proposals || []).some(
            (pr) => (pr.status || "").toUpperCase() === "ACCEPTED"
          );
          return !hasAccepted && (p.status || "").toUpperCase() !== "COMPLETED";
        }).length;

        setMetrics([
          {
            label: "Active projects",
            value: String(activeCount),
            trend: `${awaitingReview} awaiting review`,
            icon: Briefcase,
          },
          {
            label: "Completed projects",
            value: String(completed.length),
            trend: `${inProgress.length} in progress`,
            icon: Sparkles,
          },
          {
            label: "Proposals Sent",
            value: String(proposalsSent),
            trend: proposalsSent
              ? "Vendors are responsive"
              : "Send your first proposal",
            icon: Clock,
          },
          {
            label: "Total Spend",
            value: totalSpend ? `₹${totalSpend.toLocaleString()}` : "₹0",
            trend: projectsWithAccepted.length ? `From ${projectsWithAccepted.length} active` : "No active projects",
            icon: Banknote,
          },
        ]);

        // Check if saved proposal's project has an accepted proposal - if so, clear it
        // IMPORTANT: Only clear if we have a matching projectId - title matching alone is too broad
        // because proposals created via AI chat don't have a projectId yet
        const currentSavedProposal = loadSavedProposalFromStorage();
        if (currentSavedProposal) {
          const savedProjectId = currentSavedProposal.projectId;
          
          // Only match by projectId - title matching can cause false positives
          if (savedProjectId) {
            const matchingProject = list.find((p) => p.id === savedProjectId);
            
            if (matchingProject) {
              const hasAcceptedProposal = (matchingProject.proposals || []).some(
                (pr) => (pr.status || "").toUpperCase() === "ACCEPTED"
              );
              
              if (hasAcceptedProposal) {
                // Clear the saved proposal since it's been accepted
                clearSavedProposalFromStorage();
                setSavedProposal(null);
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to load projects", error);
        // Set empty metrics on error - no fallback to static data
        setMetrics([]);
      } finally {
        setIsLoadingProjects(false);
      }
    };

    loadProjects();
  }, [authFetch]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleStorageChange = (event) => {
      if (event?.key && !SAVED_PROPOSAL_STORAGE_KEYS.includes(event.key)) {
        return;
      }
      setSavedProposal(loadSavedProposalFromStorage());
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    if (savedProposal && proposalDeliveryState === "idle") {
      setProposalDeliveryState("pending");
      return;
    }

    if (!savedProposal && proposalDeliveryState === "pending") {
      setProposalDeliveryState("idle");
    }
  }, [savedProposal, proposalDeliveryState]);

  const roleLabel = useMemo(() => {
    const baseRole = sessionUser?.role ?? "CLIENT";
    const normalized = baseRole.toLowerCase();
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }, [sessionUser]);

  const dashboardLabel = sessionUser?.fullName?.trim()
    ? `${sessionUser.fullName.trim()}'s dashboard`
    : `${roleLabel} dashboard`;

  const heroTitle = sessionUser?.fullName?.trim()
    ? `${sessionUser.fullName.split(" ")[0]}'s control room`
    : `${roleLabel} control room`;

  const cleanProposalContent = (content = "") => {
    if (!content || typeof content !== "string") return "";
    let cleaned = content;
    cleaned = cleaned.replace(/\*\*PROJECT PROPOSAL\*\*/gi, "");
    cleaned = cleaned.replace(/\*\*Project Title:\*\*.*(\r?\n)?/gi, "");
    cleaned = cleaned.replace(/\*\*Prepared for:\*\*.*(\r?\n)?/gi, "");
    cleaned = cleaned.replace(/^-+\s*Project Proposal\s*-+/gi, "");
    cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
    return cleaned.trim();
  };

  const formatDateTime = (value) => {
    if (!value) return null;
    const parsed = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(parsed.getTime())) return String(value);
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(parsed);
  };

  const savedProposalDetails = useMemo(() => {
    if (!savedProposal) {
      return null;
    }

    const baseProposal =
      typeof savedProposal === "object" && savedProposal !== null
        ? savedProposal
        : { content: savedProposal };

    const service =
      baseProposal.service ||
      baseProposal.category ||
      baseProposal.professionalField ||
      baseProposal.serviceType ||
      baseProposal.projectTitle ||
      "General services";

    const projectTitle =
      baseProposal.projectTitle ||
      baseProposal.title ||
      baseProposal.project ||
      service ||
      "Untitled project";

    const projectSubtype =
      baseProposal.projectSubtype ||
      baseProposal.projectType ||
      baseProposal.buildType ||
      baseProposal.appType ||
      baseProposal.siteType ||
      null;

    const summary =
      baseProposal.summary ||
      baseProposal.executiveSummary ||
      baseProposal.description ||
      baseProposal.notes ||
      baseProposal.content ||
      "";
    const cleanedSummary = cleanProposalContent(summary);

    const budgetValue =
      baseProposal.budget || baseProposal.budgetRange || baseProposal.estimate;

    const preparedFor =
      baseProposal.preparedFor ||
      baseProposal.client ||
      baseProposal.clientName ||
      sessionUser?.fullName ||
      "Client";

    const createdAtValue =
      baseProposal.createdAt ||
      baseProposal.savedAt ||
      baseProposal.timestamp ||
      baseProposal.created_on ||
      baseProposal.created;

    const createdAtDisplay = formatDateTime(
      createdAtValue || baseProposal.createdAt || new Date()
    );

    const freelancerName =
      baseProposal.freelancerName ||
      baseProposal.targetFreelancer ||
      baseProposal.vendor ||
      baseProposal.recipient ||
      "Freelancer";

    return {
      projectTitle,
      service,
      preparedFor,
      summary: cleanedSummary,
      projectSubtype,
      budget:
        typeof budgetValue === "number"
          ? `₹${budgetValue.toLocaleString()}`
          : budgetValue,
      createdAtDisplay: createdAtDisplay ?? new Date().toLocaleString(),
      freelancerName,
      raw: baseProposal,
    };
  }, [savedProposal, sessionUser]);

  const hasSavedProposal = Boolean(savedProposalDetails);

  const matchingFreelancers = useMemo(() => {
    // Use only API-loaded freelancers, no static fallback
    if (!freelancers.length) return [];
    if (!savedProposalDetails?.service) return freelancers;
    const term = savedProposalDetails.service.toLowerCase();
    const filtered = freelancers.filter((f) => {
      const specialty = f.specialty?.toLowerCase() || "";
      const match = f.serviceMatch?.toLowerCase() || "";
      return match.includes(term) || specialty.includes(term);
    });
    return filtered.length ? filtered : freelancers;
  }, [savedProposalDetails, freelancers]);

  const sendProposalToFreelancer = async (freelancer) => {
    if (!savedProposalDetails) return;
    if (!freelancer?.id) {
      toast.error(
        "Please select a freelancer with a valid account to send this proposal."
      );
      return;
    }

    const coverLetter =
      savedProposalDetails.summary ||
      savedProposalDetails.raw?.coverLetter ||
      "Proposal submission";

    const amount = Number(
      (
        savedProposalDetails.raw?.budget ||
        savedProposalDetails.raw?.budgetRange ||
        savedProposalDetails.raw?.estimate ||
        ""
      )
        .toString()
        .replace(/[^0-9.]/g, "")
    );

    const resolveProject = async () => {
      const existingProjectId =
        savedProposalDetails.raw?.projectId ||
        savedProposalDetails.raw?.project?.id ||
        savedProposalDetails.projectId ||
        null;

      if (existingProjectId)
        return { projectId: existingProjectId, proposalFromProject: null };

      // Create a minimal project and attach the proposal in one call.
      const payload = {
        title: savedProposalDetails.projectTitle || "Untitled Project",
        description:
          coverLetter ||
          savedProposalDetails.service ||
          "Project created for proposal",
        budget: Number.isFinite(amount) ? amount : undefined,
        proposal: {
          coverLetter,
          amount: Number.isFinite(amount) ? amount : 0,
          status: "PENDING",
          freelancerId: freelancer.id,
        },
      };

      const projectResp = await authFetch("/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!projectResp.ok) {
        const projectPayload = await projectResp.json().catch(() => null);
        throw new Error(
          projectPayload?.message || "Unable to create project for proposal."
        );
      }

      const projectPayload = await projectResp.json().catch(() => null);
      return {
        projectId:
          projectPayload?.data?.project?.id || projectPayload?.data?.id || null,
        proposalFromProject: projectPayload?.data?.proposal || null,
      };
    };

    try {
      const { projectId, proposalFromProject } = await resolveProject();
      if (!projectId) {
        throw new Error("No project available for this proposal.");
      }

      // IMPORTANT: Save the projectId to the saved proposal so subsequent sends use the SAME project
      // This prevents creating duplicate projects when sending to multiple freelancers
      if (savedProposal && !savedProposal.projectId) {
        const updatedProposal = { ...savedProposal, projectId };
        persistSavedProposalToStorage(updatedProposal);
        setSavedProposal(updatedProposal);
      }

      // If the project creation already created the proposal, we are done.
      if (proposalFromProject?.id) {
        toast.success(`Proposal sent to ${freelancer.name}`);
        setIsFreelancerModalOpen(false);
        setProposalDeliveryState("sent");
        return;
      }

      // Otherwise, create the proposal against the project.
      const response = await authFetch("/proposals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          coverLetter,
          amount: Number.isFinite(amount) ? amount : 0,
          status: "PENDING",
          freelancerId: freelancer.id,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message = payload?.message || "Failed to send proposal.";
        throw new Error(message);
      }

      toast.success(`Proposal sent to ${freelancer.name}`);
      setIsFreelancerModalOpen(false);
      
      // NOTE: We intentionally do NOT clear the saved proposal here.
      // The proposal should remain visible so the client can send to more freelancers.
      // It will only be cleared when a freelancer accepts (checked in loadProjects)
      setProposalDeliveryState("sent");
    } catch (error) {
      console.error("Failed to send proposal:", error);
      toast.error(error?.message || "Unable to send proposal right now.");
    }
  };

  const handleClearSavedProposal = () => {
    clearSavedProposalFromStorage();
    setSavedProposal(null);
    setProposalDeliveryState("cleared");
  };

  const handleSaveProposalToDashboard = () => {
    if (!savedProposal) {
      return;
    }
    // Ensure both flags are set so proposal appears in drafts
    const proposalWithFlags = {
      ...savedProposal,
      savedAt: savedProposal.savedAt || new Date().toISOString(),
      isSavedDraft: true,
      updatedAt: new Date().toISOString(),
    };
    persistSavedProposalToStorage(proposalWithFlags);
    setSavedProposal(proposalWithFlags);
    setProposalDeliveryState("saved");
    toast.success("Proposal saved to drafts!");
  };

  const handleSendProposal = () => {
    if (!savedProposalDetails) {
      return;
    }

    setProposalDeliveryState("sent");
    setIsFreelancerModalOpen(true);
  };

  const requestSendToFreelancer = (freelancer) => {
    setPendingSendFreelancer(freelancer);
    setIsSendConfirmOpen(true);
  };

  const handleConfirmSend = async () => {
    if (!pendingSendFreelancer) return;
    try {
      setIsSendingProposal(true);
      await sendProposalToFreelancer(pendingSendFreelancer);
      setPendingSendFreelancer(null);
      setIsSendConfirmOpen(false);
    } finally {
      setIsSendingProposal(false);
    }
  };

  const handleCancelSend = () => {
    setPendingSendFreelancer(null);
    setIsSendConfirmOpen(false);
  };

  useEffect(() => {
    const fetchFreelancers = async () => {
      try {
        setFreelancersLoading(true);
        const data = await listFreelancers();
        const normalized = Array.isArray(data)
          ? data.map((f) => {
              const skillsArray = Array.isArray(f.skills) ? f.skills : [];
              const skillsText = skillsArray.length
                ? skillsArray.join(", ")
                : f.bio || "Freelancer";
              return {
                // Core identifying fields from backend
                id: f.id,
                email: f.email,
                name: f.fullName || f.name || "Freelancer",
                fullName: f.fullName,
                
                // Profile details from backend
                bio: f.bio || "",
                skills: skillsArray,
                specialty: skillsText,
                hourlyRate: f.hourlyRate || null,
                
                // Display fields (derived or fallback)
                rating: f.rating || "4.7",
                projects: f.projectsCount || f.projects || "4+",
                successRate: f.successRate || "98%",
                availability:
                  f.availability ||
                  (f.hourlyRate ? `₹${f.hourlyRate}/hr` : "Available"),
                serviceMatch: skillsText || "Freelancer",
                avatar:
                  f.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(f.fullName || "Freelancer")}&background=random&size=256`,
                
                // Dates
                createdAt: f.createdAt,
                memberSince: f.createdAt ? new Date(f.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : null,
              };
            })
          : [];
        setFreelancers(normalized);
      } catch (error) {
        console.error("Failed to load freelancers", error);
      } finally {
        setFreelancersLoading(false);
      }
    };

    if (
      isFreelancerModalOpen &&
      freelancers.length === 0 &&
      !freelancersLoading
    ) {
      fetchFreelancers();
    }
  }, [isFreelancerModalOpen, freelancers.length, freelancersLoading]);

  useEffect(() => {
    if (notificationsChecked) return;
    if (typeof window === "undefined") return;
    const stored = JSON.parse(
      localStorage.getItem("client:notifications") || "[]"
    );
    if (stored.length) {
      stored.forEach((notif) => {
        toast.success(notif.message);
      });
      localStorage.removeItem("client:notifications");
    }
    setNotificationsChecked(true);
  }, [notificationsChecked]);

  const handleOpenProposalEditor = () => {
    if (!savedProposalDetails) return;
    const draft =
      savedProposalDetails.summary ||
      savedProposalDetails.raw?.content ||
      savedProposalDetails.raw?.summary ||
      "";
    setProposalDraft(draft);
    setIsEditModalOpen(true);
  };

  const handleSaveProposalEdit = () => {
    if (!savedProposal) return;
    const updatedProposal = {
      ...savedProposal,
      summary: proposalDraft,
      content: proposalDraft,
      updatedAt: new Date().toISOString(),
    };
    persistSavedProposalToStorage(updatedProposal);
    persistProposalDraftToStorage(updatedProposal);
    setSavedProposal(updatedProposal);
    setProposalDeliveryState("saved");
    setIsEditModalOpen(false);
    toast.success("Proposal updated.");
  };

  return (
    <>
      <div className="flex flex-col gap-6 p-6">
        <ClientTopBar label={dashboardLabel} />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {isLoadingProjects ? (
            // Skeleton loading for metrics
            [1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-dashed">
                <CardHeader className="flex-row items-center justify-between">
                  <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))
          ) : metrics.length > 0 ? (
            metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <Card key={metric.label} className="border-dashed">
                  <CardHeader className="flex-row items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Icon className="size-4 text-primary" />
                      {metric.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-3xl font-semibold">{metric.value}</p>
                    <p className="text-sm text-muted-foreground">
                      {metric.trend}
                    </p>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="col-span-4 border-dashed">
              <CardContent className="p-6 text-center text-muted-foreground">
                No project data available. Create a project to see your metrics.
              </CardContent>
            </Card>
          )}
        </section>

        {hasSavedProposal && (
        <section className="grid gap-6">
          <Card className="overflow-hidden border border-border bg-card text-card-foreground shadow-lg">
            <CardHeader className="space-y-1 border-b border-border bg-card">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-semibold text-foreground">
                      Saved Proposal
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {hasSavedProposal
                        ? `${savedProposalDetails.service} • Created ${savedProposalDetails.createdAtDisplay}`
                        : "Save a proposal before logging in and it will appear here."}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="border border-primary/50 bg-primary/20 text-primary">
                    Ready to Send
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={handleClearSavedProposal}
                    disabled={!hasSavedProposal}
                    aria-label="Delete saved proposal"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.4em] text-primary/70">
                  Project details
                </p>
                <div
                  className="mt-4 rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-lg"
                  style={{
                    backgroundColor: "var(--card)",
                    color: "var(--card-foreground)",
                    backgroundImage:
                      "linear-gradient(to bottom, rgba(0,0,0,0.03), rgba(0,0,0,0.05))",
                  }}
                >
                  <p className="text-[11px] uppercase tracking-[0.5em] text-primary">
                    --- Project Proposal ---
                  </p>
                  {hasSavedProposal ? (
                    <div className="mt-4 space-y-5">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase text-muted-foreground">
                          Project Title
                        </p>
                        <div className="flex flex-col gap-1">
                          <p className="text-xl font-semibold text-primary">
                            {savedProposalDetails.projectTitle}
                          </p>
                          {savedProposalDetails.projectSubtype ? (
                            <p className="text-xs uppercase tracking-[0.25em] text-primary/70">
                              {savedProposalDetails.projectSubtype}
                            </p>
                          ) : null}
                          <p className="text-xs text-muted-foreground">
                            Service: {savedProposalDetails.service}
                          </p>
                        </div>
                      </div>
                      <div className="grid gap-4 text-sm sm:grid-cols-3">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold uppercase text-primary/70">
                            Prepared for
                          </p>
                          <p className="text-foreground">
                            {savedProposalDetails.preparedFor}
                          </p>
                        </div>
                        {savedProposalDetails.budget ? (
                          <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase text-primary/70">
                              Budget
                            </p>
                            <p className="text-foreground">
                              {savedProposalDetails.budget}
                            </p>
                          </div>
                        ) : null}
                        <div className="space-y-1">
                          <p className="text-xs font-semibold uppercase text-primary/70">
                            Created
                          </p>
                          <p className="text-foreground">
                            {savedProposalDetails.createdAtDisplay}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2 rounded-xl border border-border bg-muted/40 p-4 text-sm leading-relaxed text-foreground">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/70">
                          Proposal Overview
                        </p>
                        <div className="max-h-80 overflow-y-auto pr-2 scrollbar-thin">
                          <pre className="whitespace-pre-wrap font-sans text-[14px] leading-7 text-foreground">
                            {savedProposalDetails.summary ||
                              "Proposal details recovered from your previous session."}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-muted-foreground">
                      Draft a proposal from the services page and we&apos;ll
                      keep a copy here so you can send it once you sign in.
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-11 flex-1 min-w-[140px] gap-2 rounded-full border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
                  onClick={handleOpenProposalEditor}
                  disabled={!hasSavedProposal}
                >
                  <Copy className="h-4 w-4" />
                  Edit your proposal
                </Button>
                <Button
                  size="lg"
                  className="h-11 flex-1 min-w-[160px] gap-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-30"
                  onClick={handleSendProposal}
                  disabled={!hasSavedProposal}
                >
                  <Send className="h-4 w-4" />
                  Send to Freelancer
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  className="h-11 flex-1 min-w-[120px] gap-2 rounded-full border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-30"
                  onClick={handleSaveProposalToDashboard}
                  disabled={!hasSavedProposal}
                >
                  <Save className="h-4 w-4" />
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
        )}
        <Dialog
          open={isFreelancerModalOpen}
          onOpenChange={(open) => {
            setIsFreelancerModalOpen(open);
            if (!open) setPendingSendFreelancer(null);
          }}
        >
          <DialogContent className="sm:max-w-[1400px] w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Send to a freelancer</DialogTitle>
              <DialogDescription>
                Based on this proposal, here are freelancers that fit. Pick one
                to send the proposal.
              </DialogDescription>
            </DialogHeader>
            <div className="p-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {freelancersLoading ? (
                // Show skeletons while loading
                [1, 2, 3].map((i) => (
                  <FreelancerCardSkeleton key={i} />
                ))
              ) : (matchingFreelancers.length || freelancers.length) ? (
                (matchingFreelancers.length ? matchingFreelancers : freelancers).map((freelancer, idx) => {
                  const canSend = Boolean(freelancer.id);
                  const enrichedFreelancer = {
                      ...freelancer,
                      skills: Array.isArray(freelancer.skills) ? freelancer.skills : (freelancer.specialty ? freelancer.specialty.split("•").map(s => s.trim()) : []),
                      bio: freelancer.bio || "Professional freelancer ready to work."
                  };
                  
                  return (
                    <FreelancerCard 
                      key={`${freelancer.name}-${idx}`} 
                      freelancer={enrichedFreelancer} 
                      onSend={requestSendToFreelancer}
                      canSend={canSend}
                      onViewProfile={handleViewProfile}
                    />
                  );
                })
              ) : (
                <div className="col-span-3 text-center py-8 text-muted-foreground">
                  No freelancers available. Please try again later.
                </div>
              )}
              </div>
              {!matchingFreelancers.length && !freelancersLoading && (
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Showing recommended freelancers across all services.
                </p>
              )}
            </div>
            <DialogFooter className="justify-end">
              <Button
                variant="ghost"
                onClick={() => setIsFreelancerModalOpen(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[860px]">
            <DialogHeader>
              <DialogTitle>Edit proposal</DialogTitle>
              <DialogDescription>
                Adjust the proposal content before sending. Changes are saved to your browser.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Proposal content
              </label>
              <textarea
                className="w-full min-h-[460px] resize-vertical rounded-md border border-border bg-background p-4 text-base text-foreground leading-6"
                value={proposalDraft}
                onChange={(e) => setProposalDraft(e.target.value)}
              />
            </div>
            <DialogFooter className="justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveProposalEdit} disabled={!proposalDraft.trim()}>
                Save changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={isSendConfirmOpen} onOpenChange={handleCancelSend}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Send this proposal?</DialogTitle>
              <DialogDescription>
                This will send the proposal to {pendingSendFreelancer?.name || "the selected freelancer"}.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="justify-end gap-2">
              <Button variant="ghost" onClick={handleCancelSend}>
                Cancel
              </Button>
              <Button onClick={handleConfirmSend} disabled={!pendingSendFreelancer || isSendingProposal}>
                {isSendingProposal ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send now"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Freelancer Profile Popup */}
        <FreelancerProfileDialog
          freelancer={viewProfileFreelancer}
          isOpen={Boolean(viewProfileFreelancer)}
          onClose={() => setViewProfileFreelancer(null)}
        />
      </div>
    </>
  );
};

const ClientDashboard = () => {
  return (
    <RoleAwareSidebar>
      <ClientDashboardContent />
    </RoleAwareSidebar>
  );
};

export default ClientDashboard;
