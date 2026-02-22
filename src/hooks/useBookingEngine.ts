import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays } from 'date-fns';
import {
    WorkingPeriod,
    Holiday,
    Service,
    Appointment,
    AvailableDate,
    AvailablePeriod,
    BookingValidation,
    AvailabilityMode,
    generateAvailableDates,
    getPeriodsForDate,
    calculatePeriodAvailability,
    calculateNextAvailableTime,
    getAvailableTimeSlots,
    validateBooking,
    getServiceDuration,
    calculateEndTime,
    isDateAvailable,
    suggestNextAvailableDate,
} from '@/lib/booking-engine';

interface UseBookingEngineOptions {
    includeToday?: boolean;
    bookingRangeDays?: number;
    autoFetch?: boolean;
    mode?: AvailabilityMode;
}

interface UseBookingEngineReturn {
    services: Service[];
    workingPeriods: WorkingPeriod[];
    holidays: Holiday[];
    appointments: Appointment[]; // Added appointments exposure

    isLoading: boolean;
    error: string | null;

    availableDates: AvailableDate[];

    refetch: () => Promise<void>;
    getPeriodsForDate: (dateStr: string) => WorkingPeriod[];
    isDateAvailable: (dateStr: string) => { available: boolean; reason?: string };

    fetchPeriodAvailability: (
        dateStr: string,
        serviceDurationMinutes: number
    ) => Promise<AvailablePeriod[]>;

    fetchAvailableTimeSlots: (
        dateStr: string,
        periodId: string,
        serviceDurationMinutes: number
    ) => Promise<string[]>;

    fetchNextAvailableTime: (
        dateStr: string,
        periodId: string,
        serviceDurationMinutes: number
    ) => Promise<string | null>;

    validateBooking: (
        dateStr: string,
        startTime: string,
        serviceDurationMinutes: number,
        periodId?: string
    ) => Promise<BookingValidation>;

    suggestNextAvailableDate: (currentDateStr: string) => string | null;
    getServiceDuration: (serviceId: string | null) => number;
    calculateEndTime: (startTime: string, durationMinutes: number) => string;
}

