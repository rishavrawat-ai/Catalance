"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  Clock,
  Banknote,
  Send,
  Star,
  CheckCircle,
  ChevronRight,
  Zap,
  X,
  Trash2,
  Loader2,
  User,
  Wallet,
  Eye,
  Search,
  Bell,
  Plus,
  Calendar,
  Flag,
  MessageCircle,
  TrendingUp,
  AlertTriangle,
  Users,
  ArrowRight,
  Edit2,
  ExternalLink,
  Sun,
  Moon,
  CreditCard,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { RoleAwareSidebar } from "@/components/dashboard/RoleAwareSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { getSession } from "@/lib/auth-storage";
import { listFreelancers, fetchChatConversations, API_BASE_URL } from "@/lib/api-client";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { SuspensionAlert } from "@/components/ui/suspension-alert";
import { ClientTopBar } from "@/components/client/ClientTopBar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const buildUrl = (path) => `${API_BASE_URL}${path.replace(/^\/api/, "")}`;

// ==================== Stats Card Component ====================
const StatsCard = ({ title, value, trend, trendType = "up", icon: Icon, accentColor = "primary" }) => {
  const colors = {
    primary: "bg-primary/10",
    blue: "bg-blue-500/10",
    red: "bg-red-500/10",
    green: "bg-green-500/10",
  };

  return (
    <Card className="relative overflow-hidden group hover:shadow-md transition-shadow border-border/60">
      <div className={`absolute top-0 right-0 w-16 h-16 ${colors[accentColor]} rounded-bl-full -mr-2 -mt-2 transition-transform group-hover:scale-110`} />
      <CardContent className="p-6 relative z-10">
        <p className="text-muted-foreground text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
        {trend && (
          <p className={`text-xs mt-2 flex items-center font-bold ${
            trendType === "up" ? "text-green-600" : 
            trendType === "warning" ? "text-orange-600" : "text-muted-foreground"
          }`}>
            {trendType === "up" && <TrendingUp className="w-3.5 h-3.5 mr-1" />}
            {trendType === "warning" && <AlertTriangle className="w-3.5 h-3.5 mr-1" />}
            {trend}
          </p>
        )}
        {Icon && (
          <div className="mt-3 flex -space-x-2 overflow-hidden">
            {/* Placeholder for stacked avatars if needed */}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ==================== Budget Chart Component ====================
const BudgetChart = ({ percentage, remaining, total }) => {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold">Budget Utilization</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-muted/20"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="text-primary"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeDasharray={`${percentage}, 100`}
                strokeWidth="3"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-xl font-bold">{percentage}%</span>
            </div>
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <div>
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p className="text-sm font-bold">₹{remaining?.toLocaleString() || 0}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Budget</p>
              <p className="text-sm font-bold">₹{total?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ==================== Talent Item Component ====================
const TalentItem = ({ name, role, avatar, status = "online", onClick }) => {
  const statusColors = {
    online: "bg-green-500",
    away: "bg-yellow-500",
    offline: "bg-gray-300",
  };

  return (
    <li className="flex items-center gap-3 group cursor-pointer" onClick={onClick}>
      <div className="relative">
        <Avatar className="w-10 h-10">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback>{name?.charAt(0) || "?"}</AvatarFallback>
        </Avatar>
        <span className={`absolute bottom-0 right-0 w-3 h-3 ${statusColors[status]} border-2 border-background rounded-full`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate">{name}</p>
        <p className="text-xs text-muted-foreground truncate">{role}</p>
      </div>
      <Button 
        variant="ghost" 
        size="icon" 
        className="text-muted-foreground hover:text-primary group-hover:text-primary transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          onClick && onClick();
        }}
      >
        <MessageCircle className="w-4 h-4" />
      </Button>
    </li>
  );
};

// ==================== Main Dashboard Component ====================
const ClientDashboardContent = () => {
  const [sessionUser, setSessionUser] = useState(null);
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [freelancers, setFreelancers] = useState([]); // Chat freelancers
  const [suggestedFreelancers, setSuggestedFreelancers] = useState([]); // All freelancers for suggestions
  const [isLoading, setIsLoading] = useState(true);
  const [showSuspensionAlert, setShowSuspensionAlert] = useState(false);
  const [savedProposal, setSavedProposal] = useState(null);
  const [isSendingProposal, setIsSendingProposal] = useState(false);
  const [selectedFreelancer, setSelectedFreelancer] = useState(null);
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [showViewProposal, setShowViewProposal] = useState(false);
  const [showEditProposal, setShowEditProposal] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", summary: "", budget: "", timeline: "" });
  const [viewFreelancer, setViewFreelancer] = useState(null);
  const [showFreelancerDetails, setShowFreelancerDetails] = useState(false);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [projectToPay, setProjectToPay] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Load projects
  // Load session
  useEffect(() => {
    const session = getSession();
    setSessionUser(session?.user ?? null);
    if (session?.user?.status === "SUSPENDED") {
      setShowSuspensionAlert(true);
    }
  }, []);

  // Load saved proposal from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("markify:savedProposal");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.content || parsed.summary || parsed.projectTitle)) {
          // Try to extract timeline from content if not set
          if (!parsed.timeline && (parsed.content || parsed.summary)) {
            const text = parsed.content || parsed.summary || "";
            // Look for timeline patterns in content
            const timelineMatch = text.match(/Timeline(?:\s*\(with buffer\))?[:\s]*([^\n]+)/i);
            if (timelineMatch) {
              // Clean up the timeline value
              parsed.timeline = timelineMatch[1].trim().replace(/\(with buffer\)/gi, "").trim();
            }
          }
          // Try to extract budget from content if not set properly
          if ((!parsed.budget || parsed.budget === "Not set") && (parsed.content || parsed.summary)) {
            const text = parsed.content || parsed.summary || "";
            const budgetMatch = text.match(/Budget[:\s]*(?:INR\s*)?([₹\d,]+)/i)
              || text.match(/Budget range[:\s]*(?:INR\s*)?([₹\d,]+)/i);
            if (budgetMatch) {
              parsed.budget = budgetMatch[1].trim();
            }
          }
          setSavedProposal(parsed);
        }
      } catch { /* ignore parse errors */ }
    }
  }, []);

  // Load projects
  // Load projects function
  const loadProjects = async () => {
    if (!authFetch) return;
    try {
      setIsLoading(true);
      const response = await authFetch("/projects");
      const payload = await response.json().catch(() => null);
      const fetchedProjects = Array.isArray(payload?.data) ? payload.data : [];
      setProjects(fetchedProjects);

      // Check if any project matching the saved proposal has been accepted
      const saved = localStorage.getItem("markify:savedProposal");
      if (saved) {
        try {
          const parsedSaved = JSON.parse(saved);
          const savedTitle = parsedSaved.projectTitle || parsedSaved.title;
          
          // Find if there is a matching project that is active/accepted
          const matchingProject = fetchedProjects.find(p => 
            p.title === savedTitle && 
            (p.status === "IN_PROGRESS" || p.status === "AWAITING_PAYMENT" || 
             (p.proposals && p.proposals.some(prop => prop.status === "ACCEPTED")))
          );

          if (matchingProject) {
            // Proposal accepted! Clear the draft.
            localStorage.removeItem("markify:savedProposal");
            setSavedProposal(null);
            toast.success("Proposal accepted! Draft cleared.");
          }
        } catch (e) {
          console.error("Error checking saved proposal status", e);
        }
      }
    } catch (error) {
      console.error("Failed to load projects", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [authFetch]);

  // Load freelancers
  // Load freelancers (chat conversations)
  useEffect(() => {
    const loadChatFreelancers = async () => {
      try {
        const data = await fetchChatConversations();
        const chatFreelancers = (Array.isArray(data) ? data : [])
          .filter(c => c.freelancer) // only show if freelancer details exist
          .map(c => {
             const parts = (c.service || "").split(":");
             // Format: CHAT:PROJECT_ID:CLIENT_ID:FREELANCER_ID
             // If service key format matches, parts[1] is projectId.
             // Fallback to c.id if we can't parse (though ClientChat expects projectId)
             const projectId = (parts.length >= 2 && parts[0] === "CHAT") ? parts[1] : null;
             
             return {
              ...c.freelancer,
              chatId: c.id,
              projectId: projectId, // Add projectId for navigation
              lastMessage: c.lastMessage,
              projectTitle: c.projectTitle
             };
          })
          .slice(0, 3); // show top 3 recent chats

        if (chatFreelancers.length > 0) {
          setFreelancers(chatFreelancers);
        } else {
          setFreelancers([]);
        }
      } catch (error) {
        console.error("Failed to load chat freelancers", error);
        setFreelancers([]);
      }
    };
    loadChatFreelancers();
    loadChatFreelancers();
  }, []);

  // Load all freelancers for suggestions
  useEffect(() => {
    const loadAllFreelancers = async () => {
      try {
        const all = await listFreelancers();
        // Filter out suspended or invalid ones if needed
        // For now, just take top 6
        setSuggestedFreelancers(Array.isArray(all) ? all.slice(0, 6) : []);
      } catch (err) {
        console.error("Failed to load suggested freelancers:", err);
      }
    };
    loadAllFreelancers();
  }, []);

  // Computed metrics
  const metrics = useMemo(() => {
    const projectsWithAccepted = projects.filter((p) =>
      (p.proposals || []).some((pr) => (pr.status || "").toUpperCase() === "ACCEPTED")
    );
    
    // Use actual spent amount from projects, not full budget
    const actualSpent = projectsWithAccepted.reduce((acc, p) => {
      // If project has a 'spent' field, use it; otherwise use 50% of budget (upfront payment)
      const spent = p.spent !== undefined ? (parseInt(p.spent) || 0) : Math.round((parseInt(p.budget) || 0) * 0.5);
      return acc + spent;
    }, 0);
    
    const activeProjectsCount = projects.filter((p) => {
      const status = (p.status || "").toUpperCase();
      return status === "IN_PROGRESS" || status === "OPEN" || status === "AWAITING_PAYMENT";
    }).length;

    const totalBudget = projects
      .filter(p => {
        const status = (p.status || "").toUpperCase();
        return status !== "DRAFT" && status !== "COMPLETED";
      })
      .reduce((acc, p) => acc + (parseInt(p.budget) || 0), 0);

    return {
      totalSpent: actualSpent,
      activeProjects: activeProjectsCount,
      totalBudget: totalBudget,
    };
  }, [projects]);

  const budgetPercentage = useMemo(() => {
    if (!metrics.totalBudget) return 0;
    return Math.round((metrics.totalSpent / metrics.totalBudget) * 100);
  }, [metrics]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  }, []);

  const firstName = sessionUser?.fullName?.split(" ")[0] || "User";

  // Map project status to display
  const getStatusBadge = (status) => {
    const s = (status || "").toUpperCase();
    if (s === "COMPLETED") return { label: "Completed", variant: "default" };
    if (s === "IN_PROGRESS") return { label: "On Track", variant: "success" };
    if (s === "OPEN") return { label: "Open", variant: "warning" };
    return { label: status || "Pending", variant: "secondary" };
  };

  // Send proposal to freelancer
  const sendProposalToFreelancer = async (freelancer) => {
    if (!savedProposal || !freelancer) return;
    
    try {
      setIsSendingProposal(true);
      
      // Create project from proposal
      const projectRes = await authFetch("/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: savedProposal.projectTitle || "New Project",
          description: savedProposal.summary || savedProposal.content || "",
          budget: parseInt(savedProposal.budget?.replace(/[₹,]/g, "")) || 0,
          timeline: savedProposal.timeline || "1 month",
          status: "OPEN"
        }),
      });
      
      if (!projectRes.ok) throw new Error("Failed to create project");
      const projectData = await projectRes.json();
      const project = projectData.data.project;
      
      // Send proposal to freelancer
      const proposalRes = await authFetch("/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          freelancerId: freelancer.id,
          amount: parseInt(savedProposal.budget?.replace(/[₹,]/g, "")) || 0,
          coverLetter: savedProposal.summary || savedProposal.content || "",
        }),
      });
      
      if (!proposalRes.ok) throw new Error("Failed to send proposal");
      
      // DO NOT clear saved proposal immediately - wait for freelancer acceptance
      // localStorage.removeItem("markify:savedProposal");
      // setSavedProposal(null);
      
      setShowSendConfirm(false);
      setSelectedFreelancer(null);
      
      toast.success(`Proposal sent to ${freelancer.fullName || freelancer.name}!`);
      navigate(`/client/project/${project.id}`);
      
    } catch (error) {
      console.error("Failed to send proposal:", error);
      toast.error("Failed to send proposal. Please try again.");
    } finally {
      setIsSendingProposal(false);
    }
  };

  const handleSendClick = (freelancer) => {
    setSelectedFreelancer(freelancer);
    setShowSendConfirm(true);
  };

  const confirmSend = () => {
    if (selectedFreelancer) {
      sendProposalToFreelancer(selectedFreelancer);
    }
  };

  const handlePaymentClick = (project) => {
    setProjectToPay(project);
    setShowPaymentConfirm(true);
  };

  const processPayment = async () => {
    if (!projectToPay) return;
    setIsProcessingPayment(true);
    try {
       const res = await authFetch(`/projects/${projectToPay.id}/pay-upfront`, {
          method: "POST"
       });
       if (!res.ok) {
         const errorData = await res.json();
         throw new Error(errorData.message || "Payment failed");
       }
       
       toast.success("Payment processed successfully! Project is now active.");
       setShowPaymentConfirm(false);
       setProjectToPay(null);
       // Refresh projects to update status
       loadProjects(); 
    } catch (error) {
       console.error("Payment error:", error);
       toast.error(error.message || "Failed to process payment");
    } finally {
       setIsProcessingPayment(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col relative h-full overflow-hidden bg-background">
      {/* Grid pattern background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-30 dark:opacity-10" 
        style={{
          backgroundImage: "radial-gradient(hsl(var(--border)) 1px, transparent 1px)",
          backgroundSize: "24px 24px"
        }} 
      />

      {/* Top Bar */}
      <div className="sticky top-0 z-40 px-6 py-3 bg-background/85 backdrop-blur-xl border-b border-border/50">
        <ClientTopBar label="Dashboard" />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-10 z-10 relative">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column - Main Content */}
            <div className="flex-1 min-w-0 flex flex-col gap-8">
              {/* Welcome Section */}
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-2">
                    {greeting}, {firstName}
                  </h1>
                  <p className="text-muted-foreground font-medium">
                    Here's what's happening in your Executive Control Room today.
                  </p>
                </div>
                <div className="hidden sm:flex gap-2">
                  <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-600 mr-1.5" />
                    System Operational
                  </Badge>
                </div>
              </div>

              {/* Stats Cards */}
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatsCard
                  title="Total Spent"
                  value={`₹${metrics.totalSpent.toLocaleString()}`}
                  trend="Invested so far"
                  trendType="neutral"
                  accentColor="primary"
                />
                <StatsCard
                  title="Active Projects"
                  value={String(metrics.activeProjects)}
                  trend="In progress & Open"
                  trendType="up"
                  accentColor="blue"
                />
                <StatsCard
                  title="Total Budget"
                  value={`₹${metrics.totalBudget.toLocaleString()}`}
                  trend="Allocated budget"
                  trendType="neutral"
                  accentColor="green" // Changed to green for budget
                />
              </div>

              {/* Saved Proposal Section - Show when proposal exists but no projects */}
              {savedProposal && (
                <div className="space-y-6">
                  {/* Proposal Preview */}
                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                          <Send className="w-5 h-5 text-primary" /> 
                          Your Saved Proposal
                        </CardTitle>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-muted-foreground hover:text-primary"
                            onClick={() => setShowViewProposal(true)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-muted-foreground hover:text-primary"
                            onClick={() => {
                              setEditForm({
                                title: savedProposal.projectTitle || "",
                                summary: savedProposal.summary || savedProposal.content || "",
                                budget: savedProposal.budget || "",
                                timeline: savedProposal.timeline || ""
                              });
                              setShowEditProposal(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => {
                              localStorage.removeItem("markify:savedProposal");
                              setSavedProposal(null);
                              toast.success("Proposal deleted");
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <h4 className="font-semibold">{savedProposal.projectTitle || "New Project"}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {savedProposal.summary || savedProposal.content || "No description"}
                        </p>
                        <div className="flex flex-wrap gap-2 text-sm">
                          <Badge variant="secondary">Budget: {savedProposal.budget || "Not set"}</Badge>
                          <Badge variant="secondary">Timeline: {savedProposal.timeline || "Not set"}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold">Choose a Freelancer to Send Your Proposal</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {suggestedFreelancers.length > 0 ? (
                        suggestedFreelancers.map((freelancer) => (
                          <Card 
                            key={freelancer.id} 
                            className="group hover:shadow-lg hover:border-primary/20 transition-all cursor-pointer relative"
                            onClick={() => {
                              setViewFreelancer(freelancer);
                              setShowFreelancerDetails(true);
                            }}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <Avatar className="w-12 h-12">
                                  <AvatarImage src={freelancer.avatar} alt={freelancer.fullName || freelancer.name} />
                                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                    {(freelancer.fullName || freelancer.name)?.charAt(0) || "F"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold truncate">{freelancer.fullName || freelancer.name}</h4>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {Array.isArray(freelancer.skills) && freelancer.skills.length > 0 
                                      ? freelancer.skills.slice(0, 2).join(", ") 
                                      : "Freelancer"}
                                  </p>
                                </div>
                              </div>
                              <Button 
                                className="w-full gap-2 relative z-10" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSendClick(freelancer);
                                }}
                                disabled={isSendingProposal}
                              >
                                {isSendingProposal && selectedFreelancer?.id === freelancer.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Send className="w-4 h-4" />
                                )}
                                Send Proposal
                              </Button>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <Card className="col-span-full">
                          <CardContent className="p-8 text-center text-muted-foreground">
                            No freelancers available. Check back later!
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Confirm Send Dialog */}
              <Dialog open={showSendConfirm} onOpenChange={setShowSendConfirm}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirm Send Proposal</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to send your proposal to {selectedFreelancer?.fullName || selectedFreelancer?.name}?
                    </DialogDescription>
                  </DialogHeader>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="font-semibold">{savedProposal?.projectTitle || "New Project"}</p>
                    <p className="text-sm text-muted-foreground">Budget: {savedProposal?.budget || "Not set"}</p>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowSendConfirm(false)}>Cancel</Button>
                    <Button onClick={confirmSend} disabled={isSendingProposal}>
                      {isSendingProposal ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                      Send Proposal
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Payment Confirmation Dialog */}
              <Dialog open={showPaymentConfirm} onOpenChange={setShowPaymentConfirm}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirm Upfront Payment</DialogTitle>
                    <DialogDescription>
                      {(() => {
                        const budget = parseInt(projectToPay?.budget) || 0;
                        let percentage = "50%";
                        if (budget > 200000) percentage = "25%";
                        else if (budget >= 50000) percentage = "33%";
                        return `This project requires a ${percentage} upfront payment to begin. This amount will be held in escrow.`;
                      })()}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Project:</span>
                      <span className="font-medium">{projectToPay?.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Budget:</span>
                      <span>₹{(projectToPay?.budget || 0).toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold text-lg">
                      {(() => {
                        const budget = parseInt(projectToPay?.budget) || 0;
                        let label = "Pay Now (50%)";
                        let divisor = 2;
                        
                        if (budget > 200000) {
                          label = "Pay Now (25%)";
                          divisor = 4;
                        } else if (budget >= 50000) {
                          label = "Pay Now (33%)";
                          divisor = 3;
                        }

                        return (
                          <>
                            <span>{label}:</span>
                            <span className="text-primary">₹{Math.round(budget / divisor).toLocaleString()}</span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowPaymentConfirm(false)}>Cancel</Button>
                    <Button onClick={processPayment} disabled={isProcessingPayment} className="gap-2">
                       {isProcessingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                       Confirm Payment
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* View Proposal Dialog */}
              <Dialog open={showViewProposal} onOpenChange={setShowViewProposal}>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      {savedProposal?.projectTitle || "Proposal Details"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-3">
                      <Badge variant="outline">Budget: {savedProposal?.budget || "Not set"}</Badge>
                      <Badge variant="outline">Timeline: {savedProposal?.timeline || "Not set"}</Badge>
                    </div>
                    <div className="p-4 bg-muted rounded-lg max-h-[50vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      <h4 className="font-semibold mb-2 sticky top-0 bg-muted pb-2">Project Summary</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {savedProposal?.summary || savedProposal?.content || "No description available"}
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowViewProposal(false)}>Close</Button>
                    <Button onClick={() => { setShowViewProposal(false); setEditForm({
                      title: savedProposal?.projectTitle || "",
                      summary: savedProposal?.summary || savedProposal?.content || "",
                      budget: savedProposal?.budget || "",
                      timeline: savedProposal?.timeline || ""
                    }); setShowEditProposal(true); }}>
                      <Edit2 className="w-4 h-4 mr-2" /> Edit
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Edit Proposal Dialog */}
              <Dialog open={showEditProposal} onOpenChange={setShowEditProposal}>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Edit2 className="w-5 h-5" />
                      Edit Proposal
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-1">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Project Title</label>
                      <Input 
                        value={editForm.title}
                        onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Project title"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Summary / Description</label>
                      <Textarea 
                        value={editForm.summary}
                        onChange={(e) => setEditForm(prev => ({ ...prev, summary: e.target.value }))}
                        placeholder="Project description"
                        rows={6}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Budget</label>
                        <Input 
                          value={editForm.budget}
                          onChange={(e) => setEditForm(prev => ({ ...prev, budget: e.target.value }))}
                          placeholder="e.g. ₹30,000"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Timeline</label>
                        <Input 
                          value={editForm.timeline}
                          onChange={(e) => setEditForm(prev => ({ ...prev, timeline: e.target.value }))}
                          placeholder="e.g. 2 weeks"
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowEditProposal(false)}>Cancel</Button>
                    <Button onClick={() => {
                      const updated = {
                        ...savedProposal,
                        projectTitle: editForm.title,
                        summary: editForm.summary,
                        content: editForm.summary,
                        budget: editForm.budget,
                        timeline: editForm.timeline
                      };
                      localStorage.setItem("markify:savedProposal", JSON.stringify(updated));
                      setSavedProposal(updated);
                      setShowEditProposal(false);
                      toast.success("Proposal updated!");
                    }}>
                      <CheckCircle className="w-4 h-4 mr-2" /> Save Changes
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Freelancer Details Dialog */}
              <Dialog open={showFreelancerDetails} onOpenChange={setShowFreelancerDetails}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <DialogHeader>
                    <div className="flex items-center gap-4">
                      <Avatar className="w-16 h-16 border-2 border-primary/20">
                        <AvatarImage src={viewFreelancer?.avatar} alt={viewFreelancer?.fullName || viewFreelancer?.name} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                          {(viewFreelancer?.fullName || viewFreelancer?.name)?.charAt(0) || "F"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <DialogTitle className="text-2xl font-bold">
                          {viewFreelancer?.fullName || viewFreelancer?.name}
                        </DialogTitle>
                        <p className="text-muted-foreground">{viewFreelancer?.headline || "Freelancer"}</p>
                      </div>
                    </div>
                  </DialogHeader>
                  
                  <div className="space-y-6 py-4">
                    {/* Location Info */}
                    {viewFreelancer?.location && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Flag className="w-4 h-4" /> {viewFreelancer.location}
                      </div>
                    )}

                    {/* About / Bio */}
                    {viewFreelancer?.about && (
                      <div>
                        <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                          <User className="w-4 h-4 text-primary" /> About
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{viewFreelancer.about}</p>
                      </div>
                    )}

                    {/* Skills */}
                    <div>
                      <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-primary" /> Skills
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(viewFreelancer?.skills) && viewFreelancer.skills.length > 0 ? (
                          viewFreelancer.skills.map((skill, idx) => (
                            <Badge key={idx} variant="secondary" className="px-3 py-1">
                              {skill}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No skills listed</p>
                        )}
                      </div>
                    </div>

                    {/* Services */}
                    {Array.isArray(viewFreelancer?.services) && viewFreelancer.services.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-primary" /> Services
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {viewFreelancer.services.map((service, idx) => (
                            <Badge key={idx} variant="outline" className="px-3 py-1">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Work Experience */}
                    {Array.isArray(viewFreelancer?.workExperience) && viewFreelancer.workExperience.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-primary" /> Work Experience
                        </h4>
                        <div className="space-y-4">
                          {viewFreelancer.workExperience.map((exp, idx) => (
                            <div key={idx} className="border-l-2 border-primary/20 pl-4 py-1">
                              <h5 className="font-semibold">{exp.title}</h5>
                              <p className="text-xs text-muted-foreground mb-1">{exp.period}</p>
                              <p className="text-sm text-muted-foreground">{exp.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Portfolio Projects */}
                    {Array.isArray(viewFreelancer?.portfolioProjects) && viewFreelancer.portfolioProjects.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                          <ExternalLink className="w-4 h-4 text-primary" /> Portfolio Projects
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {viewFreelancer.portfolioProjects.map((project, idx) => (
                            <a 
                              key={idx} 
                              href={project.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="group block border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-all"
                            >
                              <div className="aspect-video bg-muted relative">
                                {project.image ? (
                                  <img src={project.image} alt={project.title} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                                    <ExternalLink className="w-8 h-8" />
                                  </div>
                                )}
                              </div>
                              <div className="p-3">
                                <h5 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                                  {project.title || project.link}
                                </h5>
                                <p className="text-xs text-muted-foreground truncate">{project.link}</p>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              {/* Active Projects Table - Only show when projects exist */}
              {projects.length > 0 && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">Active Projects</h3>
                  <Button variant="link" className="text-primary p-0 h-auto font-semibold" onClick={() => navigate("/client/projects")}>
                    View All <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>

                <Card className="overflow-hidden border-border/60">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-xs font-semibold uppercase tracking-wider">Project Name</TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider">Status</TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider">Lead</TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider">Budget</TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        [1, 2, 3].map((i) => (
                          <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-8 ml-auto" /></TableCell>
                          </TableRow>
                        ))
                      ) : (
                        projects
                          .filter(p => p.status !== "DRAFT" && p.status !== "COMPLETED")
                          .slice(0, 5)
                          .map((project) => {
                          const statusInfo = getStatusBadge(project.status);
                          const acceptedProposal = (project.proposals || []).find(
                            (p) => (p.status || "").toUpperCase() === "ACCEPTED"
                          );
                          return (
                            <TableRow key={project.id} className="group hover:bg-muted/50 transition-colors">
                              <TableCell>
                                <div className="font-bold">{project.title}</div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(project.createdAt).toLocaleDateString()}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={statusInfo.variant === "success" ? "default" : "secondary"}
                                  className={
                                    statusInfo.variant === "success" 
                                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800" 
                                      : statusInfo.variant === "warning"
                                      ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800"
                                      : ""
                                  }
                                >
                                  {statusInfo.label}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {acceptedProposal?.freelancer ? (
                                  <div className="flex items-center gap-2">
                                    <Avatar className="w-6 h-6">
                                      <AvatarFallback className="text-xs">
                                        {acceptedProposal.freelancer.fullName?.charAt(0) || "F"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm">{acceptedProposal.freelancer.fullName?.split(" ")[0] || "Freelancer"}</span>
                                  </div>
                                ) : (
                                  (() => {
                                    const pendingProposal = (project.proposals || [])
                                      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                                      .find(p => (p.status || "").toUpperCase() === "PENDING");
                                      
                                    if (pendingProposal?.freelancer) {
                                      return (
                                        <div className="flex items-center gap-2 opacity-75">
                                          <Avatar className="w-6 h-6 grayscale">
                                            <AvatarFallback className="text-xs">
                                              {pendingProposal.freelancer.fullName?.charAt(0) || "F"}
                                            </AvatarFallback>
                                          </Avatar>
                                          <span className="text-sm italic">Invited: {pendingProposal.freelancer.fullName?.split(" ")[0]}</span>
                                        </div>
                                      );
                                    }
                                    return <span className="text-sm text-muted-foreground">Not assigned</span>;
                                  })()
                                )}
                              </TableCell>
                              <TableCell>
                                <span className="text-sm font-medium">
                                  ₹{(project.budget || 0).toLocaleString()}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                {project.status === "AWAITING_PAYMENT" ? (
                                  <Button 
                                    size="sm" 
                                    className="bg-green-600 hover:bg-green-700 text-white h-8 w-full sm:w-auto text-xs sm:text-sm font-medium shadow-sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePaymentClick(project);
                                    }}
                                  >
                                    {(() => {
                                      const budget = parseInt(project.budget) || 0;
                                      if (budget > 200000) return "Pay 25%";
                                      if (budget >= 50000) return "Pay 33%";
                                      return "Pay 50%";
                                    })()}
                                  </Button>
                                ) : (
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-muted-foreground hover:text-primary"
                                    onClick={() => navigate(`/client/project/${project.id}`)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </Card>
              </div>
              )}

              {/* Activity Timeline - Only show when projects exist */}
              {projects.length > 0 && (
              <Card className="border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-bold">Activity Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative pl-4 border-l-2 border-dashed border-border space-y-6">
                    {projects.slice(0, 2).map((project, idx) => (
                      <div key={project.id} className="relative">
                        <div className={`absolute -left-[23px] top-1 h-3.5 w-3.5 rounded-full border-2 border-background ${
                          idx === 0 ? "bg-primary" : "bg-muted-foreground/50"
                        }`} />
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                          <span className="text-xs font-bold text-muted-foreground w-16">
                            {new Date(project.updatedAt || project.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <p className="text-sm">
                            Project <span className="text-primary font-medium">{project.title}</span> was updated.
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="lg:w-[360px] flex-shrink-0 flex flex-col gap-6">
              {/* Action Center */}
              <Card className="bg-zinc-100 dark:bg-zinc-900/50 text-foreground border-border/50 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Zap className="w-5 h-5" /> Action Center
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                    onClick={() => navigate("/service")}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Make New Proposal
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full bg-background hover:bg-background/80 text-foreground border-border/10 shadow-sm"
                    onClick={() => navigate("/client/proposal")}
                  >
                    View Proposal
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full bg-background hover:bg-background/80 text-foreground border-border/10 shadow-sm"
                    onClick={() => navigate("/client/project")}
                  >
                    View Projects
                  </Button>
                </CardContent>
              </Card>

              {/* Talent Snapshot */}
              <Card className="border-border/60">
                <CardHeader className="pb-2 flex-row items-center justify-between">
                  <CardTitle className="text-lg font-bold">Talent Snapshot</CardTitle>
                  <Button 
                    variant="link" 
                    className="text-primary p-0 h-auto text-sm font-semibold"
                    onClick={() => navigate("/client/messages")}
                  >
                    View All
                  </Button>
                </CardHeader>
                <CardContent>
                  <ul className="flex flex-col gap-4">
                    {freelancers.length > 0 ? (
                      freelancers.map((f, idx) => (
                        <TalentItem
                          key={f.id || idx}
                          name={f.fullName || f.name || "Freelancer"}
                          role={f.projectTitle || (Array.isArray(f.skills) && f.skills.length > 0 ? f.skills[0] : "Freelancer")}
                          avatar={f.avatar}
                          status={idx === 0 ? "online" : idx === 1 ? "away" : "offline"}
                          onClick={() => navigate(`/client/messages?projectId=${f.projectId}`)}
                        />
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground italic py-4 text-center">No active chats yet</p>
                    )}
                  </ul>
                </CardContent>
              </Card>

              {/* Budget Utilization */}
              <BudgetChart
                percentage={budgetPercentage}
                remaining={metrics.totalBudget - metrics.totalSpent}
                total={metrics.totalBudget}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Suspension Alert */}
      <SuspensionAlert
        open={showSuspensionAlert}
        onOpenChange={setShowSuspensionAlert}
        suspendedAt={sessionUser?.suspendedAt}
      />
    </div>
  );
};

// ==================== Wrapper with Sidebar ====================
const ClientDashboard = () => {
  return (
    <RoleAwareSidebar>
      <ClientDashboardContent />
    </RoleAwareSidebar>
  );
};

export default ClientDashboard;
