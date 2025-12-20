import React, { useMemo, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight } from "lucide-react";

const stripUnavailableSections = (text = "") => {
    const withoutTags = text.replace(/\[PROPOSAL_DATA\]|\[\/PROPOSAL_DATA\]/g, "");
    const filtered = [];

    const isDividerLine = (line) => {
        const trimmed = line.trim();
        if (!trimmed) return false;

        // Box-drawing separators (e.g., "══════") or similar glyph-only lines
        if (/^[\u2500-\u257F]+$/.test(trimmed)) return true;

        // ASCII separators ("-----", "=====", etc.)
        if (/^[=\-_*]{10,}$/.test(trimmed)) return true;

        // Fallback: long line with no alphanumerics (covers corrupted separator glyphs)
        if (trimmed.length >= 20 && /^[^a-z0-9]+$/i.test(trimmed)) return true;

        return false;
    };

    const shouldDropLine = (line) => {
        const trimmed = line.trim();
        if (!trimmed) return false;
        if (/^project proposal$/i.test(trimmed)) return true;
        if (isDividerLine(line)) return true;
        if (/not provided/i.test(trimmed) || /not specified/i.test(trimmed)) return true;
        // Drop leftover placeholder tokens like [Portfolio]
        if (/^\[[^\]]+\]$/.test(trimmed)) return true;
        return false;
    };

    withoutTags.split("\n").forEach((line) => {
        if (shouldDropLine(line)) return;

        const trimmed = line.trim();
        if (!trimmed) {
            if (filtered[filtered.length - 1] === "") return;
            filtered.push("");
            return;
        }

        filtered.push(trimmed);
    });

    return filtered.join("\n").trim();
};

const normalizeBudgetText = (text = "") => {
    // Look for lines starting with "Budget:" and normalize the value part
    return text.replace(/Budget:\s*(.*)/i, (match, value) => {
        let cleanValue = value;
        const lower = value.toLowerCase().replace(/,/g, "");
        
        // Check for 'k' (thousands)
        if (lower.includes("k")) {
            const num = parseFloat(lower.replace(/[^0-9.]/g, ""));
            if (!isNaN(num)) {
                cleanValue = `INR ${Math.round(num * 1000)}`;
            }
        } 
        // Check for 'l' or 'lakh' (lakhs)
        else if (lower.includes("l") || lower.includes("lakh")) {
            const num = parseFloat(lower.replace(/[^0-9.]/g, ""));
            if (!isNaN(num)) {
                cleanValue = `INR ${Math.round(num * 100000)}`;
            }
        }

        return `Budget: ${cleanValue}`;
    });
};

const ProposalPanel = ({ content }) => {
    if (!content) return null;

    const navigate = useNavigate();
    const { user } = useAuth();

    const cleanContent = useMemo(() => {
        const stripped = stripUnavailableSections(content);
        return normalizeBudgetText(stripped);
    }, [content]);

    // Local state for editing
    const [isEditing, setIsEditing] = useState(false);
    const [editableContent, setEditableContent] = useState(cleanContent);

    // Sync state if prop changes (e.g. re-generation matches)
    useEffect(() => {
        setEditableContent(cleanContent);
    }, [cleanContent]);

    // Parse from editableContent so updates reflect immediately in the title/budget
    const parsed = useMemo(() => {
        const getValue = (label) => {
            const match = editableContent.match(new RegExp(`${label}:\\s*(.*)`, "i"));
            return match?.[1]?.trim() || "";
        };

        const serviceName =
            getValue("Service") ||
            getValue("Service Type") ||
            getValue("Category") ||
            "";

        const projectName =
            getValue("Project Name") ||
            getValue("Project Title") ||
            getValue("Project") ||
            "";

        const projectTitle =
            serviceName && projectName
                ? `${serviceName}/${projectName}`
                : projectName || serviceName || "Project Proposal";
        const preparedFor = getValue("Prepared for") || getValue("For") || "Client";
        
        // Parse budget to clean numbers for dashboard logic
        let rawBudget = getValue("Budget") || "";
        let budget = rawBudget;

        // Try to normalize "60k" -> "60000", "1.5L" -> "150000" if it contains text
        try {
           const lower = rawBudget.toLowerCase().replace(/,/g, "");
           if (lower.includes("k")) {
               const num = parseFloat(lower.replace(/[^0-9.]/g, ""));
               if (!isNaN(num)) {
                   budget = Math.round(num * 1000).toString();
               }
           } else if (lower.includes("l") || lower.includes("lakh")) {
               const num = parseFloat(lower.replace(/[^0-9.]/g, ""));
               if (!isNaN(num)) {
                   budget = Math.round(num * 100000).toString();
               }
           } else {
               // Just extract the number
               const num = parseFloat(lower.replace(/[^0-9.]/g, ""));
               if (!isNaN(num)) {
                   budget = num.toString();
               }
           }
        } catch (e) {
           // fallback to raw string
        }

        const service = serviceName || "General services";

        return {
            service,
            projectTitle,
            preparedFor,
            budget, // This is now a clean string number "60000" or raw text if fail
            summary: editableContent,
            raw: { content: editableContent }
        };
    }, [editableContent]);

    // Accept and proceed to dashboard - saves to dashboard view only, NOT to drafts
    const handleAccept = () => {
        if (typeof window === "undefined") return;
        
        // Save proposal WITHOUT isSavedDraft flag - this means it shows in Dashboard
        // but NOT in the Proposal Drafts page
        const payload = {
            ...parsed,
            createdAt: new Date().toISOString(),
            // NOTE: No savedAt or isSavedDraft flag - so it won't appear in drafts
            // User must click "Save" on Dashboard to save to drafts
        };
        window.localStorage.setItem("markify:savedProposal", JSON.stringify(payload));
        window.localStorage.removeItem("markify:savedProposalSynced");
        
        toast.success("Proposal accepted! Redirecting to dashboard...");
        
        if (user?.role === "CLIENT") {
            navigate("/client");
            return;
        }
        navigate("/login", { state: { redirectTo: "/client" } });
    };

    const handleSaveEdit = () => {
        setIsEditing(false);
        toast.success("Changes saved");
    };

    const handleCancelEdit = () => {
        setEditableContent(cleanContent);
        setIsEditing(false);
    };

    return (
        <>
            <Card className="border border-border/50 bg-card/70 h-full overflow-hidden flex flex-col">
                <CardContent className="flex h-full flex-col gap-4 overflow-hidden p-4">
                    <div className="space-y-1 border-b border-border/40 pb-4">
                        <p className="text-xs uppercase tracking-[0.32em] text-emerald-500 font-bold">
                            proposal ready
                        </p>
                        <p className="text-lg font-semibold">{parsed.projectTitle}</p>
                    </div>

                    <div className="flex-1 overflow-hidden">
                        <div className="h-full overflow-y-auto pr-1 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap font-mono">
                            {editableContent}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-border/40 flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setIsEditing(true)}
                            className="flex-1 border-primary/20 hover:bg-primary/5 text-primary"
                        >
                            Edit Proposal
                        </Button>
                        <Button
                            className="flex-[2] gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={handleAccept}
                        >
                            Accept Proposal
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Edit Proposal</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 py-4 overflow-hidden">
                        <Textarea
                            value={editableContent}
                            onChange={(e) => setEditableContent(e.target.value)}
                            className="h-[50vh] w-full font-mono text-sm resize-none"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleCancelEdit}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveEdit}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default ProposalPanel;
