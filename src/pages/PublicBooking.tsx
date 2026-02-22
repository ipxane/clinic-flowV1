import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

import { usePatients } from "@/hooks/usePatients";
import { useBookingRequests } from "@/hooks/useBookingRequests";
import { useBookingEngine, usePatientBooking } from "@/hooks/useBookingEngine";
import { WorkingPeriod, Service, AvailablePeriod } from '@/lib/booking-engine';
import { parseMarketingContent } from '@/lib/marketing-content';
import { useMarketingSettings } from '@/hooks/useMarketingSettings';

import { StickyHeader } from '@/components/booking/StickyHeader';
import { BookingHero } from '@/components/booking/BookingHero';
import { FeatureCards } from '@/components/booking/FeatureCards';
import { StatsSection } from '@/components/booking/StatsSection';
import { TestimonialsSection } from '@/components/booking/TestimonialsSection';
import { TrustBadges } from '@/components/booking/TrustBadges';
import { BookingFormCard, BookingFormData } from '@/components/booking/BookingFormCard';
import { BookingFooter } from '@/components/booking/BookingFooter';
import { BookingSuccess } from '@/components/booking/BookingSuccess';
import { CreateBookingRequest } from "@/hooks/useBookingRequests";

interface ClinicSettings {
  clinic_name: string;
  logo_url: string | null;
  clinic_description: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  booking_range_days: number;
}

const adultBookingSchema = z.object({
  phone_number: z.string().min(8, 'Phone number must be at least 8 digits').max(20, 'Phone number is too long'),
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  service_id: z.string().uuid('Please select a service'),
  preferred_date: z.string().min(1, 'Please select a date'),
  preferred_period_id: z.string().uuid('Please select a period'),
  patient_type: z.literal('adult'),
});

