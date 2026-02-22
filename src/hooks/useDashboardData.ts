import { useState, useEffect, useCallback } from "react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { AppointmentStatus } from "@/hooks/useAppointments";

interface Patient {
  id: string;
  full_name: string;
  phone: string | null;
  patient_type: "adult" | "child";
  status: "active" | "follow_up" | "archived";
  guardian?: {
    full_name: string;
  } | null;
}

interface Appointment {
  id: string;
  start_time: string;
  period_name: string;
  status: AppointmentStatus;
  patient?: {
    full_name: string;
    date_of_birth: string | null;
  } | null;
  service?: {
    name: string;
  } | null;
}

export function useDashboardData() {
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [weekAppointments, setWeekAppointments] = useState<Appointment[]>([]);
  const [clinicName, setClinicName] = useState("My Clinic");
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const today = new Date();
      const todayStr = format(today, "yyyy-MM-dd");
      const weekStart = format(startOfWeek(today, { weekStartsOn: 0 }), "yyyy-MM-dd");
      const weekEnd = format(endOfWeek(today, { weekStartsOn: 0 }), "yyyy-MM-dd");

      // Fetch all data in parallel
      const [patientsRes, todayRes, weekRes, settingsRes] = await Promise.all([
        // Recent patients
        supabase
          .from("patients")
          .select(`
            id, full_name, phone, patient_type, status,
            guardian:guardians(full_name)
          `)
          .order("created_at", { ascending: false })
          .limit(10),
        
        // Today's appointments
        supabase
          .from("appointments")
          .select(`
            id, start_time, period_name, status,
            patient:patients(full_name, date_of_birth),
            service:services(name)
          `)
          .eq("appointment_date", todayStr)
          .order("start_time"),
        
        // This week's appointments (for completed count)
        supabase
          .from("appointments")
          .select("id, status")
          .gte("appointment_date", weekStart)
          .lte("appointment_date", weekEnd),
        
        // Clinic settings
        supabase
          .from("clinic_settings")
          .select("clinic_name")
          .maybeSingle(),
      ]);

      if (patientsRes.error) throw patientsRes.error;
      if (todayRes.error) throw todayRes.error;
      if (weekRes.error) throw weekRes.error;

      setPatients((patientsRes.data || []) as Patient[]);
      setTodayAppointments((todayRes.data || []) as Appointment[]);
      setWeekAppointments((weekRes.data || []) as Appointment[]);
      
      if (settingsRes.data?.clinic_name) {
        setClinicName(settingsRes.data.clinic_name);
      }
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    patients,
    todayAppointments,
    weekAppointments,
    clinicName,
    isLoading,
    refetch: fetchDashboardData,
  };
}
