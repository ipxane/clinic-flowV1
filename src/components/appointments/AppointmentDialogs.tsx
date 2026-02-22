import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock, User, Stethoscope, Phone, Loader2 } from "lucide-react";
import { RescheduleTimePicker } from "./RescheduleTimePicker";
import { Appointment as BookingAppointment } from "@/lib/booking-engine";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DisplayAppointment } from "@/types/appointments";
import { StatusBadge, Status } from "@/components/ui/StatusBadge";

// Map appointment status to StatusBadge status
const mapStatus = (status: string): Status => {
  switch (status) {
    case "confirmed":
    case "completed":
      return "confirmed";
    case "postponed":
      return "postponed";
    case "cancelled":
      return "cancelled";
    default:
      return "pending";
  }
};

// View Dialog
interface ViewAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: DisplayAppointment | null;
  selectedDate: Date;
}

export function ViewAppointmentDialog({
  open,
  onOpenChange,
  appointment,
  selectedDate,
}: ViewAppointmentDialogProps) {
  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Appointment Details</DialogTitle>
          <DialogDescription>
            {format(selectedDate, "EEEE, MMMM d, yyyy")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{appointment.patientName}</p>
                {appointment.patientPhone && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {appointment.patientPhone}
                  </div>
                )}
              </div>
            </div>
            <StatusBadge status={mapStatus(appointment.status)} />
          </div>

          <div className="flex items-center gap-3">
            <Stethoscope className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">{appointment.service}</p>
              <p className="text-sm text-muted-foreground">
                {appointment.duration} minutes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">{appointment.timeLabel}</p>
              <p className="text-sm text-muted-foreground">
                {appointment.period}
              </p>
            </div>
          </div>

          {appointment.notes && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm font-medium">Notes</p>
              <p className="text-sm text-muted-foreground">{appointment.notes}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Confirm Dialog
interface ConfirmAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: DisplayAppointment | null;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ConfirmAppointmentDialog({
  open,
  onOpenChange,
  appointment,
  onConfirm,
  isLoading,
}: ConfirmAppointmentDialogProps) {
  if (!appointment) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Appointment</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to confirm this appointment for{" "}
            <span className="font-medium">{appointment.patientName}</span> at{" "}
            <span className="font-medium">{appointment.timeLabel}</span>?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirming...
              </>
            ) : (
              "Confirm"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Cancel Dialog
interface CancelAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: DisplayAppointment | null;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CancelAppointmentDialog({
  open,
  onOpenChange,
  appointment,
  onCancel,
  isLoading,
}: CancelAppointmentDialogProps) {
  if (!appointment) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel this appointment for{" "}
            <span className="font-medium">{appointment.patientName}</span>? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Keep Appointment</AlertDialogCancel>
          <AlertDialogAction
            onClick={onCancel}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cancelling...
              </>
            ) : (
              "Cancel Appointment"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Postpone (Reschedule) Dialog
interface PostponeAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: DisplayAppointment | null;
  onPostpone: (newDate: Date, newTime: string, periodName: string) => void;
  isLoading?: boolean;
  getPeriodsForDate: (date: Date) => Promise<any[]>;
  getAppointmentsForDate: (date: Date) => Promise<any[]>;
  isHoliday: (date: Date) => { isHoliday: boolean; note?: string };
}

export function PostponeAppointmentDialog({
  open,
  onOpenChange,
  appointment,
  onPostpone,
  isLoading = false,
  getPeriodsForDate,
  getAppointmentsForDate,
  isHoliday,
}: PostponeAppointmentDialogProps) {
  const [newDate, setNewDate] = useState<Date>(new Date());
  const [newTime, setNewTime] = useState<string>("");
  const [newPeriod, setNewPeriod] = useState<string>("");
  const [isTimeValid, setIsTimeValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Periods and appointments for the selected date
  const [datePeriods, setDatePeriods] = useState<any[]>([]);
  const [dateAppointments, setDateAppointments] = useState<any[]>([]);
  const [isLoadingDate, setIsLoadingDate] = useState(false);

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setNewDate(new Date());
      setNewTime("");
      setNewPeriod("");
      setIsTimeValid(false);
      setIsSubmitting(false);
    }
  }, [open]);

  // Load periods and appointments when date changes
  // Using refs to avoid infinite loops from function dependencies
  useEffect(() => {
    if (!open || !newDate) return;

    let isCancelled = false;

    const loadDateData = async () => {
      setIsLoadingDate(true);
      setNewTime("");
      setNewPeriod("");
      setIsTimeValid(false);

      try {
        const [periods, appointments] = await Promise.all([
          getPeriodsForDate(newDate),
          getAppointmentsForDate(newDate),
        ]);

        if (!isCancelled) {
          setDatePeriods(periods);
          setDateAppointments(appointments);
        }
      } catch (error) {
        console.error("Failed to load date data:", error);
        if (!isCancelled) {
          setDatePeriods([]);
          setDateAppointments([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingDate(false);
        }
      }
    };

    loadDateData();

    return () => {
      isCancelled = true;
    };
  }, [open, newDate, getPeriodsForDate, getAppointmentsForDate]);

  // Convert to BookingAppointment format, excluding current appointment
  const existingAppointments: BookingAppointment[] = useMemo(() => {
    return dateAppointments
      .filter(apt => apt.id !== appointment?.id)
      .map(apt => ({
        id: apt.id,
        appointment_date: apt.appointment_date,
        start_time: apt.start_time,
        end_time: apt.end_time,
        service_id: apt.service_id,
        status: apt.status as any,
      }));
  }, [dateAppointments, appointment]);

  // Check availability
  const holidayCheck = isHoliday(newDate);
  const isWorkingDay = datePeriods.length > 0;

  // Can submit only when time is valid
  const canSubmit = newTime && newPeriod && isTimeValid && !isSubmitting && !isLoading;

  if (!appointment) return null;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      await onPostpone(newDate, newTime, newPeriod);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTimeChange = (time: string, periodName: string) => {
    setNewTime(time);
    setNewPeriod(periodName);
  };

  const handleTimeValidationChange = (isValid: boolean) => {
    setIsTimeValid(isValid);
  };

  const submitting = isSubmitting || isLoading;

  return (
    <Dialog open={open} onOpenChange={submitting ? undefined : onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reschedule Appointment</DialogTitle>
          <DialogDescription>
            Select a new date and time for {appointment.patientName}'s appointment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Appointment Info */}
          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm font-medium">Current Appointment</p>
            <p className="text-sm text-muted-foreground">
              {appointment.service} • {appointment.timeLabel} • {appointment.duration} min
            </p>
          </div>

          {/* New Date Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              New Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  disabled={submitting}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(newDate, "EEEE, MMMM d, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={newDate}
                  onSelect={(date) => {
                    if (date) {
                      setNewDate(date);
                    }
                  }}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            {holidayCheck.isHoliday && (
              <p className="text-sm text-destructive">
                This date is marked as a holiday{holidayCheck.note ? `: ${holidayCheck.note}` : ""}
              </p>
            )}
            {!holidayCheck.isHoliday && !isWorkingDay && !isLoadingDate && (
              <p className="text-sm text-muted-foreground">
                This is not a working day
              </p>
            )}
          </div>

          {/* New Time Selection - FlexibleTimePicker */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              New Time
            </Label>

            {isLoadingDate ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading available times...
              </div>
            ) : datePeriods.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No working hours configured for this date
              </p>
            ) : (
              <RescheduleTimePicker
                selectedDate={newDate}
                periods={datePeriods}
                existingAppointments={existingAppointments}
                serviceDuration={appointment.duration}
                value={newTime}
                periodName={newPeriod}
                onChange={handleTimeChange}
                disabled={false}
                onValidationChange={handleTimeValidationChange}
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Rescheduling...
              </>
            ) : (
              "Reschedule"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Delete Appointment Dialog
interface DeleteAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: DisplayAppointment | null;
  onDelete: () => void;
  isLoading?: boolean;
}

export function DeleteAppointmentDialog({
  open,
  onOpenChange,
  appointment,
  onDelete,
  isLoading,
}: DeleteAppointmentDialogProps) {
  if (!appointment) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Appointment</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to permanently delete this appointment for{" "}
            <span className="font-medium">{appointment.patientName}</span>?
            This will free up the time slot and cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onDelete}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Permanently"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
