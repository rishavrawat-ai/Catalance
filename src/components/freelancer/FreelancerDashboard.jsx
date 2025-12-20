import React, { useEffect, useMemo, useState } from "react";
import { Briefcase, Clock, Sparkles, Banknote } from "lucide-react";
import { RoleAwareSidebar } from "@/components/dashboard/RoleAwareSidebar";
import { getSession } from "@/lib/auth-storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FreelancerTopBar } from "@/components/freelancer/FreelancerTopBar";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

// No static template data - all metrics loaded from API

export const DashboardContent = ({ roleOverride }) => {
  const [sessionUser, setSessionUser] = useState(null);
  const { authFetch } = useAuth();
  const [metrics, setMetrics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const session = getSession();
    setSessionUser(session?.user ?? null);
  }, []);

  const effectiveRole = roleOverride ?? sessionUser?.role ?? "FREELANCER";

  const roleLabel = useMemo(() => {
    const baseRole = effectiveRole;
    const normalized = baseRole.toLowerCase();
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }, [effectiveRole]);

  const dashboardLabel = sessionUser?.fullName?.trim()
    ? `${sessionUser.fullName.trim()}'s dashboard`
    : `${roleLabel} dashboard`;

  useEffect(() => {
    const loadMetrics = async () => {
      if (!authFetch) return;
      setIsLoading(true);
      try {
        const response = await authFetch("/proposals?as=freelancer");
        const payload = await response.json().catch(() => null);
        const list = Array.isArray(payload?.data) ? payload.data : [];

        const pending = list.filter(
          (p) => (p.status || "").toUpperCase() === "PENDING"
        );
        const accepted = list.filter(
          (p) => (p.status || "").toUpperCase() === "ACCEPTED"
        );
        const activeProjects = accepted.length;
        const proposalsReceived = pending.length;
        // Calculate earnings after 30% platform fee (freelancer receives 70%)
        const grossEarnings = accepted.reduce(
          (acc, p) => acc + (Number(p.amount) || 0),
          0
        );
        const earnings = Math.round(grossEarnings * 0.7);

        setMetrics([
          {
            label: "Active Projects",
            value: String(activeProjects),
            trend: `${pending.length} pending decisions`,
            icon: Briefcase,
          },
          {
            label: "Proposals Received",
            value: String(proposalsReceived),
            trend: `${pending.length} awaiting reply`,
            icon: Sparkles,
          },
          {
            label: "Accepted Proposals",
            value: String(accepted.length),
            trend: accepted.length ? "Keep momentum going" : "No wins yet",
            icon: Clock,
          },
          {
            label: "Total Earnings",
            value: earnings ? `₹${earnings.toLocaleString()}` : "₹0",
            trend: accepted.length ? "Based on accepted proposals" : "Close a deal to start earning",
            icon: Banknote,
          },
        ]);
      } catch (error) {
        console.error("Failed to load freelancer metrics", error);
        // Set empty metrics on error - no fallback to static data
        setMetrics([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadMetrics();
  }, [authFetch]);

  // Skeleton for metrics while loading
  const MetricSkeleton = () => (
    <Card className="border-dashed">
      <CardHeader className="flex-row items-center justify-between">
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-4 w-24" />
      </CardContent>
    </Card>
  );

  return (
    <>
      <div className="relative flex flex-col gap-6 p-6">
        <FreelancerTopBar label={dashboardLabel} />

        <section className="grid gap-4 md:grid-cols-4">
          {isLoading ? (
            [1, 2, 3, 4].map((i) => <MetricSkeleton key={i} />)
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
                No data available. Start working on projects to see your metrics.
              </CardContent>
            </Card>
          )}
        </section>        
      </div>
    </>
  );
};

const FreelancerDashboard = () => {
  return (
    <RoleAwareSidebar>
      <DashboardContent />
    </RoleAwareSidebar>
  );
};

export const ClientDashboard = () => {
  return (
    <RoleAwareSidebar>
      <DashboardContent roleOverride="CLIENT" />
    </RoleAwareSidebar>
  );
};

export default FreelancerDashboard;
