"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronRight,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  Check,
  X,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { useTheme } from "@/components/theme-provider";
import { getSession } from "@/lib/auth-storage";
import { useNotifications } from "@/context/NotificationContext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Notepad } from "@/components/ui/notepad";

const getInitials = (fullName) => {
  if (!fullName) return "FL";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
};

const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

export const FreelancerTopBar = ({ label }) => {
  const { state, toggleSidebar } = useSidebar();
  const { theme, setTheme } = useTheme();
  const [sessionUser, setSessionUser] = useState(null);
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  useEffect(() => {
    const session = getSession();
    setSessionUser(session?.user ?? null);
  }, []);

  const computedLabel = useMemo(() => {
    if (label) return label;
    const fullName = sessionUser?.fullName?.trim();
    if (fullName) return `${fullName}'s dashboard`;
    const baseRole = sessionUser?.role ?? "FREELANCER";
    const normalized = baseRole.toLowerCase();
    return `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)} dashboard`;
  }, [label, sessionUser]);

  const sidebarClosed = state === "collapsed";
  const SidebarToggleIcon = sidebarClosed ? PanelLeftOpen : PanelLeftClose;
  const isDarkMode = theme === "dark";
  const ThemeIcon = isDarkMode ? Sun : Moon;

  const initials = getInitials(sessionUser?.fullName);

  const handleProfileNavigate = () => navigate("/freelancer/profile");
  const handleChatNavigate = () => navigate("/freelancer/messages");

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    // Navigate based on notification type
    if (notification.type === "chat" && notification.data?.conversationId) {
      navigate("/freelancer/messages");
    } else if (notification.type === "proposal") {
      navigate("/freelancer/proposals");
    }
  };

  return (
    <div className="flex w-full items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full border border-border text-muted-foreground hover:text-foreground"
        onClick={toggleSidebar}>
        <SidebarToggleIcon className="size-4" />
        <span className="sr-only">
          {sidebarClosed ? "Open navigation" : "Close navigation"}
        </span>
      </Button>

      <button
        type="button"
        onClick={handleProfileNavigate}
        className="flex items-center gap-2 rounded-full px-2 py-1 text-left transition">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs font-semibold uppercase">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
          <span className="truncate">{computedLabel}</span>
          <ChevronRight className="size-3.5" />
        </div>
      </button>

      <div className="ml-auto flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-2 rounded-full border border-primary/60 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
          onClick={handleChatNavigate}
          aria-label="Quick chat">
          <MessageSquare className="size-4 text-primary" />
          <span className="text-xs font-semibold text-primary">Quick chat</span>
        </Button>

        {/* Notepad Feature */}
        <Notepad />

        {/* Notification Bell with Badge */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="relative rounded-full border border-border text-muted-foreground hover:text-foreground"
              aria-label="Notifications">
              <Bell className="size-4" />
              {unreadCount > 0 && (
                <Badge 
                  className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white border-0"
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h4 className="text-sm font-semibold">Notifications</h4>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs text-primary hover:text-primary/80"
                  onClick={markAllAsRead}>
                  Mark all as read
                </Button>
              )}
            </div>
            <ScrollArea className="h-72">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <Bell className="mb-2 h-8 w-8 opacity-40" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.slice(0, 20).map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-muted/50 ${
                        !notification.read ? "bg-primary/5" : ""
                      }`}>
                      <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                        !notification.read ? "bg-primary" : "bg-transparent"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground/70">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-full border border-border text-muted-foreground hover:text-foreground"
          onClick={() => setTheme(isDarkMode ? "light" : "dark")}
          aria-label="Toggle theme">
          <ThemeIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
};

export default FreelancerTopBar;
