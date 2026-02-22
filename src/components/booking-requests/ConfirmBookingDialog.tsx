import { useState, useEffect, useCallback } from "react";
import { format, addMinutes, parse } from "date-fns";
import { CalendarIcon, Loader2, AlertCircle } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { BookingRequest } from "@/hooks/useBookingRequests";
import { usePatients } from "@/hooks/usePatients";
import { useServices } from "@/hooks/useServices";
import { useAppointments } from "@/hooks/useAppointments";
import { useBookingEngine } from "@/hooks/useBookingEngine";
import { AvailablePeriod } from "@/lib/booking-engine";

interface ConfirmBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: BookingRequest | null;
  onConfirm: (
    requestId: string,
    appointmentData: {
      patient_id?: string;
      service_id: string;
      appointment_date: string;
      start_time: string;
      end_time: string;
      duration: number;
      period_name: string;
      notes?: string;
      patient_details?: {
        full_name: string;
        phone: string;
        date_of_birth?: string | null;
        patient_type: "adult" | "child";
        guardian_details?: {
          full_name: string;
          phone: string;
          email?: string | null;
        };
      };
    }
  ) => Promise<any>;
}

export function ConfirmBookingDialog({
  open,
  onOpenChange,
  request,
  onConfirm,
}: ConfirmBookingDialogProps) {
  const { patients } = usePatients();
  const { services } = useServices();
  const {
    fetchPeriodAvailability,
    validateBooking,
    isLoading: isLoadingEngine
  } = useBookingEngine({ mode: 'INTERNAL' });

  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [startTime, setStartTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [periods, setPeriods] = useState<AvailablePeriod[]>([]);
  const [isLoadingPeriods, setIsLoadingPeriods] = useState(false);
  const [error, setError] = useState("");

  // Reset form when dialog opens
  useEffect(() => {
    if (open && request) {
      setSelectedDate(new Date(request.requested_date));
      setSelectedPatientId("");
      setSelectedPeriod("");
      setStartTime("");
      setError("");
    }
  }, [open, request]);

  // Load periods when date changes
  useEffect(() => {
    if (!open || !selectedDate) return;

    const loadPeriods = async () => {
      setIsLoadingPeriods(true);
      try {
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        const service = services.find((s) => s.id === request?.service_id);
        const duration = service?.duration || 30;

        const datePeriods = await fetchPeriodAvailability(dateStr, duration);
        setPeriods(datePeriods);
      } catch (e) {
        setError("Failed to load available periods");
      } finally {
        setIsLoadingPeriods(false);
      }
    };
    loadPeriods();
  }, [open, selectedDate, fetchPeriodAvailability, services, request?.service_id]);

  // Find or suggest patient
  const matchingPatients = patients.filter(
    (p) =>
      p.full_name.toLowerCase().includes(request?.patient_name.toLowerCase() || "") ||
      (request?.contact_type === "phone" && p.phone === request.contact_info) ||
      (request?.contact_type === "email" && p.email === request.contact_info)
  );

  // Auto-select patient if a single clear match is found
  useEffect(() => {
    if (open && request && matchingPatients.length === 1 && !selectedPatientId) {
      setSelectedPatientId(matchingPatients[0].id);
    }
  }, [open, request, matchingPatients, selectedPatientId]);

  const service = services.find((s) => s.id === request?.service_id);
  const duration = service?.duration || 30;

  const handleSubmit = async () => {
    if (!request || !selectedDate || !selectedPatientId || !selectedPeriod || !startTime) {
      setError("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");

      // Perform strict validation using INTERNAL mode (allows holidays but blocks overlaps)
      const validation = await validateBooking(
        dateStr,
        startTime,
        duration,
        selectedPeriod
      );

      if (!validation.isValid) {
        throw new Error(validation.errors.join(". "));
      }

      const startDateTime = parse(startTime, "HH:mm", selectedDate);
      const endDateTime = addMinutes(startDateTime, duration);

      const appointmentData: any = {
        service_id: request.service_id || "",
        appointment_date: dateStr,
        start_time: startTime,
        end_time: format(endDateTime, "HH:mm"),
        duration,
        period_name: selectedPeriod,
        notes: request.notes || undefined,
      };

      if (selectedPatientId === "NEW_PATIENT") {
        appointmentData.patient_details = {
          full_name: request.patient_name,
          phone: request.contact_info,
          date_of_birth: request.date_of_birth,
          patient_type: request.patient_type,
          guardian_details: request.patient_type === "child" && request.guardian_name && request.guardian_phone ? {
            full_name: request.guardian_name,
            phone: request.guardian_phone,
            email: request.guardian_email
          } : undefined
        };
      } else {
        appointmentData.patient_id = selectedPatientId;
      }

      await onConfirm(request.id, appointmentData);
      onOpenChange(false);
    } catch (e: any) {
      setError(e.message || "Failed to confirm booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Booking Request</DialogTitle>
          <DialogDescription>
            Create an appointment for {request.patient_name}. Staff can override working hours if needed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Service Info */}
          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm text-muted-foreground">Service</p>
            <p className="font-medium">{request.service_name}</p>
            <p className="text-sm text-muted-foreground">Duration: {duration} minutes</p>
          </div>

          {/* Patient Selection */}
          <div className="space-y-2">
            <Label>Patient *</Label>
            <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
              <SelectTrigger>
                <SelectValue placeholder="Select or create patient" />
              </SelectTrigger>
              <SelectContent>
                {matchingPatients.length > 0 && (
                  <>
                    {matchingPatients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.full_name} {patient.phone && `(${patient.phone})`}
                      </SelectItem>
                    ))}
                    <div className="h-px bg-muted my-1" />
                  </>
                )}
                <SelectItem value="NEW_PATIENT" className="text-primary font-medium">
                  ✨ Create New Patient: "{request.patient_name}"
                </SelectItem>
              </SelectContent>
            </Select>
            {selectedPatientId === "NEW_PATIENT" && (
              <p className="text-xs text-muted-foreground pl-1">
                A new patient record will be created automatically using the info from the request.
              </p>
            )}
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label>Appointment Date *</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full pl-3 text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  {selectedDate ? format(selectedDate, "PPP") : "Select date"}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setCalendarOpen(false);
                    setSelectedPeriod("");
                    setStartTime("");
                  }}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Period Selection */}
          <div className="space-y-2">
            <Label>Period *</Label>
            {isLoadingPeriods ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading periods...
              </div>
            ) : periods.length > 0 ? (
              <Select
                value={selectedPeriod}
                onValueChange={(value) => {
                  setSelectedPeriod(value);
                  const pInfo = periods.find((p) => p.period.name === value);
                  if (pInfo?.nextAvailableTime) {
                    setStartTime(pInfo.nextAvailableTime);
                  } else if (pInfo) {
                    setStartTime(pInfo.period.start_time.slice(0, 5));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {periods.map((pInfo) => (
                    <SelectItem
                      key={pInfo.period.id}
                      value={pInfo.period.name}
                      className={pInfo.status === 'full' ? 'text-muted-foreground' : ''}
                    >
                      {pInfo.period.name}
                      {pInfo.status === 'full' ? ' (Fully Booked)' : ` (${pInfo.period.start_time.slice(0, 5)} - ${pInfo.period.end_time.slice(0, 5)})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">No working periods available for this date.</p>
            )}
          </div>

          {/* Time Selection */}
          {selectedPeriod && (
            <div className="space-y-2">
              <Label>Start Time *</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedPatientId || !selectedDate || !selectedPeriod || !startTime}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Appointment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
