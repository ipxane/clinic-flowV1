import { MoreHorizontal, Eye, Check, Clock, XCircle, Phone, CheckCircle, UserX, FileText, ArrowRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge, Status } from "@/components/ui/StatusBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { DisplayAppointment } from "@/types/appointments";
import type { AppointmentStatus } from "@/hooks/useAppointments";

interface AppointmentCardProps {
  appointment: DisplayAppointment;
  onView: (appointment: DisplayAppointment) => void;
  onConfirm: (appointment: DisplayAppointment) => void;
  onPostpone: (appointment: DisplayAppointment) => void;
  onCancel: (appointment: DisplayAppointment) => void;
  onStatusChange: (appointment: DisplayAppointment, status: AppointmentStatus) => void;
  onDelete?: (appointment: DisplayAppointment) => void;
}

// Calculate end time from start time and duration
function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`;
}

// Format time to 12-hour format (e.g., "9:00 AM")
function formatTime12Hour(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

export function AppointmentCard({
  appointment,
  onView,
  onConfirm,
  onPostpone,
  onCancel,
  onStatusChange,
  onDelete,
}: AppointmentCardProps) {
  // Map appointment status to StatusBadge status
  const mapStatus = (status: string): Status => {
    switch (status) {
      case "confirmed":
        return "confirmed";
      case "pending":
        return "pending";
      case "postponed":
        return "postponed";
      case "cancelled":
        return "cancelled";
      case "completed":
        return "completed";
      case "no_show":
        return "no_show";
      default:
        return "pending";
    }
  };

  const isCancelled = appointment.status === "cancelled";
  const isCompleted = appointment.status === "completed";
  const isNoShow = appointment.status === "no_show";
  const isFinal = isCancelled || isCompleted || isNoShow;

  // Calculate formatted times
  const startTimeFormatted = formatTime12Hour(appointment.time);
  const endTime = calculateEndTime(appointment.time, appointment.duration);
  const endTimeFormatted = formatTime12Hour(endTime);

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        {/* Header: Patient Name + Actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-foreground">
              {appointment.patientName}
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {appointment.service}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(appointment)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              
              
              {!isFinal && (
                <>
                  <DropdownMenuItem 
                    onClick={() => onConfirm(appointment)}
                    disabled={appointment.status === "confirmed"}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Confirm
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onPostpone(appointment)}>
                    <Clock className="mr-2 h-4 w-4" />
                    Reschedule
                  </DropdownMenuItem>
                </>
              )}
              
              {/* Attendance Tracking Submenu */}
              {!isFinal && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark Attendance
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={() => onStatusChange(appointment, "completed")}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Completed / Attended
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onStatusChange(appointment, "no_show")}>
                        <UserX className="mr-2 h-4 w-4" />
                        No-Show
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              )}
              
              {!isFinal && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onCancel(appointment)}
                    className="text-destructive focus:text-destructive"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel
                  </DropdownMenuItem>
                </>
              )}
              
              {/* Delete option for cancelled/completed/no-show appointments */}
              {isFinal && onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(appointment)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Permanently
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Contact Info */}
        {appointment.patientPhone && (
          <div className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Phone className="h-3.5 w-3.5" />
            <span>{appointment.patientPhone}</span>
          </div>
        )}

        {/* Notes */}
        {appointment.notes && (
          <div className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
            <FileText className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <p className="line-clamp-2">{appointment.notes}</p>
          </div>
        )}

        {/* Footer: Time & Status */}
        <div className="mt-4 flex items-center justify-between border-t pt-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-sm font-medium text-primary">
              <Clock className="h-3.5 w-3.5" />
              <span>{startTimeFormatted}</span>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <span>{endTimeFormatted}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Duration: {appointment.duration} minutes
            </p>
          </div>
          <StatusBadge status={mapStatus(appointment.status)} />
        </div>
      </CardContent>
    </Card>
  );
}