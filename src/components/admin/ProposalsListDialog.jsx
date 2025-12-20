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
import { DollarSign } from "lucide-react";

const ProposalsListDialog = ({ proposals, open, onOpenChange }) => {
  const formatCurrency = (amount) => {
    return `₹${(amount || 0).toLocaleString("en-IN")}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Project Proposals</DialogTitle>
          <DialogDescription>
            {proposals?.length || 0} proposals received for this project.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!proposals || proposals.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No proposals found.</p>
          ) : (
            proposals.map((proposal) => (
              <div key={proposal.id} className="flex flex-col gap-3 p-4 rounded-lg bg-muted/30 border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">{proposal.freelancer?.fullName}</span>
                    {proposal.status === 'ACCEPTED' && (
                      <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">Accepted</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1 font-medium text-foreground">
                      <DollarSign className="h-3 w-3" /> {formatCurrency(proposal.amount)}
                    </span>
                    <span>{format(new Date(proposal.createdAt), "MMM d, yyyy")}</span>
                  </div>
                </div>
                
                <div className="bg-card p-3 rounded border text-sm leading-relaxed whitespace-pre-wrap">
                  {proposal.coverLetter}
                </div>
                
                <div className="text-xs text-muted-foreground">
                  Email: {proposal.freelancer?.email}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProposalsListDialog;
