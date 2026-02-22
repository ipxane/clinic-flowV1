import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { addDays, startOfDay } from "date-fns";
import {
  Holiday,
  WorkingPeriod,
  calculateDateStatus
} from "@/lib/booking-engine";

export function useBookingAvailability() {
  const [workingPeriods, setWorkingPeriods] = useState<WorkingPeriod[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [bookingRangeDays, setBookingRangeDays] = useState<number>(30);
  const [bookingRangeEnabled, setBookingRangeEnabled] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all availability data on mount
  useEffect(() => {
    const fetchAvailabilityData = async () => {
      setIsLoading(true);

      try {
        // Fetch all data in parallel
        const [periodsRes, holidaysRes, settingsRes] = await Promise.all([
          supabase.from("working_periods").select("*, working_days(day_of_week)"),
          supabase.from("holidays").select("*"),
          supabase.from("clinic_settings").select("booking_range_days, booking_range_enabled").maybeSingle(),
        ]);

        // Process working periods - we flatten the joined day_of_week
        if (periodsRes.data) {
          const processedPeriods = periodsRes.data.map((p: any) => ({
            ...p,
            day_of_week: p.working_days?.day_of_week ?? 0
          })) as WorkingPeriod[];
          setWorkingPeriods(processedPeriods);
        }

        // Process holidays
        if (holidaysRes.data) {
          setHolidays(holidaysRes.data as Holiday[]);
        }

        // Process booking range settings
        if (settingsRes.data) {
          setBookingRangeDays(settingsRes.data.booking_range_days || 30);
          setBookingRangeEnabled(settingsRes.data.booking_range_enabled !== false);
        }
      } catch (error) {
        console.error("Error fetching booking availability data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailabilityData();
  }, []);

  // Today at midnight for comparisons
  const today = useMemo(() => startOfDay(new Date()), []);

  // Maximum bookable date based on booking range (only if enabled)
  const maxDate = useMemo(() =>
    bookingRangeEnabled ? addDays(today, bookingRangeDays) : null,
    [today, bookingRangeDays, bookingRangeEnabled]
  );

  // Unified function to check if a date is disabled
  const isDateDisabled = useCallback(
    (date: Date): boolean => {
      const checkDate = startOfDay(date);

      // 1. Past dates are always disabled
      if (checkDate < today) {
        return true;
      }

      // 2. Dates beyond booking range are disabled (only if range is enabled)
      if (maxDate && checkDate > maxDate) {
        return true;
      }

      // While loading, only disable past dates (safe default)
      if (isLoading) {
        return false;
      }

      // 3. Use modern engine for holiday and working periods check
      // We pass empty arrays for appointments/services as the calendar usually just 
      // cares about 'closed'/'holiday'/'no_periods', not 'full' status for performance.
      const status = calculateDateStatus(
        checkDate,
        workingPeriods,
        holidays,
        [],
        [],
        30,
        'PUBLIC'
      );

      return status !== 'available';
    },
    [today, maxDate, workingPeriods, holidays, isLoading]
  );

  return {
    isDateDisabled,
    isLoading,
    bookingRangeDays,
  };
}
