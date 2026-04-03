/**
 * Quote Amendment Dialog Component
 *
 * Dialog for customer to request changes to a quote
 */
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, MessageSquareText } from "lucide-react";
import { toast } from "sonner";
import { requestQuoteAmendment } from "../../actions/quote-workflow-actions";

interface QuoteAmendmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  onAmendmentRequested: () => void;
}

export function QuoteAmendmentDialog({
  open,
  onOpenChange,
  token,
  onAmendmentRequested,
}: QuoteAmendmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setNotes("");
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = async () => {
    if (!notes.trim()) {
      toast.error("Please describe the changes you'd like");
      return;
    }

    setLoading(true);

    try {
      const result = await requestQuoteAmendment({
        token,
        amendment_notes: notes.trim(),
      });

      if (result.success) {
        toast.success("Your change request has been sent");
        onAmendmentRequested();
      } else {
        toast.error(result.error || "Failed to submit change request");
      }
    } catch (error) {
      console.error("Error requesting amendment:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquareText className="h-5 w-5" />
            Request Changes
          </DialogTitle>
          <DialogDescription>
            Let us know what you&apos;d like changed in this quote. We&apos;ll
            review your request and send you an updated quote.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amendment-notes">What changes do you need?</Label>
            <Textarea
              id="amendment-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g. Please adjust the quantity to 50 units, or I'd like to add another product..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Be as specific as possible so we can prepare an accurate revised
              quote.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !notes.trim()}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {loading ? "Submitting..." : "Submit Change Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
