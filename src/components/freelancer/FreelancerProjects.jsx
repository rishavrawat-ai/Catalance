"use client";

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Clock, AlertCircle, Zap } from "lucide-react";
import { motion } from "framer-motion";

import { RoleAwareSidebar } from "@/components/dashboard/RoleAwareSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FreelancerTopBar } from "@/components/freelancer/FreelancerTopBar";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

// Skeleton for project cards while loading
const ProjectCardSkeleton = () => (
  <Card className="border border-border/60 bg-card/80">
    <CardContent className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-10" />
        </div>
        <Skeleton className="h-2 w-full" />
      </div>
      <Skeleton className="h-10 w-full" />
    </CardContent>
  </Card>
);

const statusConfig = {
  "in-progress": {
    label: "In Progress",
    icon: Clock,
    gradient: "from-primary to-yellow-400",
    badgeClass:
      "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    gradient: "from-emerald-500 to-teal-500",
    badgeClass:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  },
  pending: {
    label: "Pending",
    icon: AlertCircle,
    gradient: "from-orange-500 to-red-500",
    badgeClass:
      "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  },
};

const ProjectCard = ({ project }) => {
  const config = statusConfig[project.status];
  const StatusIcon = config.icon;
  const budgetValue =
    typeof project.budget === "number"
      ? project.budget
      : Number(project.budget) || 0;
  const deadlineValue =
    project.deadline && typeof project.deadline === "string"
      ? project.deadline
      : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      whileHover={{ y: -6 }}
      className="h-full"
    >
      <Card className="group relative h-full overflow-hidden border border-border/50 bg-card/80 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:shadow-[0_25px_80px_-50px_rgba(253,200,0,0.65)]">
        <div
          className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${config.gradient}`}
        />
        <CardContent className="relative z-10 flex h-full flex-col gap-6 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <p className="text-xs uppercase tracking-[0.35em] text-primary/70">
                Active project
              </p>
              <h3 className="line-clamp-2 text-xl font-semibold text-foreground transition-colors duration-300 group-hover:text-primary">
                {project.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                for{" "}
                <span className="font-medium text-foreground">
                  {project.client}
                </span>
              </p>
            </div>
            <motion.div whileHover={{ scale: 1.05 }}>
              <Badge
                variant="outline"
                className={`flex items-center gap-1.5 border px-3 py-1 text-xs font-medium ${config.badgeClass}`}
              >
                <StatusIcon className="h-3.5 w-3.5" />
                {config.label}
              </Badge>
            </motion.div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-b border-border/40 pb-5 text-sm">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground/80">
                Budget
              </p>
              <p className="text-2xl font-semibold text-foreground">
                {budgetValue ? `₹${Math.floor(budgetValue * 0.7).toLocaleString()}` : "TBD"}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground/80">
                Deadline
              </p>
              <p className="text-sm font-semibold text-foreground">
                {deadlineValue || "TBD"}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground/80">
                Progress
              </p>
              <span className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Zap className="h-4 w-4" />
                {project.progress}%
              </span>
            </div>
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${config.gradient}`}
                initial={{ width: 0 }}
                animate={{ width: `${project.progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>

          <Button
            asChild
            className={`mt-auto w-full gap-2 rounded-full bg-gradient-to-r ${config.gradient} py-5 font-semibold text-white transition-all duration-200 hover:shadow-lg hover:shadow-primary/30`}
          >
            <Link to={`/freelancer/project/${project.id}`}>
              View details
              <motion.div
                animate={{ x: [0, 6, 0] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              >
                <ArrowRight className="h-4 w-4" />
              </motion.div>
            </Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const FreelancerProjectsContent = () => {
  const { authFetch, isAuthenticated } = useAuth();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchProjects = async () => {
      setIsLoading(true);
      try {
        const response = await authFetch("/proposals");
        const payload = await response.json().catch(() => null);
        const proposals = Array.isArray(payload?.data) ? payload.data : [];
        const accepted = proposals.filter(
          (p) => (p.status || "").toUpperCase() === "ACCEPTED" && p.project
        );
        const uniqueProjects = new Map();
        accepted.forEach((p) => {
          const project = p.project;
          if (!project?.id) return;
          if (!uniqueProjects.has(project.id)) {
            // Calculate progress - use project.progress if available, default to 0
            const projectProgress = typeof project.progress === "number" 
              ? project.progress 
              : 0;
            
            // Determine status based on progress
            let projectStatus = "pending";
            if (projectProgress === 100) {
              projectStatus = "completed";
            } else if (projectProgress > 0) {
              projectStatus = "in-progress";
            }

            uniqueProjects.set(project.id, {
              id: project.id,
              title: project.title || "Project",
              client:
                project.owner?.fullName ||
                project.owner?.name ||
                project.owner?.email ||
                "Client",
              status: projectStatus,
              budget: project.budget || 0,
              deadline: project.deadline || "",
              progress: projectProgress,
            });
          }
        });
        setProjects(Array.from(uniqueProjects.values()));
      } catch (error) {
        console.error("Failed to load projects from API:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [authFetch, isAuthenticated]);

  return (
    <div className="space-y-6 p-6">
      <FreelancerTopBar />
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-[0.4em] text-primary/70">
          Freelancer projects
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          [1, 2, 3].map((i) => <ProjectCardSkeleton key={i} />)
        ) : projects.length ? (
          projects.map((project) => <ProjectCard key={project.id} project={project} />)
        ) : (
          <div className="col-span-full rounded-xl border border-dashed border-border/60 bg-card/40 px-4 py-6 text-sm text-muted-foreground">
            No projects yet.
          </div>
        )}
      </div>
    </div>
  );
};

const FreelancerProjects = () => {
  return (
    <RoleAwareSidebar>
      <FreelancerProjectsContent />
    </RoleAwareSidebar>
  );
};

export default FreelancerProjects;
