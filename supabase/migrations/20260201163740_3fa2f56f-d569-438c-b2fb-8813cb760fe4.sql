-- Create services table for clinic service management
CREATE TABLE public.services (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    duration INTEGER NOT NULL, -- Duration in minutes
    description TEXT,
    category VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Create policy for all operations (internal tool, staff access)
CREATE POLICY "Allow all operations on services"
ON public.services
FOR ALL
USING (true)
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster category lookups
CREATE INDEX idx_services_category ON public.services(category);

-- Create index for active services filtering
CREATE INDEX idx_services_is_active ON public.services(is_active);