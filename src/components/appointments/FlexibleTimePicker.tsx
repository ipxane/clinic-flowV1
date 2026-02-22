import { useState, useEffect, useMemo, useCallback } from "react";
import { Clock, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Sun, Sunset, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TimeSpinner } from "@/components/ui/TimeSpinner";
import { cn } from "@/lib/utils";
import {
  WorkingPeriod,
  Appointment as BookingAppointment,
  formatTimeDisplay,
  validateBooking,
  calculateNextAvailableTime
} from "@/lib/booking-engine";
import { format } from "date-fns";

// Period icons mapping
const periodIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Morning: Sun,
  Afternoon: Sunset,
  Evening: Moon,
};

interface FlexibleTimePickerProps {
  selectedDate: Date;
  periods: WorkingPeriod[];
  existingAppointments: BookingAppointment[];
  serviceDuration: number;
  value: string;
  periodName: string;
  onChange: (time: string, periodName: string) => void;
  suggestedTime?: string;
  suggestedPeriod?: string;
  disabled?: boolean;
  onValidationChange?: (isValid: boolean) => void;
}

export function FlexibleTimePicker({
  selectedDate,
  periods,
  existingAppointments,
  serviceDuration,
  value,
  periodName,
  onChange,
  suggestedTime,
  suggestedPeriod,
  disabled = false,
  onValidationChange,
}: FlexibleTimePickerProps) {
  // Selected period for period-first flow
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
  const [showManualSelection, setShowManualSelection] = useState(false);
  const [hourInput, setHourInput] = useState<string>("");
  const [minuteInput, setMinuteInput] = useState<string>("");

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  // Get selected period object
  const selectedPeriodObj = useMemo(() => {
    return periods.find(p => p.id === selectedPeriodId) || null;
  }, [periods, selectedPeriodId]);

  // Calculate first available time for selected period
  const firstAvailableInPeriod = useMemo(() => {
    if (!selectedPeriodObj || !serviceDuration) return null;

    // Modern engine calculateNextAvailableTime is scoped to a single period
    const time = calculateNextAvailableTime(
      selectedPeriodObj,
      existingAppointments,
      [], // services not needed for conflict check
      serviceDuration
    );

    if (time) {
      return { time, periodName: selectedPeriodObj.name };
    }
    return null;
  }, [selectedPeriodObj, serviceDuration, existingAppointments]);

  // Auto-select first period and time when service is selected
  useEffect(() => {
    if (suggestedPeriod && !selectedPeriodId && periods.length > 0) {
      const period = periods.find(p => p.name === suggestedPeriod);
      if (period) {
        setSelectedPeriodId(period.id);
      }
    }
  }, [suggestedPeriod, selectedPeriodId, periods]);

  // When period changes, auto-set first available time in that period
  useEffect(() => {
    if (firstAvailableInPeriod && selectedPeriodObj) {
      onChange(firstAvailableInPeriod.time, selectedPeriodObj.name);
      setShowManualSelection(false);
    }
  }, [firstAvailableInPeriod, selectedPeriodObj]);

  // Parse current value into hour/minute when in manual mode
  useEffect(() => {
    if (showManualSelection && value) {
      const [hour, minute] = value.split(":");
      setHourInput(hour);
      setMinuteInput(minute);
    }
  }, [value, showManualSelection]);

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
      [], // holidays usually handled at calendar level, but can be added if needed
      existingAppointments,
      [],
      'INTERNAL', // Use staff mode to bypass public holiday/working hour strictness if necessary
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

  // Handle period selection
  const handlePeriodSelect = (periodId: string) => {
    setSelectedPeriodId(periodId);
    setShowManualSelection(false);
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

  // Handle hour input change (raw, no formatting)
  const handleHourChange = (val: string) => {
    setHourInput(val);
  };

  // Handle minute input change (raw, no formatting)
  const handleMinuteChange = (val: string) => {
    setMinuteInput(val);
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
        Select a service to choose a time
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

      {/* Step 2: Time Display (after period is selected) */}
      {selectedPeriodObj && (
        <div className="space-y-3">
          {/* First Available Time */}
          {firstAvailableInPeriod ? (
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">
                    First Available in {selectedPeriodObj.name}
                  </Label>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-semibold">
                      {formatTimeDisplay(firstAvailableInPeriod.time)}
                    </span>
                    {endTime && value === firstAvailableInPeriod.time && (
                      <span className="text-sm text-muted-foreground">
                        → {formatTimeDisplay(endTime)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Duration: {serviceDuration} min
                  </p>
                </div>

                {value === firstAvailableInPeriod.time && validation.isValid && (
                  <div className="flex items-center gap-1.5 text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="text-sm font-medium">Selected</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">No available slots in {selectedPeriodObj.name}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Try selecting a different period
              </p>
            </div>
          )}

          {/* Manual Time Selection Toggle */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowManualSelection(!showManualSelection)}
              className="h-auto px-0 text-muted-foreground hover:text-foreground"
            >
              {showManualSelection ? (
                <ChevronUp className="mr-1.5 h-4 w-4" />
              ) : (
                <ChevronDown className="mr-1.5 h-4 w-4" />
              )}
              Manual Time Selection
            </Button>

            {showManualSelection && (
              <div className="space-y-3 rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">
                  Enter a custom time within {selectedPeriodObj.name} ({formatTimeDisplay(selectedPeriodObj.start_time)} - {formatTimeDisplay(selectedPeriodObj.end_time)})
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
                      hasError={!validation.isValid && !!value}
                    />
                    <span className="text-xl font-bold text-muted-foreground">:</span>
                    <TimeSpinner
                      value={minuteInput}
                      onChange={handleMinuteChange}
                      onBlur={handleMinuteBlur}
                      min={0}
                      max={59}
                      placeholder="MM"
                      hasError={!validation.isValid && !!value}
                    />
                  </div>

                  {/* Validation indicator */}
                  {value && (
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

                {/* Validation message */}
                {value && !validation.isValid && (
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
          </div>

          {/* Show current selection when not in manual mode */}
          {!showManualSelection && value && periodName && value !== firstAvailableInPeriod?.time && (
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {validation.isValid ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  )}
                  <div>
                    <span className="font-medium">
                      {formatTimeDisplay(value)}
                      {endTime && ` → ${formatTimeDisplay(endTime)}`}
                    </span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      {serviceDuration} min
                    </span>
                  </div>
                </div>

                {!validation.isValid && (
                  <p className="text-sm text-destructive">{validation.message}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Prompt to select period first */}
      {!selectedPeriodId && periods.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Select a period above to see available times
        </p>
      )}
    </div>
  );
}
