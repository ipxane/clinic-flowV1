import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { findOrCreatePatient } from "@/lib/patient-utils";
import {
  validateBooking,
  Appointment as BookingAppointment,
  WorkingPeriod,
  Holiday
} from "@/lib/booking-engine";

export type BookingRequestStatus = "pending" | "confirmed" | "postponed" | "cancelled";

export interface BookingRequest {
  id: string;
  patient_name: string;
  patient_type: "adult" | "child";
  date_of_birth: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  guardian_email: string | null;
  contact_info: string;
  contact_type: "phone" | "email";
  service_id: string | null;
  service_name: string;
  requested_date: string;
  requested_period: string;
  status: BookingRequestStatus;
  notes: string | null;
  staff_notes: string | null;
  suggested_date: string | null;
  suggested_period: string | null;
  confirmed_appointment_id: string | null;
  created_at: string;
  updated_at: string;
  is_new?: boolean; // Temporary flag for UI highlighting
}

export interface CreateBookingRequest {
  patient_name: string;
  patient_type: "adult" | "child";
  date_of_birth: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string | null;
  contact_info: string;
  contact_type: "phone" | "email";
  service_id: string | null;
  service_name: string;
  requested_date: string;
  requested_period: 'Morning' | 'Afternoon' | 'Evening' | 'Night';
  notes?: string | null;
  status?: BookingRequestStatus;
}

