import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search, User, Baby, Users, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Patient, Guardian } from "@/hooks/usePatients";

interface PhoneSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onPatientSelect?: (patient: Patient) => void;
  onGuardianSelect?: (guardian: Guardian) => void;
  searchByPhone: (phone: string) => Promise<{ patients: Patient[]; guardians: Guardian[] }>;
  placeholder?: string;
  className?: string;
}

export function PhoneSearchInput({
  value,
  onChange,
  onPatientSelect,
  onGuardianSelect,
  searchByPhone,
  placeholder = "Search by phone number...",
  className,
}: PhoneSearchInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<{ patients: Patient[]; guardians: Guardian[] }>({
    patients: [],
    guardians: [],
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    // Only search if value looks like a phone number (contains digits)
    const hasDigits = /\d/.test(value);
    if (!value || value.length < 3 || !hasDigits) {
      setResults({ patients: [], guardians: [] });
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const searchResults = await searchByPhone(value);
      setResults(searchResults);
      setIsOpen(searchResults.patients.length > 0 || searchResults.guardians.length > 0);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [value, searchByPhone]);

  const handlePatientClick = (patient: Patient) => {
    onPatientSelect?.(patient);
    setIsOpen(false);
  };

  const handleGuardianClick = (guardian: Guardian) => {
    onGuardianSelect?.(guardian);
    setIsOpen(false);
  };

  const hasResults = results.patients.length > 0 || results.guardians.length > 0;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="tel"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => hasResults && setIsOpen(true)}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Dropdown results */}
      {isOpen && hasResults && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          <div className="max-h-[300px] overflow-auto p-1">
            {/* Patient results */}
            {results.patients.length > 0 && (
              <div>
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Patients
                </div>
                {results.patients.map((patient) => (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => handlePatientClick(patient)}
                    className="flex w-full items-center gap-3 rounded-sm px-2 py-2 text-sm hover:bg-accent focus:bg-accent focus:outline-none"
                  >
                    {patient.patient_type === "adult" ? (
                      <User className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Baby className="h-4 w-4 text-primary" />
                    )}
                    <div className="flex-1 text-left">
                      <p className="font-medium">{patient.full_name}</p>
                      <p className="text-xs text-muted-foreground">{patient.phone}</p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs",
                        patient.patient_type === "adult"
                          ? "bg-muted text-muted-foreground"
                          : "bg-primary/10 text-primary"
                      )}
                    >
                      {patient.patient_type === "adult" ? "Adult" : "Child"}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Guardian results */}
            {results.guardians.length > 0 && (
              <div>
                {results.patients.length > 0 && (
                  <div className="my-1 border-t" />
                )}
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Guardians
                </div>
                {results.guardians.map((guardian) => (
                  <button
                    key={guardian.id}
                    type="button"
                    onClick={() => handleGuardianClick(guardian)}
                    className="flex w-full items-center gap-3 rounded-sm px-2 py-2 text-sm hover:bg-accent focus:bg-accent focus:outline-none"
                  >
                    <Users className="h-4 w-4 text-primary" />
                    <div className="flex-1 text-left">
                      <p className="font-medium">{guardian.full_name}</p>
                      <p className="text-xs text-muted-foreground">{guardian.phone}</p>
                    </div>
                    <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">
                      Guardian
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