export function useBookingEngine(
    options: UseBookingEngineOptions = {}
): UseBookingEngineReturn {
    const {
        includeToday = false,
        bookingRangeDays = 30,
        autoFetch = true,
        mode = 'PUBLIC',
    } = options;

    const [services, setServices] = useState<Service[]>([]);
    const [workingPeriods, setWorkingPeriods] = useState<WorkingPeriod[]>([]);
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const rangeStart = format(new Date(), 'yyyy-MM-dd');
            const rangeEnd = format(addDays(new Date(), bookingRangeDays), 'yyyy-MM-dd');

            const [servicesRes, periodsRes, holidaysRes, appointmentsRes] = await Promise.all([
                supabase
                    .from('services')
                    .select('id, name, duration, price, description')
                    .eq('is_active', true)
                    .order('name'),
                supabase
                    .from('working_periods')
                    .select('*, working_days(day_of_week)'),
                supabase
                    .from('holidays')
                    .select('*'),
                supabase
                    .from('appointments')
                    .select('id, appointment_date, start_time, end_time, service_id, status')
                    .gte('appointment_date', rangeStart)
                    .lte('appointment_date', rangeEnd)
                    .in('status', ['confirmed', 'postponed']),
            ]);

            if (servicesRes.error) throw servicesRes.error;
            if (periodsRes.error) throw periodsRes.error;
            if (holidaysRes.error) throw holidaysRes.error;
            if (appointmentsRes.error) throw appointmentsRes.error;

            setServices(servicesRes.data || []);
            setAppointments(appointmentsRes.data as Appointment[] || []);

            const mappedPeriods: WorkingPeriod[] = (periodsRes.data || [])
                .filter((p: any) => p.working_days?.day_of_week !== undefined)
                .map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    start_time: p.start_time,
                    end_time: p.end_time,
                    day_of_week: p.working_days.day_of_week,
                }));
            setWorkingPeriods(mappedPeriods);

            setHolidays(holidaysRes.data || []);
        } catch (err) {
            console.error('Error fetching booking data:', err);
            setError('Failed to load booking options');
        } finally {
            setIsLoading(false);
        }
    }, [bookingRangeDays]);

    useEffect(() => {
        if (autoFetch) {
            fetchData();
        }
    }, [autoFetch, fetchData]);

    // Compute available dates using bulk data
    const availableDates = useMemo(() => {
        if (workingPeriods.length === 0) return [];
        // Default duration for exhaustion check: using 30 mins or any default
        const refDuration = services[0]?.duration || 30;

        return generateAvailableDates(
            workingPeriods,
            holidays,
            appointments,
            services,
            refDuration,
            bookingRangeDays,
            !includeToday,
            mode
        );
    }, [workingPeriods, holidays, appointments, services, bookingRangeDays, includeToday, mode]);

    const getPeriodsForDateFn = useCallback(
        (dateStr: string) => getPeriodsForDate(dateStr, workingPeriods),
        [workingPeriods]
    );

    const isDateAvailableFn = useCallback(
        (dateStr: string) => {
            const dateObj = parseISO(dateStr);
            const status = availableDates.find(d => d.date === dateStr)?.status || 'no_periods';
            return {
                available: status === 'available',
                reason: status !== 'available' ? availableDates.find(d => d.date === dateStr)?.reason : undefined
            };
        },
        [availableDates]
    );

    const fetchPeriodAvailability = useCallback(
        async (dateStr: string, serviceDurationMinutes: number): Promise<AvailablePeriod[]> => {
            const dayAppointments = appointments.filter(a => a.appointment_date === dateStr);
            return calculatePeriodAvailability(
                dateStr,
                workingPeriods,
                dayAppointments,
                services,
                serviceDurationMinutes
            );
        },
        [workingPeriods, services, appointments]
    );

    const fetchAvailableTimeSlots = useCallback(
        async (
            dateStr: string,
            periodId: string,
            serviceDurationMinutes: number
        ): Promise<string[]> => {
            const period = workingPeriods.find(p => p.id === periodId);
            if (!period) return [];

            const dayAppointments = appointments.filter(a => a.appointment_date === dateStr);
            return getAvailableTimeSlots(period, dayAppointments, services, serviceDurationMinutes, dateStr);
        },
        [workingPeriods, services, appointments]
    );

    const fetchNextAvailableTime = useCallback(
        async (
            dateStr: string,
            periodId: string,
            serviceDurationMinutes: number
        ): Promise<string | null> => {
            const period = workingPeriods.find(p => p.id === periodId);
            if (!period) return null;

            const dayAppointments = appointments.filter(a => a.appointment_date === dateStr);
            return calculateNextAvailableTime(period, dayAppointments, services, serviceDurationMinutes);
        },
        [workingPeriods, services, appointments]
    );

    const validateBookingFn = useCallback(
        async (
            dateStr: string,
            startTime: string,
            serviceDurationMinutes: number,
            periodId?: string
        ): Promise<BookingValidation> => {
            // No need to refetch, use bulk data
            return validateBooking(
                dateStr,
                startTime,
                serviceDurationMinutes,
                workingPeriods,
                holidays,
                appointments,
                services,
                mode,
                periodId
            );
        },
        [workingPeriods, holidays, services, appointments, mode]
    );

    const suggestNextAvailableDateFn = useCallback(
        (currentDateStr: string) => suggestNextAvailableDate(currentDateStr, availableDates),
        [availableDates]
    );

    const getServiceDurationFn = useCallback(
        (serviceId: string | null) => getServiceDuration(serviceId, services),
        [services]
    );

    const parseISO = (s: string) => new Date(s);

    return {
        services,
        workingPeriods,
        holidays,
        appointments,
        isLoading,
        error,
        availableDates,
        refetch: fetchData,
        getPeriodsForDate: getPeriodsForDateFn,
        isDateAvailable: isDateAvailableFn,
        fetchPeriodAvailability,
        fetchAvailableTimeSlots,
        fetchNextAvailableTime,
        validateBooking: validateBookingFn,
        suggestNextAvailableDate: suggestNextAvailableDateFn,
        getServiceDuration: getServiceDurationFn,
        calculateEndTime,
    };
}

export function usePatientBooking(bookingRangeDays: number = 30) {
    return useBookingEngine({
        includeToday: false,
        bookingRangeDays,
        autoFetch: true,
        mode: 'PUBLIC',
    });
}
