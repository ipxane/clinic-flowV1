import { useState, useEffect, useMemo, useCallback } from "react";
import { Phone, User, Baby, UserPlus, Check, AlertCircle, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { Patient, PatientType, usePatients } from "@/hooks/usePatients";
import { supabase } from "@/integrations/supabase/client";
import { DateOfBirthPicker } from "@/components/ui/date-of-birth-picker";

interface PatientPhoneSelectorProps {
  selectedPatient: Patient | null;
  onPatientSelect: (patient: Patient | null) => void;
  onNewPatientCreated?: (patient: Patient) => void;
}

interface NewPatientForm {
  full_name: string;
  phone: string;
  date_of_birth: string;
  patient_type: PatientType;
  guardian_name: string;
}

// Detect if input is a phone number (only digits) or a name (contains letters)
function isPhoneNumber(input: string): boolean {
  // Remove common phone formatting characters
  const cleaned = input.replace(/[\s\-\(\)\+]/g, "");
  // If it's only digits, treat as phone
  return /^\d+$/.test(cleaned);
}

export function PatientPhoneSelector({
  selectedPatient,
  onPatientSelect,
  onNewPatientCreated,
}: PatientPhoneSelectorProps) {
  const { patients, fetchPatients, checkPhoneExists } = usePatients();

  // Search state
  const [searchInput, setSearchInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // New patient creation state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newPatientForm, setNewPatientForm] = useState<NewPatientForm>({
    full_name: "",
    phone: "",
    date_of_birth: "",
    patient_type: "adult",
    guardian_name: "",
  });

  // Detect input type
  const inputType = useMemo(() => {
    if (!searchInput.trim()) return null;
    return isPhoneNumber(searchInput) ? "phone" : "name";
  }, [searchInput]);

  // Reset search state when input changes significantly, but NEVER reset selectedPatient
  useEffect(() => {
    if (searchInput.length < 2) {
      setHasSearched(false);
      setShowCreateForm(false);
    }
  }, [searchInput]);

  // Find matching patients by phone OR name
  const matchingPatients = useMemo(() => {
    if (searchInput.length < 2) return [];

    const query = searchInput.toLowerCase();

    // Find all non-archived patients matching this query
    const matches = patients.filter(p => {
      if (p.status === "archived") return false;

      if (inputType === "phone") {
        // Phone search - match direct phone or guardian phone
        const cleanedQuery = query.replace(/[\s\-\(\)\+]/g, "");
        const cleanedPhone = (p.phone || "").replace(/[\s\-\(\)\+]/g, "").toLowerCase();
        const cleanedGuardianPhone = (p.guardian?.phone || "").replace(/[\s\-\(\)\+]/g, "").toLowerCase();

        if (cleanedPhone.includes(cleanedQuery)) return true;
        if (p.patient_type === "child" && cleanedGuardianPhone.includes(cleanedQuery)) return true;
      } else {
        // Name search - match patient name or guardian name
        if (p.full_name.toLowerCase().includes(query)) return true;
        if (p.patient_type === "child" && p.guardian?.full_name?.toLowerCase().includes(query)) return true;
      }

      return false;
    });

    return matches;
  }, [patients, searchInput, inputType]);

  // Search handler with debounce
  const handleSearch = useCallback(() => {
    if (searchInput.length >= 2) {
      setIsSearching(true);
      setTimeout(() => {
        setHasSearched(true);
        setIsSearching(false);
      }, 200);
    }
  }, [searchInput]);

  // Trigger search when input has enough characters
  useEffect(() => {
    if (searchInput.length >= 3) {
      const timer = setTimeout(handleSearch, 300);
      return () => clearTimeout(timer);
    }
  }, [searchInput, handleSearch]);

  // Handle patient selection from list
  const handleSelectPatient = (patient: Patient) => {
    onPatientSelect(patient);
    setShowCreateForm(false);
    setSearchInput(""); // Clear search after selection
    setHasSearched(false);
  };

  // Clear selection - only clears patient, allows new search
  const handleClearSelection = () => {
    onPatientSelect(null);
    setSearchInput("");
    setHasSearched(false);
    setShowCreateForm(false);
  };

  // Start creating new patient - pre-fill based on input type
  const handleStartCreate = () => {
    setShowCreateForm(true);

    // Pre-fill based on input type
    if (inputType === "phone") {
      setNewPatientForm({
        full_name: "",
        phone: searchInput.replace(/[\s\-\(\)]/g, ""), // Clean phone
        date_of_birth: "",
        patient_type: "adult",
        guardian_name: "",
      });
    } else {
      // Input is a name
      setNewPatientForm({
        full_name: searchInput.trim(),
        phone: "",
        date_of_birth: "",
        patient_type: "adult",
        guardian_name: "",
      });
    }
    setCreateError(null);
  };

  // Handle new patient form submission
  const handleCreatePatient = async () => {
    setCreateError(null);

    // Validation
    if (!newPatientForm.full_name.trim()) {
      setCreateError("Full name is required");
      return;
    }
    if (!newPatientForm.phone.trim()) {
      setCreateError("Phone number is required");
      return;
    }
    if (!newPatientForm.date_of_birth) {
      setCreateError("Date of birth is required");
      return;
    }

    // For children, guardian name is required
    if (newPatientForm.patient_type === "child" && !newPatientForm.guardian_name.trim()) {
      setCreateError("Guardian name is required for child patients");
      return;
    }

    setIsCreating(true);

    try {
      // Check if phone already exists for adult
      if (newPatientForm.patient_type === "adult") {
        const exists = await checkPhoneExists(newPatientForm.phone);
        if (exists) {
          setCreateError("An adult patient with this phone number already exists");
          setIsCreating(false);
          return;
        }
      }

      let guardianId: string | null = null;

      // For child patients, create or find guardian
      if (newPatientForm.patient_type === "child") {
        // Check if guardian already exists
        const { data: existingGuardian } = await supabase
          .from("guardians")
          .select("id")
          .eq("phone", newPatientForm.phone)
          .single();

        if (existingGuardian) {
          guardianId = existingGuardian.id;
        } else {
          // Create new guardian
          const { data: newGuardian, error: guardianError } = await supabase
            .from("guardians")
            .insert({
              phone: newPatientForm.phone,
              full_name: newPatientForm.guardian_name,
            })
            .select()
            .single();

          if (guardianError) throw guardianError;
          guardianId = newGuardian.id;
        }
      }

      // Create the patient
      const patientData: {
        patient_type: PatientType;
        full_name: string;
        phone: string | null;
        date_of_birth: string;
        guardian_id: string | null;
        status: "active";
      } = {
        patient_type: newPatientForm.patient_type,
        full_name: newPatientForm.full_name,
        phone: newPatientForm.patient_type === "adult" ? newPatientForm.phone : null,
        date_of_birth: newPatientForm.date_of_birth,
        guardian_id: guardianId,
        status: "active",
      };

      const { data: createdPatient, error: patientError } = await supabase
        .from("patients")
        .insert(patientData)
        .select(`*, guardian:guardians(*)`)
        .single();

      if (patientError) throw patientError;

      // Refresh patients list
      await fetchPatients();

      // Select the new patient
      const newPatient = createdPatient as Patient;
      onPatientSelect(newPatient);
      onNewPatientCreated?.(newPatient);

      // Reset form state
      setShowCreateForm(false);
      setSearchInput("");
      setHasSearched(false);
      setNewPatientForm({
        full_name: "",
        phone: "",
        date_of_birth: "",
        patient_type: "adult",
        guardian_name: "",
      });
    } catch (error) {
      console.error("Error creating patient:", error);
      setCreateError("Failed to create patient. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  // If patient is already selected, show selection summary
  if (selectedPatient) {
    return (
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Patient
        </Label>
        <div className="flex items-center justify-between rounded-md border bg-muted/30 p-3">
          <div className="flex items-center gap-3">
            {selectedPatient.patient_type === "adult" ? (
              <User className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Baby className="h-5 w-5 text-primary" />
            )}
            <div>
              <p className="font-medium">{selectedPatient.full_name}</p>
              <p className="text-sm text-muted-foreground">
                {selectedPatient.phone || selectedPatient.guardian?.phone}
                {selectedPatient.patient_type === "child" && " (Guardian)"}
              </p>
            </div>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                selectedPatient.patient_type === "adult"
                  ? "bg-muted text-muted-foreground"
                  : "bg-primary/10 text-primary"
              )}
            >
              {selectedPatient.patient_type === "adult" ? "Adult" : "Child"}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearSelection}
          >
            Change
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <Search className="h-4 w-4" />
        Find or Create Patient
      </Label>

      {/* Search Input - works for both phone and name */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Enter phone number or name..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearch();
            }
          }}
          className="pl-10"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Input type indicator */}
      {searchInput.length >= 2 && inputType && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          {inputType === "phone" ? (
            <>
              <Phone className="h-3 w-3" /> Searching by phone number
            </>
          ) : (
            <>
              <User className="h-3 w-3" /> Searching by name
            </>
          )}
        </p>
      )}

      {/* Search Results */}
      {hasSearched && !showCreateForm && (
        <div className="rounded-md border">
          {matchingPatients.length > 0 ? (
            <div className="divide-y">
              <div className="bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
                {matchingPatients.length} patient{matchingPatients.length !== 1 ? "s" : ""} found
              </div>
              {matchingPatients.map((patient) => (
                <button
                  key={patient.id}
                  type="button"
                  onClick={() => handleSelectPatient(patient)}
                  className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-accent"
                >
                  {patient.patient_type === "adult" ? (
                    <User className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Baby className="h-5 w-5 text-primary" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{patient.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {patient.phone || patient.guardian?.phone}
                      {patient.patient_type === "child" && patient.guardian && (
                        <span> • Guardian: {patient.guardian.full_name}</span>
                      )}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      patient.patient_type === "adult"
                        ? "bg-muted text-muted-foreground"
                        : "bg-primary/10 text-primary"
                    )}
                  >
                    {patient.patient_type === "adult" ? "Adult" : "Child"}
                  </span>
                </button>
              ))}

              {/* Option to create new even if matches exist */}
              <button
                type="button"
                onClick={handleStartCreate}
                className="flex w-full items-center gap-3 px-3 py-3 text-left text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <UserPlus className="h-5 w-5" />
                <span>Create new patient</span>
              </button>
            </div>
          ) : (
            <div className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                No patients found
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleStartCreate}
                className="mt-3 w-full"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Create new patient & book appointment
              </Button>
            </div>
          )}
        </div>
      )}

      {/* New Patient Form */}
      {showCreateForm && (
        <div className="rounded-md border bg-muted/30 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              New Patient
            </h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowCreateForm(false)}
            >
              Cancel
            </Button>
          </div>

          {createError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {createError}
            </div>
          )}

          {/* Patient Type */}
          <div className="space-y-2">
            <Label>Patient Type</Label>
            <RadioGroup
              value={newPatientForm.patient_type}
              onValueChange={(value: PatientType) =>
                setNewPatientForm({ ...newPatientForm, patient_type: value })
              }
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="adult" id="type-adult" />
                <Label htmlFor="type-adult" className="flex items-center gap-1 cursor-pointer">
                  <User className="h-4 w-4" />
                  Adult
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="child" id="type-child" />
                <Label htmlFor="type-child" className="flex items-center gap-1 cursor-pointer">
                  <Baby className="h-4 w-4" />
                  Child
                </Label>
              </div>
            </RadioGroup>
            {newPatientForm.patient_type === "child" && (
              <p className="text-xs text-muted-foreground">
                The phone number will be used as the guardian's contact
              </p>
            )}
          </div>

          {/* Guardian Name (for children) */}
          {newPatientForm.patient_type === "child" && (
            <div className="space-y-2">
              <Label htmlFor="guardian-name">Guardian Name *</Label>
              <Input
                id="guardian-name"
                placeholder="Enter guardian's full name"
                value={newPatientForm.guardian_name}
                onChange={(e) =>
                  setNewPatientForm({ ...newPatientForm, guardian_name: e.target.value })
                }
              />
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="patient-name">
              {newPatientForm.patient_type === "child" ? "Child's" : "Patient"} Full Name *
            </Label>
            <Input
              id="patient-name"
              placeholder="Enter full name"
              value={newPatientForm.full_name}
              onChange={(e) =>
                setNewPatientForm({ ...newPatientForm, full_name: e.target.value })
              }
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="patient-phone">
              {newPatientForm.patient_type === "child" ? "Guardian Phone" : "Phone"} *
            </Label>
            <Input
              id="patient-phone"
              type="tel"
              placeholder="Enter phone number"
              value={newPatientForm.phone}
              onChange={(e) =>
                setNewPatientForm({ ...newPatientForm, phone: e.target.value })
              }
            />
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <Label htmlFor="patient-dob">Date of Birth *</Label>
            <DateOfBirthPicker
              id="patient-dob"
              value={newPatientForm.date_of_birth}
              onChange={(value) => setNewPatientForm({ ...newPatientForm, date_of_birth: value })}
              required
            />
          </div>

          {/* Submit Button */}
          <Button
            type="button"
            onClick={handleCreatePatient}
            disabled={isCreating}
            className="w-full"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Create Patient & Continue
              </>
            )}
          </Button>
        </div>
      )}

      {/* Helper text */}
      {!hasSearched && searchInput.length < 2 && (
        <p className="text-xs text-muted-foreground">
          Enter phone or name to search (at least 2 characters)
        </p>
      )}
    </div>
  );
}
