"use client";

import * as React from "react";
import {
  BarChart,
  Briefcase,
  ClipboardList,
  CreditCard,
  FileText,
  LayoutDashboard,
  MessageSquare,
  User,
  Users,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { getSession } from "@/lib/auth-storage";

// This is sample data.
const fallbackUser = {
  name: "shadcn",
  email: "m@example.com",
  avatar: "/avatars/shadcn.jpg",
};

const brandPresets = {
  FREELANCER: {
    name: "Freelancer HQ",
    plan: "Creator workspace",
    logoText: "FR",
  },
  CLIENT: {
    name: "Client Portal",
    plan: "Client workspace",
    logoText: "CL",
  },
  PROJECT_MANAGER: {
    name: "Project Manager",
    plan: "Management Portal",
    logoText: "PM",
  },
  ADMIN: {
    name: "Admin Portal",
    plan: "System Administration",
    logoText: "AD",
  },
};

const navConfigs = {
  FREELANCER: [
    {
      title: "Dashboard",
      url: "/freelancer",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Proposals",
      url: "/freelancer/proposals",
      icon: FileText,
      items: [
        { title: "Received", url: "/freelancer/proposals/received" },
        { title: "Accepted", url: "/freelancer/proposals/accepted" },
      ],
    },
    {
      title: "Project",
      url: "/freelancer/project",
      icon: BarChart,
      isActive: true,
    },
    {
      title: "Messages",
      url: "/freelancer/messages",
      icon: MessageSquare,
      isActive: true,
    },
    {
      title: "Payments",
      url: "/freelancer/payments",
      icon: CreditCard,
      isActive: true,
    },
    {
      title: "Profile",
      url: "/freelancer/profile",
      icon: User,
      isActive: true,
    },
  ],
  CLIENT: [
    {
      title: "Dashboard",
      url: "/client",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Proposal",
      url: "/client/proposal",
      icon: FileText,
      items: [
        { title: "Drafts", url: "/client/proposal/drafts" },
        { title: "Sent", url: "/client/proposal" },
      ],
    },
    {
      title: "Project",
      url: "/client/project",
      icon: BarChart,
      isActive: true,
    },
    {
      title: "Messages",
      url: "/client/messages",
      icon: MessageSquare,
      isActive: true,
    },
    {
      title: "Profile",
      url: "/client/profile",
      icon: User,
      isActive: true,
    },
  ],
  PROJECT_MANAGER: [
    {
      title: "Overview",
      url: "/project-manager",
      icon: LayoutDashboard,
      isActive: true,
    },
  ],
  ADMIN: [
    {
      title: "Dashboard",
      url: "/admin",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Clients",
      url: "/admin/clients",
      icon: Users,
      isActive: true,
    },
    {
      title: "Freelancers",
      url: "/admin/freelancers",
      icon: User,
      isActive: true,
    },
    {
      title: "Project Managers",
      url: "/admin/project-managers",
      icon: ClipboardList,
      isActive: true,
    },
    {
      title: "Projects",
      url: "/admin/projects",
      icon: Briefcase,
      isActive: true,
    },
  ],
};

export function AppSidebar({ ...props }) {
  const [sessionUser, setSessionUser] = React.useState(null);

  React.useEffect(() => {
    const session = getSession();
    setSessionUser(session?.user ?? null);

    // Listen for storage changes (when user logs in/out in another component)
    const handleStorageChange = () => {
      const updatedSession = getSession();
      setSessionUser(updatedSession?.user ?? null);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const role = sessionUser?.role ?? "FREELANCER";
  const brand = brandPresets[role] ?? brandPresets.FREELANCER;
  const navItems = navConfigs[role] ?? navConfigs.FREELANCER;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher brand={brand} />
      </SidebarHeader>
      <SidebarContent className="!overflow-hidden">
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sessionUser ?? fallbackUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
