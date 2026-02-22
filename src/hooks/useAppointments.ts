import { useState, useEffect, useCallback } from "react";
import { format, startOfDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  generateTimeSlots,
  calculateEndTime,
  formatTimeDisplay,
  WorkingPeriod,
  Appointment as BookingAppointment,
  TimeSlot,
} from "@/lib/booking-engine";
import { suggestNextAvailableDate } from "@/lib/booking-engine"; // Added for additional availability logic
import type { Database } from "@/integrations/supabase/types";

// Types
export type AppointmentStatus = Database["public"]["Enums"]["appointment_status"];

export interface Appointment {
  id: string;
  patient_id: string;
  service_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  duration: number;
  period_name: string;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  patient?: {
    id: string;
    full_name: string;
    phone: string | null;
    email: string | null;
  };
  service?: {
    id: string;
    name: string;
    duration: number;
    price: number;
  };
}

export interface CreateAppointmentData {
  patient_id: string;
  service_id: string;
  appointment_date: string;
  start_time: string;
  duration: number;
  period_name: string;
  notes?: string;
  status?: AppointmentStatus;
}

export interface DayAvailability {
  date: Date;
  isWorkingDay: boolean;
  isHoliday: boolean;
  holidayNote?: string;
  periods: WorkingPeriod[];
  appointments: Appointment[];
  availableSlots: TimeSlot[];
}

