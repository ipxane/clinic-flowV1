-- Create enum for patient types
CREATE TYPE public.patient_type AS ENUM ('adult', 'child');

-- Create enum for patient status
CREATE TYPE public.patient_status AS ENUM ('active', 'follow_up', 'archived');

-- Create guardians table (for child patients)
CREATE TABLE public.guardians (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    phone VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create patients table
CREATE TABLE public.patients (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_type patient_type NOT NULL DEFAULT 'adult',
    status patient_status NOT NULL DEFAULT 'active',
    -- Common fields
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    date_of_birth DATE,
    notes TEXT,
    -- Child-specific: guardian reference
    guardian_id UUID REFERENCES public.guardians(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    -- Constraints
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

-- Enable RLS on both tables
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for guardians (staff system, no auth required for now)
CREATE POLICY "Allow all operations on guardians" ON public.guardians
    FOR ALL USING (true) WITH CHECK (true);

-- Create permissive policies for patients (staff system, no auth required for now)
CREATE POLICY "Allow all operations on patients" ON public.patients
    FOR ALL USING (true) WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_guardians_updated_at
    BEFORE UPDATE ON public.guardians
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
    BEFORE UPDATE ON public.patients
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_patients_phone ON public.patients(phone);
CREATE INDEX idx_patients_status ON public.patients(status);
CREATE INDEX idx_patients_type ON public.patients(patient_type);
CREATE INDEX idx_patients_guardian ON public.patients(guardian_id);
CREATE INDEX idx_guardians_phone ON public.guardians(phone);