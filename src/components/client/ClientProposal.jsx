"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Trash2, ExternalLink } from "lucide-react";
import { RoleAwareSidebar } from "@/components/dashboard/RoleAwareSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientTopBar } from "@/components/client/ClientTopBar";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

// Skeleton for proposal cards while loading
const ProposalCardSkeleton = () => (
  <Card className="border-border/50 bg-card/60 backdrop-blur">
    <CardContent className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const StatusBadge = ({ status = "pending" }) => {
  const variants = {
    pending: "bg-amber-500/10 text-amber-500 border-amber-200/40",
    sent: "bg-blue-500/10 text-blue-500 border-blue-200/40",
    accepted: "bg-emerald-500/10 text-emerald-500 border-emerald-200/40",
    rejected: "bg-red-500/10 text-red-500 border-red-200/40",
  };

  const labels = {
    pending: "Pending",
    sent: "Sent",
    accepted: "Accepted",
    rejected: "Rejected",
  };

  return (
    <Badge className={`${variants[status] || variants.pending} border`}>
      {labels[status] || labels.pending}
    </Badge>
  );
};

const ProposalCard = ({ proposal, onDelete, onOpen }) => {
  return (
    <Card className="group relative overflow-hidden border-border/50 bg-card/60 backdrop-blur hover:border-border transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          {/* Left Section */}
          <div className="flex items-start gap-4 flex-1 min-w-0">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <img
                src={proposal.avatar || "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=64&q=80"}
                alt={proposal.recipientName}
                className="h-12 w-12 rounded-lg object-cover ring-1 ring-border/50"
              />
              <div
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-card ${
                  proposal.status === "accepted"
                    ? "bg-emerald-500"
                    : "bg-amber-500"
                }`}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h3 className="font-semibold text-foreground text-base truncate">
                  {proposal.title}
                </h3>
                <StatusBadge status={proposal.status} />
              </div>

              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-muted-foreground text-[11px] uppercase tracking-[0.2em]">
                    Freelancer
                  </p>
                  <p className="text-foreground font-medium whitespace-nowrap">
                    {proposal.recipientName}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-muted-foreground text-[11px] uppercase tracking-[0.2em]">
                    Submitted
                  </p>
                  <p className="text-foreground font-medium whitespace-nowrap">
                    {proposal.submittedDate}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => onOpen?.(proposal)}
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              Open
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => onDelete?.(proposal.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const normalizeProposalStatus = (status = "") => {
  switch (status.toUpperCase()) {
    case "ACCEPTED":
      return "accepted";
    case "REJECTED":
      return "rejected";
    case "PENDING":
      return "pending";
    default:
      return "sent";
  }
};

const mapApiProposal = (proposal = {}) => {
  const freelancerName =
    proposal.freelancer?.fullName ||
    proposal.freelancer?.name ||
    proposal.freelancer?.email ||
    proposal.freelancerName ||
    "Freelancer";
  const freelancerAvatar =
    proposal.freelancer?.avatar ||
    proposal.avatar ||
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=256&q=80";

  return {
    id: proposal.id,
    title: proposal.project?.title || proposal.title || "Proposal",
    category: proposal.project?.description
      ? "Project"
      : proposal.category || "General",
    status: normalizeProposalStatus(proposal.status || "PENDING"),
    recipientName: freelancerName,
    recipientId: proposal.freelancer?.id || "FREELANCER",
    projectId: proposal.projectId || proposal.project?.id || null,
    freelancerId: proposal.freelancer?.id || proposal.freelancerId || null,
    submittedDate: proposal.createdAt
      ? new Date(proposal.createdAt).toLocaleDateString()
      : new Date().toLocaleDateString(),
    proposalId: proposal.id
      ? `PRP-${proposal.id.slice(0, 6).toUpperCase()}`
      : `PRP-${Math.floor(Math.random() * 9000 + 1000)}`,
    avatar: freelancerAvatar,
    content:
      proposal.content ||
      proposal.description ||
      proposal.summary ||
      proposal.project?.description ||
      "",
  };
};

const ClientProposalContent = () => {
  const { isAuthenticated, authFetch } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [activeProposal, setActiveProposal] = useState(null);
  const [isViewing, setIsViewing] = useState(false);
  const [isLoadingProposal, setIsLoadingProposal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProposals = useCallback(async () => {
    try {
      const response = await authFetch("/proposals?as=owner");
      const payload = await response.json().catch(() => null);
      const remote = Array.isArray(payload?.data) ? payload.data : [];
      const remoteNormalized = remote.map(mapApiProposal);
      const uniqueById = remoteNormalized.reduce(
        (acc, proposal) => {
          const key =
            proposal.id ||
            `${proposal.projectId || "project"}-${
              proposal.freelancerId || proposal.recipientId
            }`;
          if (!key || acc.seen.has(key)) return acc;
          acc.seen.add(key);
          acc.list.push(proposal);
          return acc;
        },
        { seen: new Set(), list: [] }
      ).list;
      setProposals(uniqueById);
    } catch (error) {
      console.error("Failed to load proposals from API:", error);
    } finally {
      setIsLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    let intervalId;

    const safeFetch = async () => {
      if (!isMounted) return;
      await fetchProposals();
    };

    safeFetch();
    intervalId = window.setInterval(safeFetch, 6000);

    return () => {
      isMounted = false;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [fetchProposals, isAuthenticated]);

  const handleDelete = useCallback(
    async (id) => {
      try {
        const response = await authFetch(`/proposals/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          const message = payload?.message || "Unable to delete proposal.";
          throw new Error(message);
        }
        setProposals((prev) => prev.filter((proposal) => proposal.id !== id));
        toast.success("Proposal deleted.");
      } catch (error) {
        console.error("Failed to delete proposal:", error);
        toast.error(error?.message || "Unable to delete proposal right now.");
      }
    },
    [authFetch]
  );

  const grouped = useMemo(() => {
    return proposals.reduce(
      (acc, proposal) => {
        const normalized = ["accepted", "rejected"].includes(proposal.status)
          ? proposal.status
          : "sent";
        acc[normalized] = [...(acc[normalized] || []), proposal];
        return acc;
      },
      { sent: [], accepted: [], rejected: [] }
    );
  }, [proposals]);

  const sentList = grouped.sent || [];

  const handleOpenProposal = useCallback(
    async (proposal) => {
      setIsViewing(true);
      setActiveProposal(proposal);

      if (proposal?.content) return;
      if (!proposal?.id) return;

      try {
        setIsLoadingProposal(true);
        const response = await authFetch(`/proposals/${proposal.id}`);
        const payload = await response.json().catch(() => null);
        const mapped = payload?.data ? mapApiProposal(payload.data) : null;
        if (mapped) {
          setActiveProposal(mapped);
          // also hydrate list entry
          setProposals((prev) =>
            prev.map((item) => (item.id === mapped.id ? { ...item, content: mapped.content } : item))
          );
        }
      } catch (error) {
        console.error("Failed to load proposal detail", error);
        toast.error("Unable to load proposal details.");
      } finally {
        setIsLoadingProposal(false);
      }
    },
    [authFetch]
  );

  return (
    <div className="space-y-10 p-6 w-full">
      <ClientTopBar />

      <div className="space-y-12 w-full">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-1">Sent</h2>
              <p className="text-sm text-muted-foreground">
                Projects awaiting freelancer response
              </p>
            </div>
            <Badge
              variant="secondary"
              className="text-lg font-semibold px-3 py-1 rounded-full"
            >
              {isLoading ? '-' : sentList.length}
            </Badge>
          </div>
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => <ProposalCardSkeleton key={i} />)}
            </div>
          ) : sentList.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sentList.map((proposal) => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  onDelete={handleDelete}
                  onOpen={handleOpenProposal}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border/60 bg-card/40 px-4 py-6 text-sm text-muted-foreground">
              No sent proposals yet.
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-1">
                Accepted
              </h2>
              <p className="text-sm text-muted-foreground">
                Projects successfully accepted
              </p>
            </div>
            <Badge
              variant="secondary"
              className="text-lg font-semibold px-3 py-1 rounded-full"
            >
              {isLoading ? '-' : grouped.accepted.length}
            </Badge>
          </div>
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => <ProposalCardSkeleton key={i} />)}
            </div>
          ) : grouped.accepted.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {grouped.accepted.map((proposal) => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  onDelete={handleDelete}
                  onOpen={handleOpenProposal}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border/60 bg-card/40 px-4 py-6 text-sm text-muted-foreground">
              No accepted proposals yet.
            </div>
          )}
        </section>
      </div>

        <Dialog
          open={isViewing}
          onOpenChange={(open) => {
            setIsViewing(open);
            if (!open) setActiveProposal(null);
          }}
        >
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] p-0 overflow-hidden">
            <div className="p-5 border-b border-border/60">
              <DialogTitle className="text-xl font-semibold">
                {activeProposal?.title || "Proposal"}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {activeProposal?.recipientName
                  ? `Submitted to ${activeProposal.recipientName}`
                  : "Proposal details"}
              </DialogDescription>
            </div>
            <div className="p-5">
              <div className="max-h-[70vh] overflow-auto pr-2">
                {isLoadingProposal ? (
                  <p className="text-sm text-muted-foreground">Loading proposal...</p>
                ) : (
                  <div className="rounded-lg border border-border/60 bg-background p-4 text-sm leading-6 text-foreground whitespace-pre-wrap">
                    {activeProposal?.content?.trim() || "No content available for this proposal."}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
    </div>
  );
};

const ClientProposal = () => {
  return (
    <RoleAwareSidebar>
      <ClientProposalContent />
    </RoleAwareSidebar>
  );
};

export default ClientProposal;
