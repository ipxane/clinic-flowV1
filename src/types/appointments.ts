import type { AppointmentStatus } from "@/hooks/useAppointments";

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

export type Period = string; // Dynamic based on settings

// For display purposes
export interface DisplayAppointment {
  id: string;
  patientName: string;
  patientPhone?: string | null;
  service: string;
  time: string;
  timeLabel: string;
  duration: number;
  period: string;
  status: AppointmentStatus;
  notes?: string | null;
}
