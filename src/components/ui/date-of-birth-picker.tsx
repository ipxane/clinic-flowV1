import * as React from "react";
import { format, parse, isValid, isAfter, isBefore, subYears } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface DateOfBirthPickerProps {
    value: string; // ISO format (YYYY-MM-DD)
    onChange: (value: string) => void;
    id?: string;
    className?: string;
    required?: boolean;
    disabled?: boolean;
    placeholder?: string;
}

export function DateOfBirthPicker({
    value,
    onChange,
    id,
    className,
    required,
    disabled,
    placeholder = "MM/DD/YYYY",
}: DateOfBirthPickerProps) {
    const [inputValue, setInputValue] = React.useState("");
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
        value ? new Date(value) : undefined
    );

    // Sync internal state with external value
    React.useEffect(() => {
        if (value) {
            const date = new Date(value);
            if (isValid(date)) {
                setInputValue(format(date, "MM/DD/YYYY"));
                setSelectedDate(date);
            }
        } else {
            setInputValue("");
            setSelectedDate(undefined);
        }
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, ""); // Remove non-digits

        // Auto-format MM/DD/YYYY
        if (val.length > 2 && val.length <= 4) {
            val = val.slice(0, 2) + "/" + val.slice(2);
        } else if (val.length > 4) {
            val = val.slice(0, 2) + "/" + val.slice(2, 4) + "/" + val.slice(4, 8);
        }

        setInputValue(val);

        // If we have a full date, try to parse it
        if (val.length === 10) {
            const parsedDate = parse(val, "MM/DD/YYYY", new Date());
            const minDate = subYears(new Date(), 120); // Reasonable age limit
            const maxDate = new Date();

            if (isValid(parsedDate) && isAfter(parsedDate, minDate) && isBefore(parsedDate, maxDate)) {
                const isoString = format(parsedDate, "yyyy-MM-dd");
                onChange(isoString);
                setSelectedDate(parsedDate);
            }
        }
    };

    const handleDateSelect = (date: Date | undefined) => {
        if (date) {
            const isoString = format(date, "yyyy-MM-dd");
            setInputValue(format(date, "MM/DD/YYYY"));
            setSelectedDate(date);
            onChange(isoString);
        }
    };

    return (
        <div className={cn("flex gap-2", className)}>
            <div className="relative flex-1">
                <Input
                    id={id}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    maxLength={10}
                    className="pr-10 border-input focus:ring-ring focus:border-ring text-base"
                />
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full w-10 text-muted-foreground hover:text-foreground"
                            disabled={disabled}
                            type="button"
                        >
                            <CalendarIcon className="h-4 w-4" />
                            <span className="sr-only">Open calendar</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={handleDateSelect}
                            disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                            captionLayout="dropdown-buttons"
                            fromYear={1900}
                            toYear={new Date().getFullYear()}
                        />
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
}