export function useBookingRequests() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'booking_requests'
        },
        (payload) => {
          const newRequest = payload.new as BookingRequest;

          // Update the cache immediately
          queryClient.setQueryData(['bookingRequests'], (oldData: BookingRequest[] | undefined) => {
            if (!oldData) return [newRequest];
            // Avoid duplicates if any race condition occurs
            if (oldData.some(r => r.id === newRequest.id)) return oldData;
            return [{ ...newRequest, is_new: true }, ...oldData];
          });

          // Dispatch custom event for notifications
          window.dispatchEvent(new CustomEvent('new-booking-request', { detail: newRequest }));

          toast({
            title: "New Booking Request",
            description: `From ${newRequest.patient_name} for ${newRequest.service_name}`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, toast]);

  // Fetch all booking requests
  const {
    data: bookingRequests = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["bookingRequests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as BookingRequest[];
    },
  });

  // Create a new booking request (public - no auth required)
  const createBookingRequest = useMutation({
    mutationFn: async (request: CreateBookingRequest) => {
      const { data, error } = await supabase
        .from("booking_requests")
        .insert(request)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookingRequests"] });
    },
  });

  // Update booking request status
  const updateBookingRequest = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<BookingRequest>;
    }) => {
      const { data, error } = await supabase
        .from("booking_requests")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookingRequests"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Confirm a booking request (creates an appointment)
  const confirmBookingRequest = async (
    requestId: string,
    appointmentData: {
      patient_id?: string; // Optional if we need to create patient
      service_id: string;
      appointment_date: string;
      start_time: string;
      end_time: string;
      duration: number;
      period_name: string;
      notes?: string;
      // Optional patient details for auto-creation
      patient_details?: {
        full_name: string;
        phone: string;
        date_of_birth?: string | null;
        patient_type?: "adult" | "child";
        guardian_details?: {
          full_name: string;
          phone: string;
          email?: string | null;
        };
      };
    }
  ) => {
    console.group(`Confirming Booking Request: ${requestId}`);
    console.log("Appointment Data:", appointmentData);

    try {
      let finalPatientId = appointmentData.patient_id;

      // 1. Availability Pre-Check (Atomic-style)
      console.log("Performing availability pre-check...");

      const dateStr = appointmentData.appointment_date;
      const dayOfWeek = new Date(dateStr).getDay();

      // Fetch current data for the date to ensure no race condition
      const [
        { data: currentAppointments },
        { data: workingDay },
        { data: holidays }
      ] = await Promise.all([
        supabase.from("appointments").select("*").eq("appointment_date", dateStr),
        supabase.from("working_days").select("*, working_periods(*)").eq("day_of_week", dayOfWeek).maybeSingle(),
        supabase.from("holidays").select("*")
      ]);

      const periods = (workingDay?.working_periods || []).map(p => ({
        ...p,
        day_of_week: dayOfWeek
      })) as WorkingPeriod[];
      const bookingAppointments = (currentAppointments || []) as BookingAppointment[];
      const holidayList = (holidays || []) as Holiday[];

      const validation = validateBooking(
        dateStr,
        appointmentData.start_time,
        appointmentData.duration,
        periods,
        holidayList,
        bookingAppointments,
        [], // Additional services usually not used in staff confirm
        'INTERNAL' // Staff bypasses some public restrictions
      );

      if (!validation.isValid) {
        console.warn("Availability check failed:", validation.errors);
        throw new Error(`Slot is no longer available: ${validation.errors.join(", ")}`);
      }

      console.log("Availability check passed.");

      // 2. Patient Resolution
      if (!finalPatientId && appointmentData.patient_details) {
        console.log("Resolving patient identity...");
        const { patientId } = await findOrCreatePatient({
          full_name: appointmentData.patient_details.full_name,
          phone: appointmentData.patient_details.phone,
          date_of_birth: appointmentData.patient_details.date_of_birth,
          patient_type: appointmentData.patient_details.patient_type || "adult",
          guardian_details: appointmentData.patient_details.guardian_details,
        });
        finalPatientId = patientId;
        console.log(`Patient resolved: ${finalPatientId}`);
      }

      if (!finalPatientId) {
        throw new Error("Patient ID or details are required to confirm booking");
      }

      // 3. Create the appointment
      console.log("Creating appointment record...");
      const { data: appointment, error: appointmentError } = await supabase
        .from("appointments")
        .insert({
          patient_id: finalPatientId,
          service_id: appointmentData.service_id,
          appointment_date: appointmentData.appointment_date,
          start_time: appointmentData.start_time,
          end_time: appointmentData.end_time,
          duration: appointmentData.duration,
          period_name: appointmentData.period_name,
          notes: appointmentData.notes,
          status: "confirmed",
        })
        .select()
        .single();

      if (appointmentError) {
        console.error("Supabase Appointment Error:", appointmentError);
        throw appointmentError;
      }

      console.log(`Appointment created: ${appointment.id}`);

      // 4. Update the booking request
      console.log("Updating booking request status...");
      const { error: requestError } = await supabase
        .from("booking_requests")
        .update({
          status: "confirmed",
          confirmed_appointment_id: appointment.id,
        })
        .eq("id", requestId);

      if (requestError) {
        console.error("Supabase Booking Request Error:", requestError);
        throw requestError;
      }

      console.log("Booking request confirmed successfully.");

      queryClient.invalidateQueries({ queryKey: ["bookingRequests"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });

      toast({
        title: "Booking Confirmed",
        description: "Appointment has been created successfully.",
      });

      console.groupEnd();
      return appointment;
    } catch (error: any) {
      console.error("Confirmation Flow Internal Error:", error);
      console.groupEnd();
      toast({
        title: "Confirmation Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Postpone a booking request
  const postponeBookingRequest = async (
    requestId: string,
    suggestedDate?: string,
    suggestedPeriod?: string,
    staffNotes?: string
  ) => {
    try {
      const { error } = await supabase
        .from("booking_requests")
        .update({
          status: "postponed",
          suggested_date: suggestedDate || null,
          suggested_period: suggestedPeriod || null,
          staff_notes: staffNotes || null,
        })
        .eq("id", requestId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["bookingRequests"] });

      toast({
        title: "Request Postponed",
        description: "The booking request has been postponed.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Cancel a booking request
  const cancelBookingRequest = async (requestId: string, staffNotes?: string) => {
    try {
      const { error } = await supabase
        .from("booking_requests")
        .update({
          status: "cancelled",
          staff_notes: staffNotes || null,
        })
        .eq("id", requestId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["bookingRequests"] });

      toast({
        title: "Request Cancelled",
        description: "The booking request has been cancelled.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Delete a booking request permanently
  const deleteBookingRequest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("booking_requests")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookingRequests"] });
      toast({
        title: "Request Deleted",
        description: "The booking request has been permanently deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    bookingRequests,
    isLoading,
    error,
    refetch,
    createBookingRequest,
    updateBookingRequest,
    confirmBookingRequest,
    postponeBookingRequest,
    cancelBookingRequest,
    deleteBookingRequest,
  };
}

// Hook for public use (no auth required) - fetches services and clinic settings
export function usePublicBooking() {
  const { toast } = useToast();

  // Fetch active services (public)
  const { data: services = [], isLoading: isLoadingServices } = useQuery({
    queryKey: ["publicServices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id, name, duration")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  // Fetch clinic settings (public)
  const { data: clinicSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["publicClinicSettings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinic_settings")
        .select("*")
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
  });

  // Submit booking request
  const submitBookingRequest = async (request: CreateBookingRequest) => {
    try {
      const { error } = await supabase
        .from("booking_requests")
        .insert(request);

      if (error) throw error;

      toast({
        title: "Request Submitted",
        description: "Your booking request has been submitted. We will contact you shortly.",
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit booking request.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    services,
    clinicSettings,
    isLoading: isLoadingServices || isLoadingSettings,
    submitBookingRequest,
  };
}
