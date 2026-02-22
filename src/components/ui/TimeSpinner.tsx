import * as React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface TimeSpinnerProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  min: number;
  max: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  hasError?: boolean;
}

export function TimeSpinner({
  value,
  onChange,
  onBlur,
  min,
  max,
  placeholder = "00",
  className,
  disabled = false,
  hasError = false,
}: TimeSpinnerProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Handle raw input - allow typing without auto-formatting
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "").slice(0, 2);
    onChange(rawValue);
  };

  // Validate and format on blur
  const handleBlur = () => {
    if (value) {
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue)) {
        // Clamp to valid range
        const clamped = Math.min(Math.max(numValue, min), max);
        onChange(clamped.toString().padStart(2, "0"));
      } else {
        onChange("");
      }
    }
    onBlur?.();
  };

  // Handle keyboard arrows
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      increment();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      decrement();
    }
  };

  // Increment value
  const increment = () => {
    const current = parseInt(value, 10) || 0;
    const next = current >= max ? min : current + 1;
    onChange(next.toString().padStart(2, "0"));
    inputRef.current?.focus();
  };

  // Decrement value
  const decrement = () => {
    const current = parseInt(value, 10) || 0;
    const next = current <= min ? max : current - 1;
    onChange(next.toString().padStart(2, "0"));
    inputRef.current?.focus();
  };

  return (
    <div className={cn("relative flex flex-col items-center", className)}>
      {/* Up button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-6 w-10 rounded-b-none border-b-0 hover:bg-muted"
        onClick={increment}
        disabled={disabled}
        tabIndex={-1}
      >
        <ChevronUp className="h-4 w-4" />
      </Button>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={2}
        className={cn(
          "h-10 w-14 border bg-background text-center font-mono text-lg",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          hasError && "border-destructive focus:ring-destructive",
          !hasError && "border-input"
        )}
      />

      {/* Down button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-6 w-10 rounded-t-none border-t-0 hover:bg-muted"
        onClick={decrement}
        disabled={disabled}
        tabIndex={-1}
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  );
}
