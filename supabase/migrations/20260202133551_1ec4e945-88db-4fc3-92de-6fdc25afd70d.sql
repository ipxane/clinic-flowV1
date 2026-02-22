-- Create appointment status enum
CREATE TYPE public.appointment_status AS ENUM ('pending', 'confirmed', 'postponed', 'cancelled', 'completed');

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  appointment_date DATE NOT NULL,
  start_time TIME WITHOUT TIME ZONE NOT NULL,
  end_time TIME WITHOUT TIME ZONE NOT NULL,
  duration INTEGER NOT NULL, -- in minutes, denormalized for convenience
  period_name TEXT NOT NULL, -- e.g., 'Morning', 'Afternoon'
  status public.appointment_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for date-based queries
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_appointments_date_status ON public.appointments(appointment_date, status);
CREATE INDEX idx_appointments_patient ON public.appointments(patient_id);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Create policy for staff access
CREATE POLICY "Allow all operations on appointments"
ON public.appointments
FOR ALL
USING (true)
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add constraint to prevent overlapping appointments
-- This is implemented as a function for more complex overlap checking
CREATE OR REPLACE FUNCTION public.check_appointment_overlap()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there's any overlapping appointment on the same date
  -- that is not cancelled
  IF EXISTS (
    SELECT 1 FROM public.appointments
    WHERE appointment_date = NEW.appointment_date
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND status NOT IN ('cancelled')
      AND (
        (NEW.start_time >= start_time AND NEW.start_time < end_time)
        OR (NEW.end_time > start_time AND NEW.end_time <= end_time)
        OR (NEW.start_time <= start_time AND NEW.end_time >= end_time)
      )
  ) THEN
    RAISE EXCEPTION 'Appointment time overlaps with existing appointment';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER check_appointment_overlap_trigger
BEFORE INSERT OR UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.check_appointment_overlap();