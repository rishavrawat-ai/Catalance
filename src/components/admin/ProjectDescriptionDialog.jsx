import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText } from "lucide-react";

const ProjectDescriptionDialog = ({ description, open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" /> Project Description
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-muted/30 p-6 rounded-lg border text-sm leading-relaxed whitespace-pre-wrap font-mono">
            {description || "No description provided."}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectDescriptionDialog;
