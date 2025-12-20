"use client";

import { useState, useEffect, useCallback } from "react";
import { StickyNote, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

// Simple single-note notepad for project detail pages - saves to database
export function ProjectNotepad({ projectId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const { authFetch } = useAuth();

  // Load note from database when dialog opens
  useEffect(() => {
    if (isOpen && projectId && authFetch && !hasLoaded) {
      const loadNote = async () => {
        setIsLoading(true);
        try {
          const response = await authFetch(`/projects/${projectId}`);
          const payload = await response.json().catch(() => null);
          const project = payload?.data;
          if (project?.notes !== undefined) {
            setContent(project.notes || "");
          }
          setHasLoaded(true);
        } catch (error) {
          console.error("Failed to load project notes:", error);
        } finally {
          setIsLoading(false);
        }
      };
      loadNote();
    }
  }, [isOpen, projectId, authFetch, hasLoaded]);

  // Debounced save to database
  const saveNote = useCallback(async (noteContent) => {
    if (!projectId || !authFetch) return;
    
    setIsSaving(true);
    try {
      await authFetch(`/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: noteContent })
      });
    } catch (error) {
      console.error("Failed to save note:", error);
      toast.error("Failed to save note");
    } finally {
      setIsSaving(false);
    }
  }, [projectId, authFetch]);

  // Auto-save with debounce when content changes
  useEffect(() => {
    if (!hasLoaded) return; // Don't save on initial load
    
    const timer = setTimeout(() => {
      saveNote(content);
    }, 1000); // Save 1 second after user stops typing

    return () => clearTimeout(timer);
  }, [content, saveNote, hasLoaded]);

  const handleChange = (e) => {
    setContent(e.target.value);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2 border-border/60"
        onClick={() => setIsOpen(true)}
      >
        <StickyNote className="size-4 text-yellow-500" />
        Notes
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg w-[95vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StickyNote className="size-5 text-yellow-500" />
              Project Notes
            </DialogTitle>
          </DialogHeader>
          {isLoading ? (
            <div className="flex items-center justify-center h-[300px]">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Textarea
              value={content}
              onChange={handleChange}
              placeholder="Write your notes here..."
              className="min-h-[300px] resize-none text-sm leading-relaxed"
              autoFocus
            />
          )}
          <p className="text-xs text-muted-foreground text-right flex items-center justify-end gap-2">
            {isSaving ? (
              <>
                <Loader2 className="size-3 animate-spin" />
                Saving...
              </>
            ) : (
              "Auto-saved to database"
            )}
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Keep the old export for backward compatibility but make it a no-op
export function Notepad() {
  return null;
}