export function useAppointments(selectedDate?: Date) {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [workingPeriods, setWorkingPeriods] = useState<WorkingPeriod[]>([]);
  const [holidays, setHolidays] = useState<{ date: string; type: string; note: string | null }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch appointments for a specific date
  const fetchAppointments = useCallback(async (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");

    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          patient:patients(id, full_name, phone, email),
          service:services(id, name, duration, price)
        `)
        .eq("appointment_date", dateStr)
        .order("start_time", { ascending: true });

      if (error) throw error;
      return (data || []) as Appointment[];
    } catch (error: any) {
      console.error("Error fetching appointments:", error);
      toast({
        title: "Error",
        description: "Failed to load appointments",
        variant: "destructive",
      });
      return [];
    }
  }, [toast]);

  // Fetch working periods for a specific day of week
  const fetchWorkingPeriods = useCallback(async (dayOfWeek: number) => {
    try {
      // Get working day
      const { data: dayData, error: dayError } = await supabase
        .from("working_days")
        .select("*")
        .eq("day_of_week", dayOfWeek)
        .maybeSingle();

      if (dayError) throw dayError;

      if (!dayData || !dayData.is_working) {
        return [];
      }

      // Get periods for this day
      const { data: periodsData, error: periodsError } = await supabase
        .from("working_periods")
        .select("*")
        .eq("working_day_id", dayData.id)
        .order("start_time");

      if (periodsError) throw periodsError;

      // Map periods and inject day_of_week for engine compatibility
      return (periodsData || []).map(p => ({
        ...p,
        day_of_week: dayOfWeek
      })) as WorkingPeriod[];
    } catch (error: any) {
      console.error("Error fetching working periods:", error);
      return [];
    }
  }, []);

  // Check if date is a holiday
  const fetchHolidays = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("holidays")
        .select("date, type, note");

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error("Error fetching holidays:", error);
      return [];
    }
  }, []);

  // Main data loading
  const loadDayData = useCallback(async (date: Date) => {
    setIsLoading(true);

    try {
      const dayOfWeek = date.getDay();

      const [appointmentsData, periodsData, holidaysData] = await Promise.all([
        fetchAppointments(date),
        fetchWorkingPeriods(dayOfWeek),
        fetchHolidays(),
      ]);

      setAppointments(appointmentsData);
      setWorkingPeriods(periodsData);
      setHolidays(holidaysData);
    } finally {
      setIsLoading(false);
    }
  }, [fetchAppointments, fetchWorkingPeriods, fetchHolidays]);

  // Load data when selected date changes
  useEffect(() => {
    if (selectedDate) {
      loadDayData(selectedDate);
    }
  }, [selectedDate, loadDayData]);

  // Check if a specific date is a holiday
  const isHoliday = useCallback((date: Date): { isHoliday: boolean; note?: string } => {
    const dateStr = format(date, "yyyy-MM-dd");
    const holiday = holidays.find(h => h.date === dateStr);

    if (holiday && (holiday.type === "holiday" || holiday.type === "closed")) {
      return { isHoliday: true, note: holiday.note || undefined };
    }
    return { isHoliday: false };
  }, [holidays]);

  // Get available time slots for a service
  const getAvailableSlots = useCallback((
    serviceDuration: number,
    forDate?: Date
  ): TimeSlot[] => {
    const date = forDate || selectedDate || new Date();
    const dateStr = format(date, "yyyy-MM-dd");

    // Check if holiday using our fetches (kept for state-based reactivity)
    const holidayCheck = isHoliday(date);
    if (holidayCheck.isHoliday) {
      return [];
    }

    // Check if working day
    if (workingPeriods.length === 0) {
      return [];
    }

    // Modern engine expects BookingAppointment type
    const bookingAppointments: BookingAppointment[] = appointments.map(apt => ({
      id: apt.id,
      appointment_date: apt.appointment_date,
      start_time: apt.start_time,
      end_time: apt.end_time,
      service_id: apt.service_id,
      status: apt.status as BookingAppointment["status"],
    }));

    // generateTimeSlots from booking-engine returns { time, available, reason? }
    // We map it to include 'label' for the dashboard UI
    const slots = workingPeriods.flatMap(period => {
      const periodSlots = generateTimeSlots(
        period,
        bookingAppointments,
        [], // No extra services needed for conflict check here
        serviceDuration,
        dateStr
      );

      return periodSlots.map(slot => ({
        ...slot,
        label: formatTimeDisplay(slot.time)
      }));
    });

    return slots;
  }, [selectedDate, workingPeriods, appointments, isHoliday]);

  // Get first available slot
  const getNextAvailable = useCallback((
    serviceDuration: number,
    forDate?: Date
  ): { time: string; periodName: string; label: string } | null => {
    const slots = getAvailableSlots(serviceDuration, forDate);
    const firstAvailable = slots.find(s => s.available);

    if (firstAvailable) {
      // Find which period it belongs to
      const date = forDate || selectedDate || new Date();
      const timeStr = firstAvailable.time;
      const period = workingPeriods.find(p => {
        const t = timeStr.split(':').map(Number);
        const start = p.start_time.split(':').map(Number);
        const end = p.end_time.split(':').map(Number);
        const tMin = t[0] * 60 + t[1];
        const sMin = start[0] * 60 + start[1];
        const eMin = end[0] * 60 + end[1];
        return tMin >= sMin && tMin < eMin;
      });

      return {
        time: firstAvailable.time,
        periodName: period?.name || "Working Period",
        label: firstAvailable.label
      };
    }

    return null;
  }, [getAvailableSlots, selectedDate, workingPeriods]);

  // Create appointment
  const createAppointment = async (data: CreateAppointmentData): Promise<boolean> => {
    try {
      const endTime = calculateEndTime(data.start_time, data.duration);

      const { error } = await supabase
        .from("appointments")
        .insert({
          patient_id: data.patient_id,
          service_id: data.service_id,
          appointment_date: data.appointment_date,
          start_time: data.start_time,
          end_time: endTime,
          duration: data.duration,
          period_name: data.period_name,
          status: data.status || "pending",
          notes: data.notes || null,
        });

      if (error) {
        if (error.message.includes("overlaps")) {
          toast({
            title: "Time Slot Unavailable",
            description: "This time slot conflicts with an existing appointment. Please select a different time.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return false;
      }

      toast({
        title: "Appointment Booked",
        description: `Appointment scheduled for ${formatTimeDisplay(data.start_time)}`,
      });

      // Refresh appointments
      if (selectedDate) {
        const refreshed = await fetchAppointments(selectedDate);
        setAppointments(refreshed);
      }

      return true;
    } catch (error: any) {
      console.error("Error creating appointment:", error);
      toast({
        title: "Error",
        description: "Failed to create appointment. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Update appointment (edit time, service, or other fields)
  const updateAppointment = async (
    appointmentId: string,
    data: {
      service_id?: string;
      start_time?: string;
      duration?: number;
      period_name?: string;
      notes?: string;
      appointment_date?: string;
    }
  ): Promise<boolean> => {
    try {
      const updateData: Record<string, any> = { ...data };

      // If time or duration changed, recalculate end_time
      if (data.start_time || data.duration) {
        const appointment = appointments.find(a => a.id === appointmentId);
        if (appointment) {
          const startTime = data.start_time || appointment.start_time;
          const duration = data.duration || appointment.duration;
          updateData.end_time = calculateEndTime(startTime, duration);
        }
      }

      const { error } = await supabase
        .from("appointments")
        .update(updateData)
        .eq("id", appointmentId);

      if (error) {
        if (error.message.includes("overlaps")) {
          toast({
            title: "Time Slot Unavailable",
            description: "This time slot conflicts with an existing appointment.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return false;
      }

      toast({
        title: "Appointment Updated",
        description: "The appointment has been updated successfully.",
      });

      // Refresh appointments
      if (selectedDate) {
        const refreshed = await fetchAppointments(selectedDate);
        setAppointments(refreshed);
      }

      return true;
    } catch (error: any) {
      console.error("Error updating appointment:", error);
      toast({
        title: "Error",
        description: "Failed to update appointment. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Update appointment status
  const updateAppointmentStatus = async (
    appointmentId: string,
    status: AppointmentStatus
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status })
        .eq("id", appointmentId);

      if (error) throw error;

      // Update local state
      setAppointments(prev =>
        prev.map(apt =>
          apt.id === appointmentId ? { ...apt, status } : apt
        )
      );

      const statusLabels: Record<AppointmentStatus, string> = {
        pending: "Pending",
        confirmed: "Confirmed",
        postponed: "Rescheduled",
        cancelled: "Cancelled",
        completed: "Completed",
        no_show: "No-Show",
      };

      toast({
        title: "Status Updated",
        description: `Appointment marked as ${statusLabels[status]}`,
      });

      return true;
    } catch (error: any) {
      console.error("Error updating appointment:", error);
      toast({
        title: "Error",
        description: "Failed to update appointment status",
        variant: "destructive",
      });
      return false;
    }
  };

  // Postpone appointment (reschedule)
  const postponeAppointment = async (
    appointmentId: string,
    newDate: string,
    newTime: string,
    newPeriodName: string
  ): Promise<boolean> => {
    try {
      const appointment = appointments.find(a => a.id === appointmentId);
      if (!appointment) return false;

      const endTime = calculateEndTime(newTime, appointment.duration);

      const { error } = await supabase
        .from("appointments")
        .update({
          appointment_date: newDate,
          start_time: newTime,
          end_time: endTime,
          period_name: newPeriodName,
          status: "postponed",
        })
        .eq("id", appointmentId);

      if (error) {
        if (error.message.includes("overlaps")) {
          toast({
            title: "Time Slot Unavailable",
            description: "The new time slot conflicts with an existing appointment.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return false;
      }

      toast({
        title: "Appointment Rescheduled",
        description: `Appointment moved to ${format(new Date(newDate), "MMM d")} at ${formatTimeDisplay(newTime)}`,
      });

      // Refresh appointments
      if (selectedDate) {
        const refreshed = await fetchAppointments(selectedDate);
        setAppointments(refreshed);
      }

      return true;
    } catch (error: any) {
      console.error("Error postponing appointment:", error);
      toast({
        title: "Error",
        description: "Failed to reschedule appointment",
        variant: "destructive",
      });
      return false;
    }
  };

  // Delete appointment (permanent removal)
  const deleteAppointment = async (appointmentId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", appointmentId);

      if (error) throw error;

      // Update local state
      setAppointments(prev => prev.filter(apt => apt.id !== appointmentId));

      toast({
        title: "Appointment Deleted",
        description: "The appointment has been permanently removed.",
      });

      return true;
    } catch (error: any) {
      console.error("Error deleting appointment:", error);
      toast({
        title: "Error",
        description: "Failed to delete appointment",
        variant: "destructive",
      });
      return false;
    }
  };

  // Group appointments by period
  const appointmentsByPeriod = useCallback((): Record<string, Appointment[]> => {
    const grouped: Record<string, Appointment[]> = {};

    // Initialize with all working periods
    for (const period of workingPeriods) {
      grouped[period.name] = [];
    }

    // Add appointments to their periods
    for (const apt of appointments) {
      if (!grouped[apt.period_name]) {
        grouped[apt.period_name] = [];
      }
      grouped[apt.period_name].push(apt);
    }

    return grouped;
  }, [appointments, workingPeriods]);

  // Get appointments for a different date (for rescheduling) - memoized to prevent infinite loops
  const getAppointmentsForDate = useCallback(async (date: Date) => {
    return fetchAppointments(date);
  }, [fetchAppointments]);

  // Get working periods for a specific date - memoized to prevent infinite loops
  const getPeriodsForDate = useCallback(async (date: Date) => {
    const dayOfWeek = date.getDay();
    return fetchWorkingPeriods(dayOfWeek);
  }, [fetchWorkingPeriods]);

  return {
    appointments,
    workingPeriods,
    holidays,
    isLoading,
    isHoliday,
    getAvailableSlots,
    getNextAvailable,
    createAppointment,
    updateAppointment,
    updateAppointmentStatus,
    postponeAppointment,
    deleteAppointment,
    appointmentsByPeriod,
    getAppointmentsForDate,
    getPeriodsForDate,
    refetch: () => selectedDate && loadDayData(selectedDate),
  };
}
