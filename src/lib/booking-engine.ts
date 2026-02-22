import { format, addDays, parseISO, isWithinInterval, isBefore, startOfDay } from 'date-fns';

// ============================================================================
// TYPES
// ============================================================================

export type AvailabilityMode = 'PUBLIC' | 'INTERNAL';

export interface WorkingPeriod {
    id: string;
    name: string;
    start_time: string; // HH:MM:SS format
    end_time: string;   // HH:MM:SS format
    day_of_week: number; // 0 = Sunday, 6 = Saturday
}

export interface Holiday {
    id: string;
    date: string; // YYYY-MM-DD (for specific one-off holidays)
    type: string; // 'holiday', 'closed', 'recurring_annual', 'long_holiday'
    note: string | null;
    start_date: string | null;
    end_date: string | null;
    recurring_start_month?: number | null;
    recurring_start_day?: number | null;
    recurring_end_month?: number | null;
    recurring_end_day?: number | null;
}

export interface Service {
    id: string;
    name: string;
    duration: number;
    price?: number;
    description?: string | null;
}

export interface Appointment {
    id: string;
    appointment_date: string;
    start_time: string;
    end_time: string;
    service_id: string | null;
    status: 'pending' | 'confirmed' | 'postponed' | 'cancelled' | 'completed' | 'no_show';
}

export type DateStatus = 'available' | 'holiday' | 'no_periods' | 'past' | 'full';

export interface AvailableDate {
    date: string; // YYYY-MM-DD
    label: string;
    dayOfWeek: number;
    status: DateStatus;
    reason?: string;
}

export type PeriodStatus = 'available' | 'full' | 'closed';

export interface AvailablePeriod {
    period: WorkingPeriod;
    status: PeriodStatus;
    availableSlots: number;
    nextAvailableTime: string | null; // HH:MM
}

export interface TimeSlot {
    time: string; // HH:MM
    label?: string; // AM/PM display
    available: boolean;
    reason?: string;
}

