-- ==========================================
-- CONSOLIDATED SUPABASE SCHEMA
-- Generated: 2026-02-15
-- Goal: Recreate the full production database from scratch
-- ==========================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS & TYPES
CREATE TYPE public.patient_type AS ENUM ('adult', 'child');
CREATE TYPE public.patient_status AS ENUM ('active', 'follow_up', 'archived');
CREATE TYPE public.holiday_type AS ENUM ('holiday', 'closed', 'special', 'long_holiday', 'recurring_annual');
CREATE TYPE public.appointment_status AS ENUM ('pending', 'confirmed', 'postponed', 'cancelled', 'completed', 'no_show');
CREATE TYPE public.app_role AS ENUM ('admin', 'doctor', 'staff', 'pending');

-- 3. TABLES

-- Guardians (for child patients)
CREATE TABLE public.guardians (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    phone VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Patients
CREATE TABLE public.patients (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_type public.patient_type NOT NULL DEFAULT 'adult',
    status public.patient_status NOT NULL DEFAULT 'active',
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    date_of_birth DATE,
    notes TEXT,
    guardian_id UUID REFERENCES public.guardians(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT unique_adult_phone UNIQUE (phone),
    CONSTRAINT adult_requires_phone CHECK (
        (patient_type = 'child') OR 
        (patient_type = 'adult' AND phone IS NOT NULL)
    ),
    CONSTRAINT child_requires_guardian CHECK (
        (patient_type = 'adult') OR 
        (patient_type = 'child' AND guardian_id IS NOT NULL)
    ),
    CONSTRAINT child_requires_dob CHECK (
        (patient_type = 'adult') OR 
        (patient_type = 'child' AND date_of_birth IS NOT NULL)
    )
);

-- Services
CREATE TABLE public.services (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    duration INTEGER NOT NULL,
    description TEXT,
    category VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Clinic Settings
CREATE TABLE public.clinic_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_name TEXT NOT NULL DEFAULT 'My Clinic',
    clinic_description TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    logo_url TEXT,
    booking_range_days INTEGER NOT NULL DEFAULT 30,
    booking_range_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Working Days
CREATE TABLE public.working_days (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    day_name TEXT NOT NULL,
    is_working BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(day_of_week)
);

-- Working Periods
CREATE TABLE public.working_periods (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    working_day_id UUID NOT NULL REFERENCES public.working_days(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CHECK (end_time > start_time)
);

-- Holidays
CREATE TABLE public.holidays (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    type public.holiday_type NOT NULL DEFAULT 'holiday',
    note TEXT,
    start_date DATE,
    end_date DATE,
    recurring_start_month INTEGER,
    recurring_start_day INTEGER,
    recurring_end_month INTEGER,
    recurring_end_day INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(date)
);

-- Appointments
CREATE TABLE public.appointments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
    appointment_date DATE NOT NULL,
    start_time TIME WITHOUT TIME ZONE NOT NULL,
    end_time TIME WITHOUT TIME ZONE NOT NULL,
    duration INTEGER NOT NULL,
    period_name TEXT NOT NULL,
    status public.appointment_status NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User Roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Booking Requests
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

-- 4. FUNCTIONS

-- Timestamp Update Function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Check Appointment Overlap
CREATE OR REPLACE FUNCTION public.check_appointment_overlap()
RETURNS TRIGGER AS $$
BEGIN
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

-- Role Check Functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin')
$$;

CREATE OR REPLACE FUNCTION public.is_approved(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.profiles p ON p.user_id = ur.user_id
    WHERE ur.user_id = _user_id AND ur.role != 'pending' AND p.is_approved = true
  )
$$;

CREATE OR REPLACE FUNCTION public.is_first_user()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles LIMIT 1)
$$;

-- New User Trigger Handler
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_first BOOLEAN;
BEGIN
  SELECT public.is_first_user() INTO is_first;
  INSERT INTO public.profiles (user_id, email, full_name, is_approved)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), is_first);
  IF is_first THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'pending');
  END IF;
  RETURN NEW;
END;
$$;

-- 5. TRIGGERS

-- Timestamp Triggers
CREATE TRIGGER update_guardians_updated_at BEFORE UPDATE ON public.guardians FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clinic_settings_updated_at BEFORE UPDATE ON public.clinic_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_working_days_updated_at BEFORE UPDATE ON public.working_days FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_working_periods_updated_at BEFORE UPDATE ON public.working_periods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_holidays_updated_at BEFORE UPDATE ON public.holidays FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_booking_requests_updated_at BEFORE UPDATE ON public.booking_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Overlap Check Trigger
CREATE TRIGGER check_appointment_overlap_trigger BEFORE INSERT OR UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.check_appointment_overlap();

