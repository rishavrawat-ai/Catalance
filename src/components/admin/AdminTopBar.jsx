"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Bell,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
} from "lucide-react";

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

export const AdminTopBar = ({ label, interactive = true }) => {
  const { state, toggleSidebar } = useSidebar();
  const { theme, setTheme } = useTheme();
  const [sessionUser, setSessionUser] = useState(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  useEffect(() => {
    const session = getSession();
    setSessionUser(session?.user ?? null);
  }, []);

  const computedLabel = useMemo(() => {
    if (label) return label;
    const fullName = sessionUser?.fullName?.trim();
    if (fullName) return `${fullName}'s dashboard`;
    return "Admin dashboard";
  }, [label, sessionUser]);

  const sidebarClosed = state === "collapsed";
  const SidebarToggleIcon = sidebarClosed ? PanelLeftOpen : PanelLeftClose;
  const isDarkMode = theme === "dark";
  const ThemeIcon = isDarkMode ? Sun : Moon;

  const toggleTheme = () => {
    if (!interactive) return;
    setTheme(isDarkMode ? "light" : "dark");
  };

  const handleSidebarToggle = () => {
    if (!interactive) return;
    toggleSidebar();
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
  };

  return (
    <div className="flex w-full flex-wrap items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full border border-border text-muted-foreground hover:text-foreground disabled:opacity-60"
        onClick={handleSidebarToggle}
        disabled={!interactive}
      >
        <SidebarToggleIcon className="size-4" />
      </Button>
      <div className="flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium text-muted-foreground">
        <span className="truncate">{computedLabel}</span>
        <ChevronRight className="size-3.5" />
      </div>
      
      <div className="ml-auto flex items-center gap-2">
        <Notepad />
        
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="relative rounded-full border border-border text-muted-foreground hover:text-foreground disabled:opacity-60"
              disabled={!interactive}
            >
              <Bell className="size-4" />
              {unreadCount > 0 && (
                <Badge className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white border-0">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h4 className="text-sm font-semibold">Notifications</h4>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-primary" onClick={markAllAsRead}>
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
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-muted/50 ${!notification.read ? "bg-primary/5" : ""}`}
                    >
                      <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${!notification.read ? "bg-primary" : "bg-transparent"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{notification.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                        <p className="mt-1 text-xs text-muted-foreground/70">{formatTimeAgo(notification.createdAt)}</p>
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
          className="rounded-full border border-border text-muted-foreground hover:text-foreground disabled:opacity-60"
          onClick={toggleTheme}
          disabled={!interactive}
        >
          <ThemeIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
};