export interface BookingValidation {
    isValid: boolean;
    errors: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_BOOKING_RANGE_DAYS = 21;
const DEFAULT_SERVICE_DURATION = 30;
const SLOT_INCREMENT_MINUTES = 15;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function timeToMinutes(time: string): number {
    if (!time) return 0;
    const parts = time.split(':');
    const hours = Number(parts[0]) || 0;
    const minutes = Number(parts[1]) || 0;
    return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function normalizeTime(time: string): string {
    if (!time) return '';
    return time.slice(0, 5);
}

/**
 * Formats time string (HH:mm or HH:mm:ss) to display format (h:mm AM/PM)
 */
export function formatTimeDisplay(time: string): string {
    if (!time) return '';
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Parses time string to Date object for comparison
 */
export function parseTimeToDate(timeStr: string, baseDate: Date = new Date()): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const result = new Date(baseDate);
    result.setHours(hours, minutes, 0, 0);
    return result;
}

export function timeRangesOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string
): boolean {
    const s1 = timeToMinutes(start1);
    const e1 = timeToMinutes(end1);
    const s2 = timeToMinutes(start2);
    const e2 = timeToMinutes(end2);

    return s1 < e2 && s2 < e1;
}

export function isTimeWithinPeriod(time: string, period: WorkingPeriod): boolean {
    const t = timeToMinutes(time);
    const start = timeToMinutes(period.start_time);
    const end = timeToMinutes(period.end_time);
    return t >= start && t < end;
}

export function isDateHoliday(date: Date, holidays: Holiday[]): Holiday | null {
    const dateStr = format(date, 'yyyy-MM-dd');
    const month = date.getMonth() + 1; // 1-12
    const day = date.getDate();

    for (const holiday of holidays) {
        // 1. Exact date match
        if (dateStr === holiday.date) return holiday;

        // 2. Long holiday (date range) match
        if (holiday.start_date) {
            const start = parseISO(holiday.start_date);
            const end = holiday.end_date ? parseISO(holiday.end_date) : start;
            if (isWithinInterval(date, { start, end })) {
                return holiday;
            }
        }

        // 3. Recurring annual holiday match
        if (holiday.type === 'recurring_annual' &&
            holiday.recurring_start_month && holiday.recurring_start_day &&
            holiday.recurring_end_month && holiday.recurring_end_day) {

            const startM = holiday.recurring_start_month;
            const startD = holiday.recurring_start_day;
            const endM = holiday.recurring_end_month;
            const endD = holiday.recurring_end_day;

            // Simple case: within the same year
            if (startM < endM || (startM === endM && startD <= endD)) {
                const isAfterStart = (month > startM) || (month === startM && day >= startD);
                const isBeforeEnd = (month < endM) || (month === endM && day <= endD);
                if (isAfterStart && isBeforeEnd) return holiday;
            } else {
                // Wraps around new year (e.g. Dec to Jan)
                const isAfterStart = (month > startM) || (month === startM && day >= startD);
                const isBeforeEnd = (month < endM) || (month === endM && day <= endD);
                if (isAfterStart || isBeforeEnd) return holiday;
            }
        }
    }
    return null;
}

export function getServiceDuration(
    serviceId: string | null,
    services: Service[]
): number {
    if (!serviceId) return DEFAULT_SERVICE_DURATION;
    const service = services.find(s => s.id === serviceId);
    return service?.duration ?? DEFAULT_SERVICE_DURATION;
}

export function calculateEndTime(startTime: string, durationMinutes: number): string {
    const startMinutes = timeToMinutes(startTime);
    return minutesToTime(startMinutes + durationMinutes);
}

// ============================================================================
// ADVANCED AVAILABILITY DETECTION
// ============================================================================

/**
 * Higher-level function to check if a day is fully booked.
 * It strictly generates slots for all periods to see if any are left.
 */
export function isDayFullyBooked(
    dateStr: string,
    workingPeriods: WorkingPeriod[],
    appointments: Appointment[],
    services: Service[],
    serviceDurationMinutes: number
): boolean {
    const dayPeriods = getPeriodsForDate(dateStr, workingPeriods);
    if (dayPeriods.length === 0) return false; // Closed days aren't "full" per se, they are "no periods"

    // If any period has at least one available slot, the day is NOT fully booked
    return dayPeriods.every(period => {
        const slots = getAvailableTimeSlots(period, appointments, services, serviceDurationMinutes, dateStr);
        return slots.length === 0;
    });
}

/**
 * Calculate the status of a date incorporating the "mode" and "exhaustion" logic.
 */
export function calculateDateStatus(
    date: Date,
    workingPeriods: WorkingPeriod[],
    holidays: Holiday[],
    appointments: Appointment[],
    services: Service[],
    serviceDurationMinutes: number,
    mode: AvailabilityMode = 'PUBLIC'
): DateStatus {
    const dateStr = format(date, 'yyyy-MM-dd');
    const today = startOfDay(new Date());

    if (isBefore(date, today)) return 'past';

    // Holiday Check
    const holiday = isDateHoliday(date, holidays);
    if (holiday && mode === 'PUBLIC') return 'holiday';

    // Working Periods Check
    const dayOfWeek = date.getDay();
    const dayPeriods = workingPeriods.filter(p => p.day_of_week === dayOfWeek);
    if (dayPeriods.length === 0 && mode === 'PUBLIC') return 'no_periods';

    // Exhaustion Check
    // We only show 'full' if there were periods to begin with
    if (dayPeriods.length > 0) {
        const confirmedInDay = appointments.filter(a => a.appointment_date === dateStr && a.status === 'confirmed');
        if (isDayFullyBooked(dateStr, workingPeriods, confirmedInDay, services, serviceDurationMinutes)) {
            return 'full';
        }
    }

    return 'available';
}

// ============================================================================
// DATE AVAILABILITY
// ============================================================================

/**
 * Generate a list of available dates for booking.
 * Now takes appointments to determine 'full' status.
 */
export function generateAvailableDates(
    workingPeriods: WorkingPeriod[],
    holidays: Holiday[],
    appointments: Appointment[],
    services: Service[],
    serviceDurationMinutes: number,
    bookingRangeDays: number = DEFAULT_BOOKING_RANGE_DAYS,
    startFromTomorrow: boolean = true,
    mode: AvailabilityMode = 'PUBLIC'
): AvailableDate[] {
    const dates: AvailableDate[] = [];
    const today = new Date();
    const startOffset = startFromTomorrow ? 1 : 0;

    for (let i = startOffset; i <= bookingRangeDays; i++) {
        const date = addDays(today, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const dateLabel = format(date, 'EEEE, MMMM d');

        const status = calculateDateStatus(
            date,
            workingPeriods,
            holidays,
            appointments,
            services,
            serviceDurationMinutes,
            mode
        );

        let reason: string | undefined;
        if (status === 'holiday') reason = isDateHoliday(date, holidays)?.note || 'Clinic is closed for holiday';
        if (status === 'no_periods') reason = 'Clinic is closed on this day';
        if (status === 'past') reason = 'This date has passed';
        if (status === 'full') reason = 'This day is fully booked';

        dates.push({
            date: dateStr,
            label: dateLabel,
            dayOfWeek: date.getDay(),
            status,
            reason
        });
    }

    return dates;
}

/**
 * Logic to suggest the next available date if current is full or closed.
 */
export function suggestNextAvailableDate(
    currentDateStr: string,
    availableDates: AvailableDate[]
): string | null {
    const currentIndex = availableDates.findIndex(d => d.date === currentDateStr);
    if (currentIndex === -1) return null;

    for (let i = currentIndex + 1; i < availableDates.length; i++) {
        if (availableDates[i].status === 'available') {
            return availableDates[i].date;
        }
    }
    return null;
}

// ============================================================================
// PERIOD AVAILABILITY
// ============================================================================

export function getPeriodsForDate(
    dateStr: string,
    workingPeriods: WorkingPeriod[]
): WorkingPeriod[] {
    const date = parseISO(dateStr);
    const dayOfWeek = date.getDay();
    return workingPeriods
        .filter(p => p.day_of_week === dayOfWeek)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));
}