-- Auth Signup Trigger
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. INDEXES
CREATE INDEX idx_patients_phone ON public.patients(phone);
CREATE INDEX idx_patients_status ON public.patients(status);
CREATE INDEX idx_patients_type ON public.patients(patient_type);
CREATE INDEX idx_patients_guardian ON public.patients(guardian_id);
CREATE INDEX idx_guardians_phone ON public.guardians(phone);
CREATE INDEX idx_services_category ON public.services(category);
CREATE INDEX idx_services_is_active ON public.services(is_active);
CREATE INDEX idx_working_periods_day ON public.working_periods(working_day_id);
CREATE INDEX idx_holidays_date ON public.holidays(date);
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_appointments_date_status ON public.appointments(appointment_date, status);
CREATE INDEX idx_appointments_patient ON public.appointments(patient_id);

-- 7. RLS POLICIES
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.working_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.working_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE USING (public.is_admin(auth.uid()));

-- User Roles
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.is_admin(auth.uid()));

-- Appointments
CREATE POLICY "Approved users can view appointments" ON public.appointments FOR SELECT USING (public.is_approved(auth.uid()));
CREATE POLICY "Approved users can create appointments" ON public.appointments FOR INSERT WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "Approved users can update appointments" ON public.appointments FOR UPDATE USING (public.is_approved(auth.uid()));
CREATE POLICY "Approved users can delete appointments" ON public.appointments FOR DELETE USING (public.is_approved(auth.uid()));

-- Patients & Guardians
CREATE POLICY "Approved users can view patients" ON public.patients FOR SELECT USING (public.is_approved(auth.uid()));
CREATE POLICY "Approved users can manage patients" ON public.patients FOR ALL USING (public.is_approved(auth.uid()));
CREATE POLICY "Approved users can view guardians" ON public.guardians FOR SELECT USING (public.is_approved(auth.uid()));
CREATE POLICY "Approved users can manage guardians" ON public.guardians FOR ALL USING (public.is_approved(auth.uid()));

-- Services
CREATE POLICY "Approved users can view services" ON public.services FOR SELECT USING (public.is_approved(auth.uid()));
CREATE POLICY "Approved users can manage services" ON public.services FOR ALL USING (public.is_approved(auth.uid()));
CREATE POLICY "Public can view active services" ON public.services FOR SELECT USING (is_active = true);

-- Clinic Settings
CREATE POLICY "Approved users can view clinic settings" ON public.clinic_settings FOR SELECT USING (public.is_approved(auth.uid()));
CREATE POLICY "Admins can update clinic settings" ON public.clinic_settings FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can insert clinic settings" ON public.clinic_settings FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Public can view clinic settings" ON public.clinic_settings FOR SELECT USING (true);

-- Schedule (Days, Periods, Holidays)
CREATE POLICY "Approved users can view working days" ON public.working_days FOR SELECT USING (public.is_approved(auth.uid()));
CREATE POLICY "Admins can manage working days" ON public.working_days FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Approved users can view working periods" ON public.working_periods FOR SELECT USING (public.is_approved(auth.uid()));
CREATE POLICY "Admins can manage working periods" ON public.working_periods FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Approved users can view holidays" ON public.holidays FOR SELECT USING (public.is_approved(auth.uid()));
CREATE POLICY "Admins can manage holidays" ON public.holidays FOR ALL USING (public.is_admin(auth.uid()));

-- Booking Requests
CREATE POLICY "Anyone can create booking requests" ON public.booking_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Approved users can view booking requests" ON public.booking_requests FOR SELECT USING (is_approved(auth.uid()));
CREATE POLICY "Approved users can update booking requests" ON public.booking_requests FOR UPDATE USING (is_approved(auth.uid()));
CREATE POLICY "Approved users can delete booking requests" ON public.booking_requests FOR DELETE USING (is_approved(auth.uid()));

-- 8. REALTIME
-- Note: Requires Supabase CLI or Dashboard to enable effectively, but adding to publication here
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
  END IF;
END $$;

-- 9. SEED DATA

-- Default Clinic Settings
INSERT INTO public.clinic_settings (clinic_name, booking_range_days) VALUES ('My Clinic', 30);

-- Default Working Days
INSERT INTO public.working_days (day_of_week, day_name, is_working) VALUES
    (0, 'Sunday', false),
    (1, 'Monday', true),
    (2, 'Tuesday', true),
    (3, 'Wednesday', true),
    (4, 'Thursday', true),
    (5, 'Friday', true),
    (6, 'Saturday', false);

-- Default Working Periods
INSERT INTO public.working_periods (working_day_id, name, start_time, end_time)
SELECT id, 'Morning', '09:00:00', '12:00:00' FROM public.working_days WHERE is_working = true;

INSERT INTO public.working_periods (working_day_id, name, start_time, end_time)
SELECT id, 'Afternoon', '14:00:00', '18:00:00' FROM public.working_days WHERE is_working = true;
