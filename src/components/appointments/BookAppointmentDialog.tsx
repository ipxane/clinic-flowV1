import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { CalendarIcon, Stethoscope, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Patient } from "@/hooks/usePatients";
import { useServices, Service } from "@/hooks/useServices";
import { useAppointments, CreateAppointmentData } from "@/hooks/useAppointments";
import { useBookingAvailability } from "@/hooks/useBookingAvailability";
import { Appointment as BookingAppointment } from "@/lib/booking-engine";
import { FlexibleTimePicker } from "./FlexibleTimePicker";
import { PatientPhoneSelector } from "./PatientPhoneSelector";

interface BookAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate?: Date;
  onSuccess?: () => void;
}

export function BookAppointmentDialog({
  open,
  onOpenChange,
  initialDate = new Date(),
  onSuccess,
}: BookAppointmentDialogProps) {
  const { activeServices, isLoading: servicesLoading } = useServices();

  // Form state
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTimeValid, setIsTimeValid] = useState(false);

  // Use appointments hook with selected date
  const {
    appointments,
    workingPeriods,
    isHoliday,
    createAppointment,
    getNextAvailable,
    isLoading: appointmentsLoading,
  } = useAppointments(selectedDate);

  // Use booking availability hook for unified date disabling
  const { isDateDisabled } = useBookingAvailability();

  // Convert appointments to BookingAppointment format
  const existingAppointments: BookingAppointment[] = useMemo(() => {
    return appointments.map(apt => ({
      id: apt.id,
      appointment_date: apt.appointment_date,
      start_time: apt.start_time,
      end_time: apt.end_time,
      service_id: apt.service_id,
      status: apt.status as any,
    }));
  }, [appointments]);

  // Reset form when dialog opens - preserve nothing, full reset
  useEffect(() => {
    if (open) {
      setSelectedDate(initialDate);
      setSelectedPatient(null);
      setSelectedService(null);
      setSelectedTime("");
      setSelectedPeriod("");
      setNotes("");
      setIsTimeValid(false);
    }
  }, [open, initialDate]);

  // When date changes, only reset time (NOT patient)
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setSelectedTime("");
      setSelectedPeriod("");
    }
  };

  // When service changes, only reset time (NOT patient)
  const handleServiceChange = (serviceId: string) => {
    const service = activeServices.find(s => s.id === serviceId);
    setSelectedService(service || null);
    setSelectedTime("");
    setSelectedPeriod("");
  };

  // Auto-suggest time when service is selected
  const suggestedSlot = useMemo(() => {
    if (!selectedService || appointmentsLoading || workingPeriods.length === 0) {
      return null;
    }

    return getNextAvailable(selectedService.duration);
  }, [selectedService, getNextAvailable, appointmentsLoading, workingPeriods]);

  // Auto-set suggested time when service changes
  useEffect(() => {
    if (suggestedSlot && selectedService && !selectedTime) {
      setSelectedTime(suggestedSlot.time);
      setSelectedPeriod(suggestedSlot.periodName);
    }
  }, [suggestedSlot, selectedService]);

  // Check if date is available
  const holidayCheck = isHoliday(selectedDate);
  const isWorkingDay = workingPeriods.length > 0;

  // Validation - must have valid time selection
  const canSubmit =
    selectedPatient &&
    selectedService &&
    selectedTime &&
    selectedPeriod &&
    isTimeValid &&
    !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit || !selectedPatient || !selectedService) return;

    setIsSubmitting(true);

    const data: CreateAppointmentData = {
      patient_id: selectedPatient.id,
      service_id: selectedService.id,
      appointment_date: format(selectedDate, "yyyy-MM-dd"),
      start_time: selectedTime,
      duration: selectedService.duration,
      period_name: selectedPeriod,
      notes: notes.trim() || undefined,
      status: "confirmed",
    };

    const success = await createAppointment(data);

    setIsSubmitting(false);

    if (success) {
      onOpenChange(false);
      onSuccess?.();
    }
  };

  const handleTimeChange = (time: string, periodName: string) => {
    setSelectedTime(time);
    setSelectedPeriod(periodName);
  };

  const handleTimeValidationChange = (isValid: boolean) => {
    setIsTimeValid(isValid);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book Appointment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateChange}
                  disabled={isDateDisabled}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            {/* Date availability status */}
            {holidayCheck.isHoliday && (
              <p className="text-sm text-destructive">
                This date is marked as a holiday{holidayCheck.note ? `: ${holidayCheck.note}` : ""}
              </p>
            )}
            {!holidayCheck.isHoliday && !isWorkingDay && !appointmentsLoading && (
              <p className="text-sm text-muted-foreground">
                This is not a working day
              </p>
            )}
          </div>

          {/* Patient Selection - Phone-based with inline creation */}
          <PatientPhoneSelector
            selectedPatient={selectedPatient}
            onPatientSelect={setSelectedPatient}
          />

          {/* Service Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              Service
            </Label>
            <Select
              value={selectedService?.id || ""}
              onValueChange={handleServiceChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select service..." />
              </SelectTrigger>
              <SelectContent>
                {servicesLoading ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    Loading...
                  </div>
                ) : (
                  activeServices.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      <div className="flex items-center justify-between gap-4">
                        <span>{service.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {service.duration} min
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selectedService && (
              <p className="text-xs text-muted-foreground">
                Duration: {selectedService.duration} minutes • Price: ${selectedService.price}
              </p>
            )}
          </div>

          {/* Time Selection - New Flexible Time Picker */}
          <div className="space-y-2">
            <Label>Time</Label>

            {appointmentsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading available times...
              </div>
            ) : (
              <FlexibleTimePicker
                selectedDate={selectedDate}
                periods={workingPeriods}
                existingAppointments={existingAppointments}
                serviceDuration={selectedService?.duration || 30}
                value={selectedTime}
                periodName={selectedPeriod}
                onChange={handleTimeChange}
                suggestedTime={suggestedSlot?.time}
                suggestedPeriod={suggestedSlot?.periodName}
                disabled={!selectedService}
                onValidationChange={handleTimeValidationChange}
              />
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="Any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Booking...
              </>
            ) : (
              "Book Appointment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