export function calculatePeriodAvailability(
    dateStr: string,
    workingPeriods: WorkingPeriod[],
    appointments: Appointment[],
    services: Service[],
    serviceDurationMinutes: number
): AvailablePeriod[] {
    const dayPeriods = getPeriodsForDate(dateStr, workingPeriods);

    const confirmedAppointments = appointments.filter(
        apt => apt.appointment_date === dateStr && apt.status === 'confirmed'
    );

    return dayPeriods.map(period => {
        const slots = getAvailableTimeSlots(period, confirmedAppointments, services, serviceDurationMinutes, dateStr);
        const availableSlots = slots.length;

        let nextAvailableTime: string | null = null;
        if (availableSlots > 0) {
            nextAvailableTime = calculateNextAvailableTime(period, confirmedAppointments, services, serviceDurationMinutes);
        }

        return {
            period,
            status: availableSlots > 0 ? 'available' : 'full',
            availableSlots,
            nextAvailableTime,
        };
    });
}

// ============================================================================
// TIME SLOT CALCULATION
// ============================================================================

export function generateTimeSlots(
    period: WorkingPeriod,
    appointments: Appointment[],
    services: Service[],
    serviceDurationMinutes: number,
    dateStr?: string // Needed to check if today and current time
): TimeSlot[] {
    const periodStart = timeToMinutes(period.start_time);
    const periodEnd = timeToMinutes(period.end_time);
    const slots: TimeSlot[] = [];

    const periodAppointments = appointments.filter(apt =>
        apt.status === 'confirmed' && isTimeWithinPeriod(apt.start_time, period)
    );

    // If it's today, we must filter out past slots
    const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');
    const nowMinutes = isToday ? (new Date().getHours() * 60 + new Date().getMinutes()) : -1;

    for (let currentTime = periodStart; currentTime + serviceDurationMinutes <= periodEnd; currentTime += SLOT_INCREMENT_MINUTES) {
        if (isToday && currentTime <= nowMinutes) continue;

        const timeStr = minutesToTime(currentTime);
        const proposedEnd = minutesToTime(currentTime + serviceDurationMinutes);

        const hasConflict = periodAppointments.some(apt => {
            const aptDuration = getServiceDuration(apt.service_id, services);
            const aptEnd = calculateEndTime(apt.start_time, aptDuration);
            return timeRangesOverlap(timeStr, proposedEnd, apt.start_time, aptEnd);
        });

        slots.push({
            time: timeStr,
            available: !hasConflict,
            reason: hasConflict ? 'This time is already booked' : undefined,
        });
    }

    return slots;
}

