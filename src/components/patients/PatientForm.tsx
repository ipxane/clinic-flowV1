import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Check, AlertCircle, Users } from "lucide-react";
import { PatientFormData, PatientType, Guardian, Patient } from "@/hooks/usePatients";
import { cn } from "@/lib/utils";
import { DateOfBirthPicker } from "@/components/ui/date-of-birth-picker";

interface PatientFormProps {
  initialData?: Patient;
  onSubmit: (data: PatientFormData) => Promise<boolean>;
  onCancel: () => void;
  findGuardianByPhone: (phone: string) => Guardian | null;
  searchGuardiansByPhone: (phone: string) => Guardian[];
  isSubmitting: boolean;
}

export function PatientForm({
  initialData,
  onSubmit,
  onCancel,
  findGuardianByPhone,
  searchGuardiansByPhone,
  isSubmitting,
}: PatientFormProps) {
  const [patientType, setPatientType] = useState<PatientType>(
    initialData?.patient_type || "adult"
  );
  const [fullName, setFullName] = useState(initialData?.full_name || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [dateOfBirth, setDateOfBirth] = useState(initialData?.date_of_birth || "");
  const [notes, setNotes] = useState(initialData?.notes || "");

  // Guardian fields
  const [guardianPhone, setGuardianPhone] = useState(
    initialData?.guardian?.phone || ""
  );
  const [guardianName, setGuardianName] = useState(
    initialData?.guardian?.full_name || ""
  );
  const [guardianEmail, setGuardianEmail] = useState(
    initialData?.guardian?.email || ""
  );
  const [guardianLookupStatus, setGuardianLookupStatus] = useState<
    "idle" | "searching" | "found" | "not_found"
  >("idle");
  const [foundGuardian, setFoundGuardian] = useState<Guardian | null>(null);

  // Guardian autocomplete state
  const [guardianSuggestions, setGuardianSuggestions] = useState<Guardian[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const guardianInputRef = useRef<HTMLDivElement>(null);

  // Reset form when type changes
  useEffect(() => {
    if (!initialData) {
      setFullName("");
      setPhone("");
      setEmail("");
      setDateOfBirth("");
      setNotes("");
      setGuardianPhone("");
      setGuardianName("");
      setGuardianEmail("");
      setGuardianLookupStatus("idle");
      setFoundGuardian(null);
      setGuardianSuggestions([]);
      setShowSuggestions(false);
    }
  }, [patientType, initialData]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (guardianInputRef.current && !guardianInputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Guardian phone autocomplete with debounce - isolated from patient search
  useEffect(() => {
    if (patientType !== "child" || !guardianPhone || guardianPhone.length < 1) {
      setGuardianSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Don't search if we already selected a guardian
    if (foundGuardian && foundGuardian.phone === guardianPhone) {
      return;
    }

    setIsSearchingSuggestions(true);
    const timer = setTimeout(() => {
      // Synchronous call - uses local state
      const results = searchGuardiansByPhone(guardianPhone);
      setGuardianSuggestions(results);
      setShowSuggestions(results.length > 0);
      setIsSearchingSuggestions(false);
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guardianPhone, patientType, searchGuardiansByPhone]);

  // Guardian exact match lookup (for validation) with debounce
  useEffect(() => {
    if (patientType !== "child" || !guardianPhone || guardianPhone.length < 5) {
      setGuardianLookupStatus("idle");
      return;
    }

    // If editing and guardian phone hasn't changed, skip lookup
    if (initialData?.guardian?.phone === guardianPhone) {
      setGuardianLookupStatus("found");
      setFoundGuardian(initialData.guardian);
      setGuardianName(initialData.guardian.full_name);
      setGuardianEmail(initialData.guardian.email || "");
      return;
    }

    setGuardianLookupStatus("searching");

    const timer = setTimeout(() => {
      // Synchronous call - uses local state
      const guardian = findGuardianByPhone(guardianPhone);

      if (guardian) {
        setGuardianLookupStatus("found");
        setFoundGuardian(guardian);
        setGuardianName(guardian.full_name);
        setGuardianEmail(guardian.email || "");
      } else {
        setGuardianLookupStatus("not_found");
        setFoundGuardian(null);
      }
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guardianPhone, patientType, initialData?.guardian?.phone, findGuardianByPhone]);

  const handleGuardianSelect = (guardian: Guardian) => {
    setGuardianPhone(guardian.phone);
    setGuardianName(guardian.full_name);
    setGuardianEmail(guardian.email || "");
    setFoundGuardian(guardian);
    setGuardianLookupStatus("found");
    setShowSuggestions(false);
    setGuardianSuggestions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData: PatientFormData = {
      patient_type: patientType,
      full_name: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      date_of_birth: dateOfBirth,
      notes: notes.trim(),
      guardian_phone: guardianPhone.trim(),
      guardian_name: guardianName.trim(),
      guardian_email: guardianEmail.trim(),
    };

    const success = await onSubmit(formData);
    if (success) {
      onCancel();
    }
  };

  const isFormValid = () => {
    if (patientType === "adult") {
      return fullName.trim() !== "" && phone.trim() !== "";
    }

    // Child validation
    const hasBasicInfo = fullName.trim() !== "" && dateOfBirth !== "";
    const hasGuardian = guardianPhone.trim() !== "" &&
      (guardianLookupStatus === "found" ||
        (guardianLookupStatus === "not_found" && guardianName.trim() !== ""));

    return hasBasicInfo && hasGuardian;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Patient Type Selector */}
      <div className="space-y-2">
        <Label>Patient Type</Label>
        <Select
          value={patientType}
          onValueChange={(value: PatientType) => setPatientType(value)}
          disabled={!!initialData}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="adult">Adult</SelectItem>
            <SelectItem value="child">Child</SelectItem>
          </SelectContent>
        </Select>
        {initialData && (
          <p className="text-xs text-muted-foreground">
            Patient type cannot be changed after creation
          </p>
        )}
      </div>

      {/* Adult-specific fields: Phone, Name, DOB, Email, Notes */}
      {patientType === "adult" && (
        <>
          {/* 1. Phone Number (required - primary identifier) */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 234-567-8901"
              required
            />
            <p className="text-xs text-muted-foreground">
              Phone number is the primary patient identifier
            </p>
          </div>

          {/* 2. Full Name (required) */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter patient name"
              required
            />
          </div>

          {/* 3. Date of Birth (required) */}
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth *</Label>
            <DateOfBirthPicker
              id="dateOfBirth"
              value={dateOfBirth}
              onChange={setDateOfBirth}
              required
            />
          </div>

          {/* 4. Email (optional) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email (Optional)</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="patient@email.com"
            />
          </div>
        </>
      )}

      {/* Child-specific fields: Name, DOB then Guardian section */}
      {patientType === "child" && (
        <>
          {/* 1. Child Full Name (required) */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Child Full Name *</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter child's name"
              required
            />
          </div>

          {/* 2. Date of Birth (required) */}
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth *</Label>
            <DateOfBirthPicker
              id="dateOfBirth"
              value={dateOfBirth}
              onChange={setDateOfBirth}
              required
            />
          </div>

          {/* Guardian Section */}
          <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
            <h4 className="font-medium text-sm">Guardian Information</h4>

            <div className="space-y-2">
              <Label htmlFor="guardianPhone">Guardian Phone Number *</Label>
              <div ref={guardianInputRef} className="relative">
                <Input
                  id="guardianPhone"
                  type="tel"
                  value={guardianPhone}
                  onChange={(e) => {
                    setGuardianPhone(e.target.value);
                    // Reset found guardian when typing
                    if (foundGuardian && e.target.value !== foundGuardian.phone) {
                      setFoundGuardian(null);
                      setGuardianLookupStatus("idle");
                    }
                  }}
                  onFocus={() => guardianSuggestions.length > 0 && setShowSuggestions(true)}
                  placeholder="+1 234-567-8901"
                  required
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {(guardianLookupStatus === "searching" || isSearchingSuggestions) && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  {guardianLookupStatus === "found" && (
                    <Check className="h-4 w-4 text-status-confirmed" />
                  )}
                  {guardianLookupStatus === "not_found" && (
                    <AlertCircle className="h-4 w-4 text-status-pending" />
                  )}
                </div>

                {/* Guardian suggestions dropdown */}
                {showSuggestions && guardianSuggestions.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
                    <div className="max-h-[200px] overflow-auto p-1">
                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                        Existing Guardians
                      </div>
                      {guardianSuggestions.map((guardian) => (
                        <button
                          key={guardian.id}
                          type="button"
                          onClick={() => handleGuardianSelect(guardian)}
                          className="flex w-full items-center gap-3 rounded-sm px-2 py-2 text-sm hover:bg-accent focus:bg-accent focus:outline-none"
                        >
                          <Users className="h-4 w-4 text-primary" />
                          <div className="flex-1 text-left">
                            <p className="font-medium">{guardian.full_name}</p>
                            <p className="text-xs text-muted-foreground">{guardian.phone}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {guardianLookupStatus === "found" && foundGuardian && (
                <p className="text-sm text-status-confirmed">
                  Guardian found: {foundGuardian.full_name}
                </p>
              )}
              {guardianLookupStatus === "not_found" && (
                <p className="text-sm text-status-pending">
                  Guardian not found. Please enter guardian details below.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="guardianName">
                Guardian Name {guardianLookupStatus === "found" ? "" : "*"}
              </Label>
              <Input
                id="guardianName"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                placeholder="Guardian full name"
                disabled={guardianLookupStatus === "found"}
                required={guardianLookupStatus === "not_found"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guardianEmail">Guardian Email (Optional)</Label>
              <Input
                id="guardianEmail"
                type="email"
                value={guardianEmail}
                onChange={(e) => setGuardianEmail(e.target.value)}
                placeholder="guardian@email.com"
                disabled={guardianLookupStatus === "found"}
              />
            </div>
          </div>
        </>
      )}

      {/* Notes - Common */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional notes..."
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!isFormValid() || isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Save Changes" : "Add Patient"}
        </Button>
      </div>
    </form>
  );
}