const childBookingSchema = z.object({
  phone_number: z.string().min(8, 'Phone number must be at least 8 digits').max(20, 'Phone number is too long'),
  full_name: z.string().min(2, "Child's name must be at least 2 characters").max(100, 'Name is too long'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  service_id: z.string().uuid('Please select a service'),
  preferred_date: z.string().min(1, 'Please select a date'),
  preferred_period_id: z.string().uuid('Please select a period'),
  patient_type: z.literal('child'),
  guardian_phone_number: z.string().min(8, 'Guardian phone number must be at least 8 digits').max(20, 'Phone number is too long'),
  guardian_name: z.string().min(2, 'Guardian name must be at least 2 characters').max(100, 'Name is too long'),
  guardian_email: z.string().email('Invalid email address').max(255).or(z.literal('')).optional(),
});

const initialFormData: BookingFormData = {
  phone_number: '',
  full_name: '',
  date_of_birth: '',
  service_id: '',
  preferred_date: '',
  preferred_period_id: '',
  patient_type: 'adult',
  guardian_phone_number: '',
  guardian_name: '',
  guardian_email: '',
};

export default function PublicBooking() {
  const { clinicSettings, testimonials: dbTestimonials, isLoading: isSettingsLoading } = useMarketingSettings();

  const {
    services,
    availableDates,
    isLoading: isBookingDataLoading,
    error: bookingError,
    isDateAvailable,
    fetchPeriodAvailability,
    suggestNextAvailableDate,
  } = usePatientBooking(clinicSettings?.booking_range_days || 30);

  const [availablePeriods, setAvailablePeriods] = useState<AvailablePeriod[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState<BookingFormData>(initialFormData);
  const { toast } = useToast();

  // Update SEO metadata
  useEffect(() => {
    const marketing = parseMarketingContent(clinicSettings?.marketing_fields);
    const title = marketing.seo_title || clinicSettings?.clinic_name || 'EyeCare Clinic';
    const description = marketing.seo_description || clinicSettings?.clinic_description || 'Professional eye care services.';

    document.title = title;

    // Update meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);
  }, [clinicSettings]);

  // Update available periods when date changes
  useEffect(() => {
    const updatePeriods = async () => {
      if (formData.preferred_date) {
        const dateCheck = isDateAvailable(formData.preferred_date);

        // If date is fully booked or unavailable, suggest the next one
        if (!dateCheck.available) {
          const nextDate = suggestNextAvailableDate(formData.preferred_date);
          if (nextDate) {
            toast({
              title: 'Date Fully Booked',
              description: `Suggesting the next available date: ${nextDate} `,
            });
            setFormData(prev => ({ ...prev, preferred_date: nextDate }));
          } else {
            setAvailablePeriods([]);
            setFormData(prev => ({ ...prev, preferred_period_id: '' }));
          }
          return;
        }

        // Fetch period-level availability
        const service = services.find(s => s.id === formData.service_id);
        const duration = service?.duration || 30;

        const dayPeriods = await fetchPeriodAvailability(formData.preferred_date, duration);
        setAvailablePeriods(dayPeriods);

        // Auto-select first available period if none selected or if current is full
        const currentPeriod = dayPeriods.find(p => p.period.id === formData.preferred_period_id);
        if (!currentPeriod || currentPeriod.status === 'full') {
          const firstAvail = dayPeriods.find(p => p.status === 'available');
          if (firstAvail) {
            setFormData(prev => ({ ...prev, preferred_period_id: firstAvail.period.id }));
          } else {
            setFormData(prev => ({ ...prev, preferred_period_id: '' }));
          }
        }
      } else {
        setAvailablePeriods([]);
      }
    };

    updatePeriods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.preferred_date, formData.service_id, fetchPeriodAvailability, isDateAvailable, suggestNextAvailableDate, services]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate based on patient type
      const schema = formData.patient_type === 'child' ? childBookingSchema : adultBookingSchema;
      const validated = schema.parse(formData);

      // Double-check date availability
      const dateCheck = isDateAvailable(validated.preferred_date);
      if (!dateCheck.available) {
        toast({
          title: 'Date Unavailable',
          description: dateCheck.reason || 'This date is not available for booking.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // Check period availability
      const periodInfo = availablePeriods.find(p => p.period.id === validated.preferred_period_id);
      if (!periodInfo || periodInfo.status === 'full') {
        toast({
          title: 'Period Fully Booked',
          description: 'The selected time period is no longer available.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // Get service and period names
      const service = services.find(s => s.id === validated.service_id);
      const period = periodInfo.period; // Use the period from periodInfo

      if (!service || !period) {
        throw new Error('Service or period not found');
      }

      // Build notes (currently no specific notes field in form, using null)
      const notes = null;

      // Build insert payload matching enhanced schema
      const insertPayload: CreateBookingRequest = {
        patient_name: validated.full_name,
        patient_type: validated.patient_type,
        date_of_birth: validated.date_of_birth,
        contact_info: validated.phone_number,
        contact_type: 'phone' as const,
        service_id: validated.service_id,
        service_name: service.name,
        requested_date: validated.preferred_date,
        requested_period: period.name as 'Morning' | 'Afternoon' | 'Evening' | 'Night',
        status: 'pending' as const,
        notes: notes,
      };

      if (formData.patient_type === 'child') {
        const childData = validated as z.infer<typeof childBookingSchema>;
        insertPayload.guardian_name = childData.guardian_name;
        insertPayload.guardian_phone = childData.guardian_phone_number;
        insertPayload.guardian_email = childData.guardian_email || null;
      }

      const { error } = await supabase
        .from('booking_requests')
        .insert([insertPayload]);

      if (error) {
        console.error('Supabase error submitting booking:', error);
        if (error.message?.includes('23505') || error.code === '23505') {
          toast({
            title: 'Duplicate Request',
            description: 'You already have a pending booking request. Please wait for our staff to contact you.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Submission Error',
            description: `Error: ${error.message || 'Unknown database error'}`,
            variant: 'destructive',
          });
        }
        return;
      }

      setIsSuccess(true);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      } else {
        console.error('CRITICAL: Error submitting booking request:', error);
        toast({
          title: 'Submission Error',
          description: error instanceof Error ? error.message : 'Failed to submit booking request. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSuccess(false);
    setFormData(initialFormData);
  };

  const formattedAvailableDates = availableDates.map(d => ({
    ...d,
    status: d.status as 'available' | 'holiday' | 'no_periods',
  }));

  const selectedDateInfo = formData.preferred_date
    ? formattedAvailableDates.find(d => d.date === formData.preferred_date)
    : null;

  if (isSuccess) {
    return <BookingSuccess onReset={handleReset} />;
  }

  const isLoading = isBookingDataLoading || isSettingsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
          <p className="text-muted-foreground font-medium">Loading booking options...</p>
        </div>
      </div>
    );
  }

  if (bookingError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive font-medium">{bookingError}</p>
          <p className="text-muted-foreground mt-2">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  const marketing = parseMarketingContent(clinicSettings?.marketing_fields);

  const profileForHero = {
    clinic_name: clinicSettings?.clinic_name || 'EyeCare Clinic',
    logo_url: clinicSettings?.logo_url || null,
    description: clinicSettings?.clinic_description || null,
    phone_number: clinicSettings?.phone || null,
    email: clinicSettings?.email || null,
    address: clinicSettings?.address || null,
    welcome_title: marketing.hero_title || null,
    welcome_description: marketing.hero_description || null,
  };

  // Marketing content with db overrides
  if (dbTestimonials && dbTestimonials.length > 0) {
    marketing.testimonials = dbTestimonials;
  }

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 antialiased">
      <StickyHeader
        clinicName={profileForHero.clinic_name}
        phoneNumber={profileForHero.phone_number}
      />

      <div className="divide-y divide-slate-100">
        <BookingHero clinicProfile={profileForHero} />

        <FeatureCards
          features={marketing.features || []}
        />

        <StatsSection stats={marketing.statistics || []} />

        <TestimonialsSection testimonials={marketing.testimonials || []} />

        <TrustBadges
          message1={marketing.badges?.[0] || null}
          message2={marketing.badges?.[1] || null}
          message3={marketing.badges?.[2] || null}
        />

        <div id="booking-form" className="bg-slate-50/50">
          <BookingFormCard
            services={services}
            availableDates={formattedAvailableDates}
            availablePeriods={availablePeriods.map(ap => ({
              ...ap.period,
              status: ap.status,
              availableSlots: ap.availableSlots
            }))}
            formData={formData}
            setFormData={setFormData}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            selectedDateInfo={selectedDateInfo}
          />
        </div>

        <BookingFooter
          clinicName={profileForHero.clinic_name}
          logoUrl={profileForHero.logo_url}
          phoneNumber={profileForHero.phone_number}
          email={profileForHero.email}
          address={profileForHero.address}
          footerText={clinicSettings?.clinic_description || null}
          footerTrustKeywords="Safe • Secure • Professional"
        />
      </div>
    </div>
  );
}
