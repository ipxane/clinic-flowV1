import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge, Status } from "@/components/ui/StatusBadge";
import { BookingRequest } from "@/hooks/useBookingRequests";

interface ViewBookingRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: BookingRequest | null;
  onConfirm: () => void;
  onPostpone: () => void;
  onCancel: () => void;
}

export function ViewBookingRequestDialog({
  open,
  onOpenChange,
  request,
  onConfirm,
  onPostpone,
  onCancel,
}: ViewBookingRequestDialogProps) {
  if (!request) return null;

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMMM d, yyyy");
    } catch {
      return dateString;
    }
  };

  const isPending = request.status === "pending";
  const isPostponed = request.status === "postponed";
  const isConfirmed = request.status === "confirmed";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Booking Request Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{request.patient_name}</h3>
              <p className="text-sm text-muted-foreground">
                {request.contact_type === "phone" ? "Phone: " : "Email: "}
                {request.contact_info}
              </p>
            </div>
            <StatusBadge status={request.status as Status} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Service</p>
              <p className="font-medium">{request.service_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Requested Date</p>
              <p className="font-medium">{formatDate(request.requested_date)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Preferred Time</p>
              <p className="font-medium">{request.requested_period}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Submitted</p>
              <p className="font-medium">
                {format(new Date(request.created_at), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div>
              <p className="text-sm text-muted-foreground">Patient Type</p>
              <p className="font-medium capitalize">{request.patient_type}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date of Birth</p>
              <p className="font-medium">{request.date_of_birth || "N/A"}</p>
            </div>
          </div>

          {request.patient_type === "child" && request.guardian_name && (
            <div className="bg-primary/5 p-3 rounded-md border border-primary/10">
              <p className="text-sm font-semibold text-primary mb-1">Guardian Details</p>
              <p className="text-sm">Name: <span className="font-medium">{request.guardian_name}</span></p>
              <p className="text-sm">Phone: <span className="font-medium">{request.guardian_phone}</span></p>
              {request.guardian_email && (
                <p className="text-sm">Email: <span className="font-medium">{request.guardian_email}</span></p>
              )}
            </div>
          )}

          {request.notes && (
            <div>
              <p className="text-sm text-muted-foreground">Patient Notes</p>
              <p className="text-sm bg-muted p-3 rounded-md italic">"{request.notes}"</p>
            </div>
          )}

          {request.staff_notes && (
            <div>
              <p className="text-sm text-muted-foreground">Staff Notes</p>
              <p className="text-sm bg-muted p-3 rounded-md">{request.staff_notes}</p>
            </div>
          )}

          {request.suggested_date && (
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground">Suggested Alternative</p>
              <p className="font-medium">
                {formatDate(request.suggested_date)}
                {request.suggested_period && ` - ${request.suggested_period}`}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {(isPending || isPostponed) && (
            <>
              <Button variant="outline" onClick={onCancel} className="text-destructive">
                Cancel Request
              </Button>
              {isPostponed && (
                <Button variant="outline" onClick={onPostpone}>
                  Update Suggestion
                </Button>
              )}
              <Button onClick={onConfirm}>
                Confirm & Create Appointment
              </Button>
            </>
          )}
          {isConfirmed && (
            <>
              <Button variant="outline" onClick={onPostpone}>
                Postpone
              </Button>
              <Button variant="outline" onClick={onCancel} className="text-destructive">
                Cancel
              </Button>
              <Button onClick={() => onOpenChange(false)}>Close</Button>
            </>
          )}
          {request.status === "cancelled" && (
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
