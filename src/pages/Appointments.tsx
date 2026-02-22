import { useState, useMemo, useEffect } from "react";
import { format, startOfDay, isToday } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Loader2, AlertCircle, RotateCcw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PeriodSection } from "@/components/appointments/PeriodSection";
import {
  ViewAppointmentDialog,
  ConfirmAppointmentDialog,
  PostponeAppointmentDialog,
  CancelAppointmentDialog,
  DeleteAppointmentDialog,
} from "@/components/appointments/AppointmentDialogs";
import { BookAppointmentDialog } from "@/components/appointments/BookAppointmentDialog";
import { useAppointments, Appointment, AppointmentStatus } from "@/hooks/useAppointments";
import { DisplayAppointment } from "@/types/appointments";
import { formatTimeDisplay } from "@/lib/booking-engine";

export default function Appointments() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<DisplayAppointment | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);

  // Dialog states
  const [isBookDialogOpen, setIsBookDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isPostponeDialogOpen, setIsPostponeDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Use appointments hook
  const {
    appointments,
    workingPeriods,
    isLoading,
    isHoliday,
    getAvailableSlots,
    getPeriodsForDate,
    getAppointmentsForDate,
    updateAppointmentStatus,
    postponeAppointment,
    deleteAppointment,
    refetch,
  } = useAppointments(selectedDate);

  // Transform appointments to display format
  const displayAppointments = useMemo((): DisplayAppointment[] => {
    return appointments.map((apt): DisplayAppointment => ({
      id: apt.id,
      patientName: apt.patient?.full_name || "Unknown Patient",
      patientPhone: apt.patient?.phone,
      service: apt.service?.name || "Unknown Service",
      time: apt.start_time,
      timeLabel: formatTimeDisplay(apt.start_time),
      duration: apt.duration,
      period: apt.period_name,
      status: apt.status,
      notes: apt.notes,
    }));
  }, [appointments]);

  // Group appointments by period
  const appointmentsByPeriod = useMemo((): Record<string, DisplayAppointment[]> => {
    const grouped: Record<string, DisplayAppointment[]> = {};

    // Initialize with all working periods
    for (const period of workingPeriods) {
      grouped[period.name] = [];
    }

    // Add appointments to their periods
    for (const apt of displayAppointments) {
      if (!grouped[apt.period]) {
        grouped[apt.period] = [];
      }
      grouped[apt.period].push(apt);
    }

    // Sort appointments within each period by time
    for (const periodName of Object.keys(grouped)) {
      grouped[periodName].sort((a, b) => a.time.localeCompare(b.time));
    }

    return grouped;
  }, [displayAppointments, workingPeriods]);

  // Get periods in order
  const sortedPeriods = useMemo(() => {
    return [...workingPeriods].sort((a, b) =>
      a.start_time.localeCompare(b.start_time)
    );
  }, [workingPeriods]);

  // Find the original appointment for actions
  const findOriginalAppointment = (id: string): Appointment | undefined => {
    return appointments.find(a => a.id === id);
  };

  // Handlers
  const handleView = (appointment: DisplayAppointment) => {
    setSelectedAppointment(appointment);
    setIsViewDialogOpen(true);
  };

  const handleConfirm = (appointment: DisplayAppointment) => {
    setSelectedAppointment(appointment);
    setSelectedAppointmentId(appointment.id);
    setIsConfirmDialogOpen(true);
  };

  const handlePostpone = (appointment: DisplayAppointment) => {
    setSelectedAppointment(appointment);
    setSelectedAppointmentId(appointment.id);
    setIsPostponeDialogOpen(true);
  };

  const handleCancel = (appointment: DisplayAppointment) => {
    setSelectedAppointment(appointment);
    setSelectedAppointmentId(appointment.id);
    setIsCancelDialogOpen(true);
  };

  const handleDelete = (appointment: DisplayAppointment) => {
    setSelectedAppointment(appointment);
    setSelectedAppointmentId(appointment.id);
    setIsDeleteDialogOpen(true);
  };

  const handleStatusChange = async (appointment: DisplayAppointment, status: AppointmentStatus) => {
    setIsActionLoading(true);
    await updateAppointmentStatus(appointment.id, status);
    setIsActionLoading(false);
  };

  const handleConfirmAction = async () => {
    if (!selectedAppointmentId) return;
    setIsActionLoading(true);
    const success = await updateAppointmentStatus(selectedAppointmentId, "confirmed");
    setIsActionLoading(false);
    if (success) {
      setIsConfirmDialogOpen(false);
    }
  };

  const handleCancelAction = async () => {
    if (!selectedAppointmentId) return;
    setIsActionLoading(true);
    const success = await updateAppointmentStatus(selectedAppointmentId, "cancelled");
    setIsActionLoading(false);
    if (success) {
      setIsCancelDialogOpen(false);
    }
  };

  const handleDeleteAction = async () => {
    if (!selectedAppointmentId) return;
    setIsActionLoading(true);
    const success = await deleteAppointment(selectedAppointmentId);
    setIsActionLoading(false);
    if (success) {
      setIsDeleteDialogOpen(false);
    }
  };

  const handlePostponeAction = async (newDate: Date, newTime: string, periodName: string) => {
    if (!selectedAppointmentId) return;
    setIsActionLoading(true);
    const success = await postponeAppointment(
      selectedAppointmentId,
      format(newDate, "yyyy-MM-dd"),
      newTime,
      periodName
    );
    setIsActionLoading(false);
    if (success) {
      setIsPostponeDialogOpen(false);
    }
  };

  const navigateDate = (direction: "prev" | "next") => {
    setSelectedDate((current) => {
      const newDate = new Date(current);
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
      return newDate;
    });
  };

  // Check availability
  const holidayCheck = isHoliday(selectedDate);
  const isWorkingDay = workingPeriods.length > 0;
  const isPastDate = startOfDay(selectedDate) < startOfDay(new Date()) && !isToday(selectedDate);
  const hasNoAppointments = Object.values(appointmentsByPeriod).every(
    (appointments) => appointments.length === 0
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Appointments"
        description="View and manage daily appointments."
        actions={
          <div className="flex items-center gap-3">
            {/* Date Navigation */}
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={() => navigateDate("prev")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="min-w-[220px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, "EEEE, MMMM d, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              {!isToday(selectedDate) && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedDate(new Date())}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Go to today</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <Button variant="outline" size="icon" onClick={() => navigateDate("next")}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Book Appointment Button */}
            <Button onClick={() => setIsBookDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Book Appointment
            </Button>
          </div>
        }
      />

      {/* Loading State */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <Loader2 className="mb-4 h-12 w-12 animate-spin text-muted-foreground" />
          <h3 className="text-lg font-medium">Loading appointments...</h3>
        </div>
      ) : holidayCheck.isHoliday ? (
        /* Holiday State */
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-medium">Clinic Closed</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {holidayCheck.note || "This date is marked as a holiday."}
          </p>
        </div>
      ) : !isWorkingDay ? (
        /* Non-Working Day State */
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <CalendarIcon className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-medium">Not a Working Day</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            No working periods are configured for this day.
          </p>
        </div>
      ) : hasNoAppointments ? (
        /* Empty State for Entire Day */
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <CalendarIcon className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-medium">No appointments for this day</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {isPastDate
              ? "This is a past date."
              : "Click \"Book Appointment\" to schedule a new appointment."}
          </p>
        </div>
      ) : (
        /* Period Sections */
        <div className="space-y-6">
          {sortedPeriods.map((period) => (
            <PeriodSection
              key={period.id}
              period={period.name}
              appointments={appointmentsByPeriod[period.name] || []}
              onView={handleView}
              onConfirm={handleConfirm}
              onPostpone={handlePostpone}
              onCancel={handleCancel}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <BookAppointmentDialog
        open={isBookDialogOpen}
        onOpenChange={setIsBookDialogOpen}
        initialDate={new Date()}
        onSuccess={refetch}
      />

      <ViewAppointmentDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        appointment={selectedAppointment}
        selectedDate={selectedDate}
      />

      <ConfirmAppointmentDialog
        open={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        appointment={selectedAppointment}
        onConfirm={handleConfirmAction}
        isLoading={isActionLoading}
      />

      <PostponeAppointmentDialog
        open={isPostponeDialogOpen}
        onOpenChange={setIsPostponeDialogOpen}
        appointment={selectedAppointment}
        onPostpone={handlePostponeAction}
        isLoading={isActionLoading}
        getPeriodsForDate={getPeriodsForDate}
        getAppointmentsForDate={getAppointmentsForDate}
        isHoliday={isHoliday}
      />

      <CancelAppointmentDialog
        open={isCancelDialogOpen}
        onOpenChange={setIsCancelDialogOpen}
        appointment={selectedAppointment}
        onCancel={handleCancelAction}
        isLoading={isActionLoading}
      />

      <DeleteAppointmentDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        appointment={selectedAppointment}
        onDelete={handleDeleteAction}
        isLoading={isActionLoading}
      />
    </div>
  );
}
