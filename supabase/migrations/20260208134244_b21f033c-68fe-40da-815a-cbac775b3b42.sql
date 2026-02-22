-- Create booking_requests table for patient booking submissions
CREATE TABLE public.booking_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_name TEXT NOT NULL,
  contact_info TEXT NOT NULL,
  contact_type TEXT NOT NULL CHECK (contact_type IN ('phone', 'email')),
  service_id UUID REFERENCES public.services(id),
  service_name TEXT NOT NULL,
  requested_date DATE NOT NULL,
  requested_period TEXT NOT NULL CHECK (requested_period IN ('Morning', 'Afternoon', 'Evening', 'Night')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'postponed', 'cancelled')),
  notes TEXT,
  staff_notes TEXT,
  suggested_date DATE,
  suggested_period TEXT,
  confirmed_appointment_id UUID REFERENCES public.appointments(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;

-- Public can insert booking requests (no auth required)
CREATE POLICY "Anyone can create booking requests"
ON public.booking_requests
FOR INSERT
WITH CHECK (true);

-- Approved users can view all booking requests
CREATE POLICY "Approved users can view booking requests"
ON public.booking_requests
FOR SELECT
USING (is_approved(auth.uid()));

-- Approved users can update booking requests
CREATE POLICY "Approved users can update booking requests"
ON public.booking_requests
FOR UPDATE
USING (is_approved(auth.uid()));

-- Approved users can delete booking requests
CREATE POLICY "Approved users can delete booking requests"
ON public.booking_requests
FOR DELETE
USING (is_approved(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_booking_requests_updated_at
BEFORE UPDATE ON public.booking_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Allow public to view active services (for the booking form)
CREATE POLICY "Public can view active services"
ON public.services
FOR SELECT
USING (is_active = true);

-- Allow public to view clinic settings (for marketing page)
CREATE POLICY "Public can view clinic settings"
ON public.clinic_settings
FOR SELECT
USING (true);