export function getAvailableTimeSlots(
    period: WorkingPeriod,
    appointments: Appointment[],
    services: Service[],
    serviceDurationMinutes: number,
    dateStr?: string
): string[] {
    const allSlots = generateTimeSlots(period, appointments, services, serviceDurationMinutes, dateStr);
    return allSlots.filter(slot => slot.available).map(slot => slot.time);
}

export function calculateNextAvailableTime(
    period: WorkingPeriod,
    appointments: Appointment[],
    services: Service[],
    serviceDurationMinutes: number
): string | null {
    const slots = getAvailableTimeSlots(period, appointments, services, serviceDurationMinutes);
    return slots.length > 0 ? slots[0] : null;
}

// ============================================================================
// BOOKING VALIDATION
// ============================================================================

export function validateBooking(
    dateStr: string,
    startTime: string,
    serviceDurationMinutes: number,
    workingPeriods: WorkingPeriod[],
    holidays: Holiday[],
    appointments: Appointment[],
    services: Service[],
    mode: AvailabilityMode = 'PUBLIC',
    periodId?: string
): BookingValidation {
    const errors: string[] = [];
    const date = parseISO(dateStr);
    const today = startOfDay(new Date());

    // 1. Basic Date Check
    if (isBefore(date, today)) {
        errors.push('Cannot book past dates');
        return { isValid: false, errors };
    }

    // 2. Mode Specific Checks
    if (mode === 'PUBLIC') {
        const holiday = isDateHoliday(date, holidays);
        if (holiday) {
            errors.push(holiday.note || 'Clinic is closed for holiday');
            return { isValid: false, errors };
        }

        const dayPeriods = getPeriodsForDate(dateStr, workingPeriods);
        if (dayPeriods.length === 0) {
            errors.push('Clinic is closed on this day');
            return { isValid: false, errors };
        }

        let targetPeriod: WorkingPeriod | undefined;
        if (periodId) {
            targetPeriod = dayPeriods.find(p => p.id === periodId);
        } else {
            targetPeriod = dayPeriods.find(p => isTimeWithinPeriod(startTime, p));
        }

        if (!targetPeriod) {
            errors.push('Selected time is outside working hours');
            return { isValid: false, errors };
        }

        if (!isTimeWithinPeriod(startTime, targetPeriod)) {
            errors.push(`Time must be between ${normalizeTime(targetPeriod.start_time)} and ${normalizeTime(targetPeriod.end_time)}`);
            return { isValid: false, errors };
        }

        const endMinutes = timeToMinutes(startTime) + serviceDurationMinutes;
        const periodEnd = timeToMinutes(targetPeriod.end_time);
        if (endMinutes > periodEnd) {
            errors.push('Appointment extends beyond the working period');
            return { isValid: false, errors };
        }
    }

    // 3. Overlap Check (Common for both modes)
    const proposedEnd = calculateEndTime(startTime, serviceDurationMinutes);
    const confirmedAppointments = appointments.filter(
        apt => apt.appointment_date === dateStr && apt.status === 'confirmed'
    );

    for (const apt of confirmedAppointments) {
        const aptDuration = getServiceDuration(apt.service_id, services);
        const aptEnd = calculateEndTime(apt.start_time, aptDuration);

        if (timeRangesOverlap(startTime, proposedEnd, apt.start_time, aptEnd)) {
            errors.push(`This time overlaps with an existing appointment at ${normalizeTime(apt.start_time)}`);
            return { isValid: false, errors };
        }
    }

    return { isValid: true, errors: [] };
}

export function formatPeriodDisplay(period: WorkingPeriod): string {
    const start = normalizeTime(period.start_time);
    const end = normalizeTime(period.end_time);
    return `${period.name} (${start} – ${end})`;
}

/**
 * Legacy wrapper for compatibility
 */
export function isDateAvailable(
    dateStr: string,
    workingPeriods: WorkingPeriod[],
    holidays: Holiday[]
): { available: boolean; reason?: string } {
    const status = calculateDateStatus(
        parseISO(dateStr),
        workingPeriods,
        holidays,
        [], // No appointments for basic check
        [], // No services for basic check
        30   // Default duration
    );

    return {
        available: status === 'available',
        reason: status !== 'available' ? 'Date is not available' : undefined
    };
}
