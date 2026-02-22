-- Update RLS policies on existing tables to require approved users
-- Drop old permissive policies and replace with proper auth-based ones

-- APPOINTMENTS table
DROP POLICY IF EXISTS "Allow all operations on appointments" ON public.appointments;

CREATE POLICY "Approved users can view appointments"
  ON public.appointments FOR SELECT
  USING (public.is_approved(auth.uid()));

CREATE POLICY "Approved users can create appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (public.is_approved(auth.uid()));

CREATE POLICY "Approved users can update appointments"
  ON public.appointments FOR UPDATE
  USING (public.is_approved(auth.uid()));

CREATE POLICY "Approved users can delete appointments"
  ON public.appointments FOR DELETE
  USING (public.is_approved(auth.uid()));

-- CLINIC_SETTINGS table
DROP POLICY IF EXISTS "Allow all operations on clinic_settings" ON public.clinic_settings;

CREATE POLICY "Approved users can view clinic settings"
  ON public.clinic_settings FOR SELECT
  USING (public.is_approved(auth.uid()));

CREATE POLICY "Admins can update clinic settings"
  ON public.clinic_settings FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert clinic settings"
  ON public.clinic_settings FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

-- GUARDIANS table
DROP POLICY IF EXISTS "Allow all operations on guardians" ON public.guardians;

CREATE POLICY "Approved users can view guardians"
  ON public.guardians FOR SELECT
  USING (public.is_approved(auth.uid()));

CREATE POLICY "Approved users can manage guardians"
  ON public.guardians FOR ALL
  USING (public.is_approved(auth.uid()));

-- HOLIDAYS table
DROP POLICY IF EXISTS "Allow all operations on holidays" ON public.holidays;

CREATE POLICY "Approved users can view holidays"
  ON public.holidays FOR SELECT
  USING (public.is_approved(auth.uid()));

CREATE POLICY "Admins can manage holidays"
  ON public.holidays FOR ALL
  USING (public.is_admin(auth.uid()));

-- PATIENTS table
DROP POLICY IF EXISTS "Allow all operations on patients" ON public.patients;

CREATE POLICY "Approved users can view patients"
  ON public.patients FOR SELECT
  USING (public.is_approved(auth.uid()));

CREATE POLICY "Approved users can manage patients"
  ON public.patients FOR ALL
  USING (public.is_approved(auth.uid()));

-- SERVICES table
DROP POLICY IF EXISTS "Allow all operations on services" ON public.services;

CREATE POLICY "Approved users can view services"
  ON public.services FOR SELECT
  USING (public.is_approved(auth.uid()));

CREATE POLICY "Approved users can manage services"
  ON public.services FOR ALL
  USING (public.is_approved(auth.uid()));

-- WORKING_DAYS table
DROP POLICY IF EXISTS "Allow all operations on working_days" ON public.working_days;

CREATE POLICY "Approved users can view working days"
  ON public.working_days FOR SELECT
  USING (public.is_approved(auth.uid()));

CREATE POLICY "Admins can manage working days"
  ON public.working_days FOR ALL
  USING (public.is_admin(auth.uid()));

-- WORKING_PERIODS table
DROP POLICY IF EXISTS "Allow all operations on working_periods" ON public.working_periods;

CREATE POLICY "Approved users can view working periods"
  ON public.working_periods FOR SELECT
  USING (public.is_approved(auth.uid()));

CREATE POLICY "Admins can manage working periods"
  ON public.working_periods FOR ALL
  USING (public.is_admin(auth.uid()));