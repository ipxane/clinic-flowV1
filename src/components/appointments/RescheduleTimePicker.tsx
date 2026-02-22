import { useState, useEffect, useMemo, useCallback } from "react";
import { Clock, AlertCircle, CheckCircle2, Sun, Sunset, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TimeSpinner } from "@/components/ui/TimeSpinner";
import { cn } from "@/lib/utils";
import {
  WorkingPeriod,
  Appointment as BookingAppointment,
  formatTimeDisplay,
  validateBooking
} from "@/lib/booking-engine";
import { format } from "date-fns";

// Period icons mapping
const periodIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Morning: Sun,
  Afternoon: Sunset,
  Evening: Moon,
  Night: Moon,
};

interface RescheduleTimePickerProps {
  selectedDate: Date;
  periods: WorkingPeriod[];
  existingAppointments: BookingAppointment[];
  serviceDuration: number;
  value: string;
  periodName: string;
  onChange: (time: string, periodName: string) => void;
  disabled?: boolean;
  onValidationChange?: (isValid: boolean) => void;
}

/**
 * A manual-only time picker for rescheduling appointments.
 * No automatic suggestions - staff must manually select period and time.
 */
export function RescheduleTimePicker({
  selectedDate,
  periods,
  existingAppointments,
  serviceDuration,
  value,
  periodName,
  onChange,
  disabled = false,
  onValidationChange,
}: RescheduleTimePickerProps) {
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
  const [hourInput, setHourInput] = useState<string>("");
  const [minuteInput, setMinuteInput] = useState<string>("");
  const [hasManuallyEdited, setHasManuallyEdited] = useState(false);

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  // Get selected period object
  const selectedPeriodObj = useMemo(() => {
    return periods.find(p => p.id === selectedPeriodId) || null;
  }, [periods, selectedPeriodId]);

  // Validate current selection
  const validation = useMemo(() => {
    if (!value) {
      return { isValid: false, message: "Select a time" };
    }

    // Use modern validateBooking
    const result = validateBooking(
      dateStr,
      value,
      serviceDuration,
      periods,
      [],
      existingAppointments,
      [],
      'INTERNAL', // Use staff mode
      selectedPeriodId
    );

    return {
      isValid: result.isValid,
      message: result.errors[0] || "Invalid selection"
    };
  }, [value, serviceDuration, periods, existingAppointments, dateStr, selectedPeriodId]);

  // Notify parent of validation state
  useEffect(() => {
    onValidationChange?.(validation.isValid);
  }, [validation.isValid, onValidationChange]);

  // Calculate end time for display
  const endTime = useMemo(() => {
    if (!value) return null;

    const [hour, minute] = value.split(":").map(Number);
    if (isNaN(hour) || isNaN(minute)) return null;

    const totalMinutes = hour * 60 + minute + serviceDuration;
    const endHour = Math.floor(totalMinutes / 60) % 24;
    const endMin = totalMinutes % 60;
    return `${endHour.toString().padStart(2, "0")}:${endMin.toString().padStart(2, "0")}`;
  }, [value, serviceDuration]);

  // Handle period selection - auto-fill with period start time
  const handlePeriodSelect = (periodId: string) => {
    setSelectedPeriodId(periodId);
    setHasManuallyEdited(false); // Reset manual edit flag on period change
    const period = periods.find(p => p.id === periodId);
    if (period) {
      // Parse period start time and auto-fill inputs
      const [hour, minute] = period.start_time.split(":");
      setHourInput(hour);
      setMinuteInput(minute);
      onChange(period.start_time, period.name);
    }
  };

  // Handle manual time input - validate and update only on blur
  const updateTimeFromInputs = useCallback((hour: string, minute: string) => {
    const h = parseInt(hour, 10);
    const m = parseInt(minute, 10);

    if (!isNaN(h) && h >= 0 && h <= 23 && !isNaN(m) && m >= 0 && m <= 59) {
      const timeStr = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      if (selectedPeriodObj) {
        onChange(timeStr, selectedPeriodObj.name);
      }
    }
  }, [selectedPeriodObj, onChange]);

  // Handle hour input change
  const handleHourChange = (val: string) => {
    setHourInput(val);
    setHasManuallyEdited(true);
  };

  // Handle minute input change
  const handleMinuteChange = (val: string) => {
    setMinuteInput(val);
    setHasManuallyEdited(true);
  };

  // Handle blur to validate and update time
  const handleHourBlur = () => {
    if (hourInput && minuteInput) {
      updateTimeFromInputs(hourInput, minuteInput);
    }
  };

  const handleMinuteBlur = () => {
    if (hourInput && minuteInput) {
      updateTimeFromInputs(hourInput, minuteInput);
    }
  };

  if (disabled) {
    return (
      <div className="text-sm text-muted-foreground">
        Select a date to choose a time
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Step 1: Period Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Select Period</Label>
        <div className="flex flex-wrap gap-2">
          {periods.map((period) => {
            const PeriodIcon = periodIcons[period.name] || Clock;
            const isSelected = period.id === selectedPeriodId;

            return (
              <Button
                key={period.id}
                type="button"
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => handlePeriodSelect(period.id)}
                className="gap-1.5"
              >
                <PeriodIcon className="h-4 w-4" />
                {period.name}
                <span className="text-xs opacity-70">
                  ({formatTimeDisplay(period.start_time)} - {formatTimeDisplay(period.end_time)})
                </span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Manual Time Selection (after period is selected) */}
      {selectedPeriodObj && (
        <div className="space-y-3 rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">
            Enter time within {selectedPeriodObj.name} ({formatTimeDisplay(selectedPeriodObj.start_time)} - {formatTimeDisplay(selectedPeriodObj.end_time)})
          </p>

          {/* Time Input with Spinners */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <TimeSpinner
                value={hourInput}
                onChange={handleHourChange}
                onBlur={handleHourBlur}
                min={0}
                max={23}
                placeholder="HH"
                hasError={hasManuallyEdited && !validation.isValid && !!value}
              />
              <span className="text-xl font-bold text-muted-foreground">:</span>
              <TimeSpinner
                value={minuteInput}
                onChange={handleMinuteChange}
                onBlur={handleMinuteBlur}
                min={0}
                max={59}
                placeholder="MM"
                hasError={hasManuallyEdited && !validation.isValid && !!value}
              />
            </div>

            {/* Validation indicator - only show after manual edit or when valid */}
            {value && (validation.isValid || hasManuallyEdited) && (
              <div className="flex items-center gap-1.5">
                {validation.isValid ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                )}
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Use keyboard arrows (↑↓) or the buttons to adjust time
          </p>

          {/* Validation message - only show after manual edit */}
          {hasManuallyEdited && value && !validation.isValid && (
            <p className="text-sm text-destructive flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {validation.message}
            </p>
          )}

          {/* Selected time display with end time */}
          {value && periodName && validation.isValid && endTime && (
            <div className="flex items-center gap-2 pt-1">
              <Badge variant="outline" className="gap-1.5">
                <Clock className="h-3 w-3" />
                {formatTimeDisplay(value)} → {formatTimeDisplay(endTime)}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {serviceDuration} min
              </span>
            </div>
          )}
        </div>
      )}

      {/* Prompt to select period first */}
      {!selectedPeriodId && periods.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Select a period above to enter a time
        </p>
      )}
    </div>
  );
}
