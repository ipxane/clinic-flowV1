-- Create enum for holiday types
CREATE TYPE public.holiday_type AS ENUM ('holiday', 'closed', 'special');

-- Clinic Settings table (singleton - stores general settings)
CREATE TABLE public.clinic_settings (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_name TEXT NOT NULL DEFAULT 'My Clinic',
    clinic_description TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    logo_url TEXT,
    booking_range_days INTEGER NOT NULL DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Working Days table (7 rows - one per day)
CREATE TABLE public.working_days (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    day_name TEXT NOT NULL,
    is_working BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(day_of_week)
);

-- Working Periods table (multiple periods per day)
CREATE TABLE public.working_periods (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    working_day_id uuid NOT NULL REFERENCES public.working_days(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CHECK (end_time > start_time)
);

-- Holidays table
CREATE TABLE public.holidays (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    type public.holiday_type NOT NULL DEFAULT 'holiday',
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(date)
);

-- Enable RLS on all tables
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.working_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.working_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

-- RLS policies for clinic_settings
CREATE POLICY "Allow all operations on clinic_settings"
ON public.clinic_settings
FOR ALL
USING (true)
WITH CHECK (true);

-- RLS policies for working_days
CREATE POLICY "Allow all operations on working_days"
ON public.working_days
FOR ALL
USING (true)
WITH CHECK (true);

-- RLS policies for working_periods
CREATE POLICY "Allow all operations on working_periods"
ON public.working_periods
FOR ALL
USING (true)
WITH CHECK (true);

-- RLS policies for holidays
CREATE POLICY "Allow all operations on holidays"
ON public.holidays
FOR ALL
USING (true)
WITH CHECK (true);

-- Add triggers for updated_at
CREATE TRIGGER update_clinic_settings_updated_at
    BEFORE UPDATE ON public.clinic_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_working_days_updated_at
    BEFORE UPDATE ON public.working_days
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_working_periods_updated_at
    BEFORE UPDATE ON public.working_periods
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_holidays_updated_at
    BEFORE UPDATE ON public.holidays
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_working_periods_day ON public.working_periods(working_day_id);
CREATE INDEX idx_holidays_date ON public.holidays(date);

-- Insert default working days
INSERT INTO public.working_days (day_of_week, day_name, is_working) VALUES
    (0, 'Sunday', false),
    (1, 'Monday', true),
    (2, 'Tuesday', true),
    (3, 'Wednesday', true),
    (4, 'Thursday', true),
    (5, 'Friday', true),
    (6, 'Saturday', false);

-- Insert default clinic settings (singleton)
INSERT INTO public.clinic_settings (clinic_name, booking_range_days) VALUES
    ('My Clinic', 30);

-- Insert default periods for working days
INSERT INTO public.working_periods (working_day_id, name, start_time, end_time)
SELECT id, 'Morning', '09:00:00', '12:00:00' FROM public.working_days WHERE is_working = true;

INSERT INTO public.working_periods (working_day_id, name, start_time, end_time)
SELECT id, 'Afternoon', '14:00:00', '18:00:00' FROM public.working_days WHERE is_working = true;