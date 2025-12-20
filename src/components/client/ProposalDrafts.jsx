"use client";

import React, { useEffect, useMemo, useState } from "react";
import { FileText, Pencil, Trash2 } from "lucide-react";
import { RoleAwareSidebar } from "@/components/dashboard/RoleAwareSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClientTopBar } from "@/components/client/ClientTopBar";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const STORAGE_KEYS = [
  "markify:savedProposal",
  "savedProposal",
];

const parseDraftValue = (value) => {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return { content: value };
    }
  }
  if (typeof value === "object") return value;
  return null;
};

const loadDrafts = () => {
  if (typeof window === "undefined") return [];
  const bySignature = new Map();

  STORAGE_KEYS.forEach((key) => {
    const raw = window.localStorage.getItem(key);
    if (!raw) return;
    const parsed = parseDraftValue(raw);
    if (!parsed?.content && !parsed?.summary) return;
    
    // CRITICAL: Only show proposals that were explicitly saved
    // Must have BOTH savedAt AND isSavedDraft to be considered a valid draft
    // This prevents auto-generated proposals from appearing in drafts
    const isExplicitlySaved = Boolean(parsed.savedAt) && Boolean(parsed.isSavedDraft);
    
    if (!isExplicitlySaved) {
      // Just skip showing it in drafts, but DO NOT delete it
      // It might be a pending proposal for the dashboard
      return;
    }
    
    const content = (parsed.content || parsed.summary || "").trim();
    const title =
      parsed.projectTitle ||
      parsed.title ||
      parsed.service ||
      parsed.category ||
      "Proposal Draft";
    const updatedAt =
      parsed.updatedAt ||
      parsed.createdAt ||
      parsed.savedAt ||
      new Date().toISOString();
    // signature to dedupe identical drafts from multiple keys (e.g., saved + pending)
    const signature = `${title}::${content}`;
    const existing = bySignature.get(signature);
    if (!existing || new Date(updatedAt) > new Date(existing.updatedAt)) {
      bySignature.set(signature, {
        id: `${key}-${updatedAt}`,
        storageKey: key,
        title,
        content,
        raw: parsed,
        updatedAt,
      });
    }
  });

  return Array.from(bySignature.values());
};

const saveDraftToStorage = (storageKey, draft) => {
  if (typeof window === "undefined" || !storageKey || !draft) return;
  const payload = {
    ...draft.raw,
    ...draft,
    content: draft.content,
    summary: draft.content,
    updatedAt: new Date().toISOString(),
    // Ensure both flags are maintained when saving edits
    savedAt: draft.raw?.savedAt || new Date().toISOString(),
    isSavedDraft: true,
  };
  window.localStorage.setItem(storageKey, JSON.stringify(payload));
};

const deleteDraftFromStorage = (storageKey) => {
  if (typeof window === "undefined" || !storageKey) return;
  window.localStorage.removeItem(storageKey);
};

