import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { User, Briefcase, FileText, Calendar, Link as LinkIcon, CheckCircle } from "lucide-react";

const DisputeDetailsDialog = ({ dispute, open, onOpenChange }) => {
  if (!dispute) return null;

  const getStatusBadge = (status) => {
    const colors = {
      OPEN: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      IN_PROGRESS: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      RESOLVED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
    };
    return (
      <Badge className={`${colors[status] || "bg-gray-100"} border-0`}>
        {status}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between mr-8">
            <DialogTitle className="text-xl">Dispute Details</DialogTitle>
            {getStatusBadge(dispute.status)}
          </div>
          <DialogDescription>
            Created on {format(new Date(dispute.createdAt), "PPP")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Project & User Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/40 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Briefcase className="h-4 w-4" />
                Project
              </div>
              <div className="font-medium text-lg">{dispute.project?.title || "Unknown Project"}</div>
            </div>

            <div className="p-4 rounded-lg bg-muted/40 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <User className="h-4 w-4" />
                Raised By
              </div>
              <div>
                <div className="font-medium text-lg">{dispute.raisedBy?.fullName}</div>
                <div className="text-sm text-muted-foreground">{dispute.raisedBy?.email}</div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FileText className="h-4 w-4" />
              Issue Description
            </div>
            <div className="p-4 rounded-lg border bg-card text-sm leading-relaxed whitespace-pre-wrap">
              {dispute.description}
            </div>
          </div>

          {/* Manager & Resolution */}
          <div className="space-y-4">
             <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground border-b pb-2">
               <CheckCircle className="h-4 w-4" />
               Resolution Status
             </div>
             
             <div className="grid gap-4">
                <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                   <span className="text-sm text-muted-foreground">Assigned To:</span>
                   <span className="font-medium">
                     {dispute.manager ? dispute.manager.fullName : <span className="text-muted-foreground italic">Unassigned</span>}
                   </span>
                </div>

                {dispute.meetingLink && (
                  <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                     <span className="text-sm text-muted-foreground flex items-center gap-1">
                       <LinkIcon className="h-3 w-3" /> Meeting:
                     </span>
                     <a href={dispute.meetingLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm truncate">
                       {dispute.meetingLink}
                     </a>
                  </div>
                )}
                
                {dispute.meetingDate && (
                  <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                     <span className="text-sm text-muted-foreground flex items-center gap-1">
                       <Calendar className="h-3 w-3" /> Date:
                     </span>
                     <span className="text-sm">
                       {format(new Date(dispute.meetingDate), "PPP p")}
                     </span>
                  </div>
                )}

                {dispute.resolutionNotes && (
                  <div className="space-y-2 mt-2">
                    <span className="text-sm text-muted-foreground">Resolution Notes:</span>
                    <div className="p-3 rounded-lg bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-800 text-sm">
                      {dispute.resolutionNotes}
                    </div>
                  </div>
                )}
             </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DisputeDetailsDialog;
