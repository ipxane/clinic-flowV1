import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

// Types
export interface ClinicSettings {
  id: string;
  clinic_name: string;
  clinic_description: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  logo_url: string | null;
  booking_range_days: number;
  booking_range_enabled: boolean;
  gallery_images: string[];
  marketing_fields: any;
}

export interface Testimonial {
  id: string;
  author_name: string;
  author_role: string | null;
  content: string;
  rating: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface WorkingDay {
  id: string;
  day_of_week: number;
  day_name: string;
  is_working: boolean;
}

export interface WorkingPeriod {
  id: string;
  working_day_id: string;
  name: string;
  start_time: string;
  end_time: string;
}

export type HolidayType = Database["public"]["Enums"]["holiday_type"];

export interface Holiday {
  id: string;
  date: string;
  type: HolidayType;
  note: string | null;
  start_date: string | null;
  end_date: string | null;
  recurring_start_month: number | null;
  recurring_start_day: number | null;
  recurring_end_month: number | null;
  recurring_end_day: number | null;
}

export interface MarketingFeature {
  title: string;
  description: string;
}

export interface MarketingStat {
  label: string;
  value: string;
  suffix?: string;
}

export interface WorkingDayWithPeriods extends WorkingDay {
  periods: WorkingPeriod[];
}

export function useSettings() {
  const { toast } = useToast();
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings | null>(null);
  const [workingDays, setWorkingDays] = useState<WorkingDayWithPeriods[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all settings
  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch clinic settings
      const { data: settingsData, error: settingsError } = await supabase
        .from("clinic_settings")
        .select("*")
        .maybeSingle();

      if (settingsError) throw settingsError;
      if (settingsData) {
        setClinicSettings(settingsData as any as ClinicSettings);
      }

      // Fetch working days with periods
      const { data: daysData, error: daysError } = await supabase
        .from("working_days")
        .select("*")
        .order("day_of_week");

      if (daysError) throw daysError;

      // Fetch all periods
      const { data: periodsData, error: periodsError } = await supabase
        .from("working_periods")
        .select("*")
        .order("start_time");

      if (periodsError) throw periodsError;

      // Combine days with their periods
      const daysWithPeriods: WorkingDayWithPeriods[] = (daysData || []).map((day) => ({
        ...day,
        periods: (periodsData || []).filter((p) => p.working_day_id === day.id),
      }));

      setWorkingDays(daysWithPeriods);

      // Fetch holidays
      const { data: holidaysData, error: holidaysError } = await supabase
        .from("holidays")
        .select("*")
        .order("date");

      if (holidaysError) throw holidaysError;
      setHolidays(holidaysData || []);

      // Fetch testimonials
      const { data: testimonialsData, error: testimonialsError } = await (supabase as any)
        .from("testimonials")
        .select("*")
        .order("created_at", { ascending: false });

      if (testimonialsError && testimonialsError.code !== "PGRST116" && !testimonialsError.message.includes('relation "public.testimonials" does not exist')) {
        throw testimonialsError;
      }
      setTestimonials((testimonialsData as any[]) || []);

    } catch (error: any) {
      console.error("Error loading settings:", error);
      // We don't always want to toast if the table doesn't exist yet (before migration)
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Update clinic settings
  const updateClinicSettings = async (updates: Partial<ClinicSettings>) => {
    if (!clinicSettings) return;

    try {
      const { error } = await supabase
        .from("clinic_settings")
        .update(updates as any)
        .eq("id", clinicSettings.id);

      if (error) throw error;

      setClinicSettings({ ...clinicSettings, ...updates });
      toast({
        title: "Settings saved",
        description: "Clinic profile has been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error saving settings",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Toggle working day
  const toggleWorkingDay = async (dayId: string, isWorking: boolean) => {
    try {
      const { error } = await supabase
        .from("working_days")
        .update({ is_working: isWorking })
        .eq("id", dayId);

      if (error) throw error;

      setWorkingDays((prev) =>
        prev.map((day) => (day.id === dayId ? { ...day, is_working: isWorking } : day))
      );

      toast({
        title: "Schedule updated",
        description: `Day has been ${isWorking ? "enabled" : "disabled"}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error updating schedule",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Add working period
  const addPeriod = async (
    workingDayId: string,
    period: { name: string; start_time: string; end_time: string }
  ) => {
    try {
      const { data, error } = await supabase
        .from("working_periods")
        .insert({
          working_day_id: workingDayId,
          name: period.name,
          start_time: period.start_time,
          end_time: period.end_time,
        })
        .select()
        .single();

      if (error) throw error;

      setWorkingDays((prev) =>
        prev.map((day) =>
          day.id === workingDayId ? { ...day, periods: [...day.periods, data] } : day
        )
      );

      toast({
        title: "Period added",
        description: `${period.name} has been added to the schedule.`,
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Error adding period",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  // Update working period
  const updatePeriod = async (
    periodId: string,
    updates: { name?: string; start_time?: string; end_time?: string }
  ) => {
    try {
      const { error } = await supabase
        .from("working_periods")
        .update(updates)
        .eq("id", periodId);

      if (error) throw error;

      setWorkingDays((prev) =>
        prev.map((day) => ({
          ...day,
          periods: day.periods.map((p) => (p.id === periodId ? { ...p, ...updates } : p)),
        }))
      );

      toast({
        title: "Period updated",
        description: "Schedule period has been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating period",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Delete working period
  const deletePeriod = async (periodId: string) => {
    try {
      const { error } = await supabase.from("working_periods").delete().eq("id", periodId);

      if (error) throw error;

      setWorkingDays((prev) =>
        prev.map((day) => ({
          ...day,
          periods: day.periods.filter((p) => p.id !== periodId),
        }))
      );

      toast({
        title: "Period deleted",
        description: "Schedule period has been removed.",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting period",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Add holiday
  const addHoliday = async (holiday: {
    date: string;
    type: HolidayType;
    note?: string;
    start_date?: string;
    end_date?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from("holidays")
        .insert({
          date: holiday.type === "long_holiday" ? (holiday.start_date || holiday.date) : holiday.date,
          type: holiday.type,
          note: holiday.note || null,
          start_date: holiday.type === "long_holiday" ? holiday.start_date : null,
          end_date: holiday.type === "long_holiday" ? holiday.end_date : null,
        })
        .select()
        .single();

      if (error) throw error;

      setHolidays((prev) => [...prev, data].sort((a, b) => a.date.localeCompare(b.date)));

      toast({
        title: "Holiday added",
        description: "The date has been added to holidays.",
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Error adding holiday",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  // Update holiday
  const updateHoliday = async (
    holidayId: string,
    updates: { date?: string; type?: HolidayType; note?: string | null; start_date?: string | null; end_date?: string | null }
  ) => {
    try {
      // If changing to long_holiday, set date to start_date for consistency
      const updateData = { ...updates };
      if (updates.type === "long_holiday" && updates.start_date) {
        updateData.date = updates.start_date;
      } else if (updates.type && updates.type !== "long_holiday") {
        // If changing away from long_holiday, clear the range dates
        updateData.start_date = null;
        updateData.end_date = null;
      }
      const { error } = await supabase.from("holidays").update(updateData).eq("id", holidayId);

      if (error) throw error;

      setHolidays((prev) =>
        prev
          .map((h) => (h.id === holidayId ? { ...h, ...updates } : h))
          .sort((a, b) => a.date.localeCompare(b.date))
      );

      toast({
        title: "Holiday updated",
        description: "The holiday has been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating holiday",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Delete holiday
  const deleteHoliday = async (holidayId: string) => {
    try {
      const { error } = await supabase.from("holidays").delete().eq("id", holidayId);

      if (error) throw error;

      setHolidays((prev) => prev.filter((h) => h.id !== holidayId));

      toast({
        title: "Holiday deleted",
        description: "The holiday has been removed.",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting holiday",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Add recurring annual holiday
  const addRecurringHoliday = async (holiday: {
    recurring_start_month: number;
    recurring_start_day: number;
    recurring_end_month: number;
    recurring_end_day: number;
    note?: string;
  }) => {
    try {
      // Use a placeholder date for the required 'date' column
      const placeholderDate = `2000-${String(holiday.recurring_start_month).padStart(2, '0')}-${String(holiday.recurring_start_day).padStart(2, '0')}`;

      const { data, error } = await supabase
        .from("holidays")
        .insert({
          date: placeholderDate,
          type: "recurring_annual" as HolidayType,
          note: holiday.note || null,
          recurring_start_month: holiday.recurring_start_month,
          recurring_start_day: holiday.recurring_start_day,
          recurring_end_month: holiday.recurring_end_month,
          recurring_end_day: holiday.recurring_end_day,
        })
        .select()
        .single();

      if (error) throw error;

      setHolidays((prev) => [...prev, data].sort((a, b) => a.date.localeCompare(b.date)));

      toast({
        title: "Recurring holiday added",
        description: "The recurring annual holiday has been saved.",
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Error adding recurring holiday",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  // Update recurring annual holiday
  const updateRecurringHoliday = async (
    holidayId: string,
    updates: {
      recurring_start_month?: number;
      recurring_start_day?: number;
      recurring_end_month?: number;
      recurring_end_day?: number;
      note?: string | null;
    }
  ) => {
    try {
      // Update placeholder date if start month/day changed
      const updateData: any = { ...updates };
      if (updates.recurring_start_month && updates.recurring_start_day) {
        updateData.date = `2000-${String(updates.recurring_start_month).padStart(2, '0')}-${String(updates.recurring_start_day).padStart(2, '0')}`;
      }

      const { error } = await supabase.from("holidays").update(updateData).eq("id", holidayId);

      if (error) throw error;

      setHolidays((prev) =>
        prev
          .map((h) => (h.id === holidayId ? { ...h, ...updates } : h))
          .sort((a, b) => a.date.localeCompare(b.date))
      );

      toast({
        title: "Recurring holiday updated",
        description: "The recurring annual holiday has been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating recurring holiday",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Testimonials CRUD
  const addTestimonial = async (testimonial: Omit<Testimonial, "id" | "created_at">) => {
    try {
      const { data, error } = await (supabase as any)
        .from("testimonials")
        .insert(testimonial)
        .select()
        .single();

      if (error) throw error;
      setTestimonials(prev => [data as Testimonial, ...prev]);
      toast({ title: "Testimonial added" });
      return data;
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return null;
    }
  };

  const updateTestimonial = async (id: string, updates: Partial<Testimonial>) => {
    try {
      const { error } = await (supabase as any)
        .from("testimonials")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      setTestimonials(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      toast({ title: "Testimonial updated" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const deleteTestimonial = async (id: string) => {
    try {
      const { error } = await (supabase as any).from("testimonials").delete().eq("id", id);
      if (error) throw error;
      setTestimonials(prev => prev.filter(t => t.id !== id));
      toast({ title: "Testimonial deleted" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Upload image to Supabase Storage
  const uploadImage = async (file: File, path: string): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${path}/${fileName}`;

      // Upload the file to 'marketing' bucket
      const { data, error: uploadError } = await supabase.storage
        .from('marketing')
        .upload(filePath, file);

      if (uploadError) {
        // If bucket doesn't exist, this might fail. In a real app we'd handle bucket existence.
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('marketing')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  return {
    clinicSettings,
    workingDays,
    holidays,
    testimonials,
    isLoading,
    updateClinicSettings,
    toggleWorkingDay,
    addPeriod,
    updatePeriod,
    deletePeriod,
    addHoliday,
    updateHoliday,
    deleteHoliday,
    addRecurringHoliday,
    updateRecurringHoliday,
    addTestimonial,
    updateTestimonial,
    deleteTestimonial,
    uploadImage,
    refetch: fetchSettings,
  };
}
