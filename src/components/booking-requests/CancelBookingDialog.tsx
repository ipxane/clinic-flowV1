import { useState, useEffect } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BookingRequest } from "@/hooks/useBookingRequests";

interface CancelBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: BookingRequest | null;
  onCancel: (requestId: string, staffNotes?: string) => Promise<void>;
}

export function CancelBookingDialog({
  open,
  onOpenChange,
  request,
  onCancel,
}: CancelBookingDialogProps) {
  const [staffNotes, setStaffNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setStaffNotes("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!request) return;

    setIsSubmitting(true);
    try {
      await onCancel(request.id, staffNotes.trim() || undefined);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Cancel Booking Request
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel this booking request from {request.patient_name}?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Request Info */}
          <div className="bg-muted p-3 rounded-md text-sm">
            <p><span className="font-medium">{request.patient_name}</span></p>
            <p className="text-muted-foreground">{request.service_name}</p>
            <p className="text-muted-foreground">
              {request.requested_date} - {request.requested_period}
            </p>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label>Cancellation Reason (Optional)</Label>
            <Textarea
              value={staffNotes}
              onChange={(e) => setStaffNotes(e.target.value)}
              placeholder="Add a note explaining the cancellation..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Keep Request
          </Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cancelling...
              </>
            ) : (
              "Cancel Request"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