const DraftCard = ({ draft, onEdit, onDelete, onRestore }) => {
  return (
    <Card className="border border-border/60 bg-card/70 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base">{draft.title}</CardTitle>
            <p className="text-xs text-muted-foreground">
              Updated {new Date(draft.updatedAt).toLocaleString()}
            </p>
          </div>
        </div>
        <Badge variant="outline">Draft</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm leading-6 text-foreground max-h-56 overflow-y-auto whitespace-pre-wrap">
          {draft.content}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" onClick={() => onEdit(draft)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-destructive/40 text-destructive"
            onClick={() => onDelete(draft)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <Button size="sm" variant="secondary" onClick={() => onRestore(draft)}>
            Restore to dashboard
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const DraftCardSkeleton = () => (
  <Card className="border border-border/60 bg-card/70 shadow-sm">
    <CardHeader className="flex flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-32" />
      </div>
    </CardContent>
  </Card>
);

const ProposalDraftsContent = () => {
  const [drafts, setDrafts] = useState([]);
  const [activeDraft, setActiveDraft] = useState(null);
  const [draftText, setDraftText] = useState("");
  const [loading, setLoading] = useState(true);

  const totalDrafts = useMemo(() => drafts.length, [drafts]);

  const { authFetch } = useAuth();

  useEffect(() => {
    const fetchDrafts = async () => {
      // Load local drafts first
      const local = loadDrafts();
      
      if (!authFetch) {
        setDrafts(local);
        setLoading(false);
        return;
      }

      try {
        const response = await authFetch("/proposals?as=owner"); // We might need to filter by status on client or add status param to API
        const payload = await response.json().catch(() => null);
        const serverProposals = Array.isArray(payload?.data) ? payload.data : [];
        
        const serverDrafts = serverProposals
          .filter(p => p.status === "DRAFT")
          .map(p => ({
            id: p.id,
            storageKey: `server-${p.id}`,
            title: p.project?.title || "Untitled Draft",
            content: p.coverLetter,
            updatedAt: p.updatedAt || p.createdAt,
            raw: p,
            isServer: true
          }));

        // Merge: prefer server drafts, but keep local ones that aren't on server?
        // For simplicity, let's show both.
        setDrafts([...local, ...serverDrafts]);
      } catch (error) {
        console.error("Failed to load server drafts", error);
        setDrafts(local);
      } finally {
        setLoading(false);
      }
    };
    fetchDrafts();
  }, [authFetch]);

  const handleEdit = (draft) => {
    setActiveDraft(draft);
    setDraftText(draft.content || "");
  };

  const handleDelete = (draft) => {
    // Delete from the specific storage key
    deleteDraftFromStorage(draft.storageKey);
    
    // Also delete from all known storage keys to ensure complete cleanup
    STORAGE_KEYS.forEach((key) => {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          // Check if this is the same draft (by comparing content or savedAt)
          if (parsed.savedAt === draft.raw?.savedAt || 
              parsed.content === draft.content ||
              parsed.summary === draft.content) {
            window.localStorage.removeItem(key);
          }
        } catch {
          // If parse fails, skip
        }
      }
    });
    
    // Update state to remove the draft from the list
    setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
    toast.success("Draft deleted successfully");
  };

  const handleSave = () => {
    if (!activeDraft) return;
    const updated = { ...activeDraft, content: draftText };
    saveDraftToStorage(activeDraft.storageKey, updated);
    setDrafts((prev) =>
      prev.map((d) => (d.storageKey === activeDraft.storageKey ? updated : d))
    );
    setActiveDraft(null);
    setDraftText("");
    toast.success("Draft saved.");
  };

const handleRestore = (draft, navigate) => {
  if (typeof window === "undefined") return;
  const payload = {
    ...draft.raw,
    content: draft.content,
    summary: draft.content,
    updatedAt: new Date().toISOString(),
    // Ensure both flags are explicitly set for restored drafts
    savedAt: draft.raw?.savedAt || new Date().toISOString(),
    isSavedDraft: true,
  };
  window.localStorage.setItem("markify:savedProposal", JSON.stringify(payload));
  window.localStorage.setItem("savedProposal", JSON.stringify(payload));
  // notify dashboard listeners
  window.dispatchEvent(new StorageEvent("storage", { key: "markify:savedProposal" }));
  toast.success("Draft restored to dashboard.");
  if (navigate) navigate("/client");
};

  return (
    <div className="space-y-6 p-6">
      <ClientTopBar />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Proposal drafts</h1>
          <p className="text-sm text-muted-foreground">
            Drafts are stored in your browser. Edit and save before sending.
          </p>
        </div>
        <Badge variant="outline">{totalDrafts} drafts</Badge>
      </div>

      {drafts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/40 px-4 py-6 text-sm text-muted-foreground">
          No drafts found. Draft a proposal from the chat and it will show up here.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {drafts.map((draft) => (
            <DraftCard
              key={draft.id}
              draft={draft}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRestore={handleRestore}
            />
          ))}
        </div>
      )}

      <Dialog open={Boolean(activeDraft)} onOpenChange={() => setActiveDraft(null)}>
        <DialogContent className="sm:max-w-[760px]">
          <DialogHeader>
            <DialogTitle>Edit draft</DialogTitle>
            <DialogDescription>
              Changes are stored locally as a draft. Save to keep your updates.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <textarea
              className="w-full min-h-[360px] resize-vertical rounded-md border border-border bg-background p-4 text-base text-foreground leading-6"
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
            />
          </div>
          <DialogFooter className="justify-end gap-2">
            <Button variant="ghost" onClick={() => setActiveDraft(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!draftText.trim()}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const ProposalDrafts = () => (
  <RoleAwareSidebar>
    <ProposalDraftsContent />
  </RoleAwareSidebar>
);

export default ProposalDrafts;
