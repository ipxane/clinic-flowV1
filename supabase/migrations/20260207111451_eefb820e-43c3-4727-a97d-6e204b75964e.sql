-- Add booking_range_enabled column to clinic_settings
ALTER TABLE public.clinic_settings 
ADD COLUMN booking_range_enabled boolean NOT NULL DEFAULT true;