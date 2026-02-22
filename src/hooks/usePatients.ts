import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type PatientType = "adult" | "child";
export type PatientStatus = "active" | "follow_up" | "archived";

export interface Guardian {
  id: string;
  phone: string;
  full_name: string;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  patient_type: PatientType;
  status: PatientStatus;
  full_name: string;
  phone: string | null;
  email: string | null;
  date_of_birth: string | null;
  notes: string | null;
  guardian_id: string | null;
  created_at: string;
  updated_at: string;
  guardian?: Guardian | null;
}

export interface PatientFormData {
  patient_type: PatientType;
  full_name: string;
  phone: string;
  email: string;
  date_of_birth: string;
  notes: string;
  guardian_phone: string;
  guardian_name: string;
  guardian_email: string;
}

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("patients")
        .select(`
          *,
          guardian:guardians(*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPatients(data as Patient[]);
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast({
        title: "Error",
        description: "Failed to fetch patients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchGuardians = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("guardians")
        .select("*")
        .order("full_name");

      if (error) throw error;
      setGuardians(data as Guardian[]);
      return data as Guardian[];
    } catch (error) {
      console.error("Error fetching guardians:", error);
      return [];
    }
  }, []);

  useEffect(() => {
    fetchPatients();
    fetchGuardians();
  }, [fetchPatients, fetchGuardians]);

  const checkPhoneExists = async (phone: string, excludePatientId?: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from("patients")
      .select("id")
      .eq("phone", phone)
      .neq("patient_type", "child");

    if (error) {
      console.error("Error checking phone:", error);
      return false;
    }

    if (excludePatientId) {
      return data.some((p) => p.id !== excludePatientId);
    }
    return data.length > 0;
  };

  // Find guardian by exact phone - checks ONLY ACTIVE adult patients
  // STRICT: Only status === "active" patients can be guardians
  const findGuardianByPhone = useCallback((phone: string): Guardian | null => {
    if (!phone) return null;
    
    // Check ONLY ACTIVE adult patients - single source of truth
    // status must be exactly "active" - not "follow_up", not "archived"
    const adultPatient = patients.find(
      p => p.patient_type === "adult" && 
           p.phone === phone && 
           p.status === "active"
    );
    if (adultPatient) {
      return {
        id: adultPatient.id,
        phone: adultPatient.phone || "",
        full_name: adultPatient.full_name,
        email: adultPatient.email,
        created_at: adultPatient.created_at,
        updated_at: adultPatient.updated_at,
      };
    }
    
    // Fallback: check guardians table for existing guardian records
    // Only include if their linked patients are active
    const existingGuardian = guardians.find(g => g.phone === phone);
    if (existingGuardian) {
      // Verify this guardian is linked to at least one active patient
      const hasActiveChild = patients.some(
        p => p.guardian_id === existingGuardian.id && p.status === "active"
      );
      if (hasActiveChild) return existingGuardian;
    }
    
    return null;
  }, [guardians, patients]);

  // Search guardians by partial phone - ONLY ACTIVE adult patients
  // STRICT: status must be exactly "active" - archived/follow_up/deleted NEVER appear
  const searchGuardiansByPhone = useCallback((phone: string): Guardian[] => {
    if (!phone || phone.length < 1) {
      return [];
    }
    const query = phone.toLowerCase();
    
    // Get matching ACTIVE adult patients ONLY (single source of truth)
    // STRICT: status === "active" - not "follow_up", not "archived"
    const matchingAdults = patients
      .filter(p => 
        p.patient_type === "adult" && 
        p.status === "active" &&
        p.phone?.toLowerCase().includes(query)
      )
      .map(p => ({
        id: p.id,
        phone: p.phone || "",
        full_name: p.full_name,
        email: p.email,
        created_at: p.created_at,
        updated_at: p.updated_at,
      }));
    
    return matchingAdults.slice(0, 5);
  }, [patients]);

  const createGuardian = async (phone: string, fullName: string, email?: string): Promise<Guardian | null> => {
    const { data, error } = await supabase
      .from("guardians")
      .insert({
        phone,
        full_name: fullName,
        email: email || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating guardian:", error);
      toast({
        title: "Error",
        description: "Failed to create guardian",
        variant: "destructive",
      });
      return null;
    }
    
    const newGuardian = data as Guardian;
    // Immediately update local state - this is the single source of truth
    setGuardians(prev => [...prev, newGuardian]);
    return newGuardian;
  };

  const createPatient = async (formData: PatientFormData): Promise<boolean> => {
    try {
      if (formData.patient_type === "adult") {
        // Check for duplicate phone
        const exists = await checkPhoneExists(formData.phone);
        if (exists) {
          toast({
            title: "Duplicate Phone Number",
            description: "A patient with this phone number already exists.",
            variant: "destructive",
          });
          return false;
        }

        const { error } = await supabase.from("patients").insert({
          patient_type: "adult",
          full_name: formData.full_name,
          phone: formData.phone,
          email: formData.email || null,
          date_of_birth: formData.date_of_birth || null,
          notes: formData.notes || null,
        });

        if (error) throw error;
      } else {
        // Child patient
        let guardianId: string;
        
        // Check if guardian already exists in guardians table
        const existingGuardian = guardians.find(g => g.phone === formData.guardian_phone);
        
        if (existingGuardian) {
          guardianId = existingGuardian.id;
        } else {
          // Guardian doesn't exist in guardians table - create one
          // This may be based on an adult patient or completely new
          const newGuardian = await createGuardian(
            formData.guardian_phone,
            formData.guardian_name,
            formData.guardian_email
          );
          if (!newGuardian) return false;
          guardianId = newGuardian.id;
        }

        const { error } = await supabase.from("patients").insert({
          patient_type: "child",
          full_name: formData.full_name,
          date_of_birth: formData.date_of_birth,
          guardian_id: guardianId,
          notes: formData.notes || null,
        });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Patient created successfully",
      });
      
      await fetchPatients();
      return true;
    } catch (error) {
      console.error("Error creating patient:", error);
      toast({
        title: "Error",
        description: "Failed to create patient",
        variant: "destructive",
      });
      return false;
    }
  };

  const updatePatient = async (id: string, formData: PatientFormData): Promise<boolean> => {
    try {
      if (formData.patient_type === "adult") {
        // Check for duplicate phone (excluding current patient)
        const exists = await checkPhoneExists(formData.phone, id);
        if (exists) {
          toast({
            title: "Duplicate Phone Number",
            description: "Another patient with this phone number already exists.",
            variant: "destructive",
          });
          return false;
        }

        const { error } = await supabase
          .from("patients")
          .update({
            full_name: formData.full_name,
            phone: formData.phone,
            email: formData.email || null,
            date_of_birth: formData.date_of_birth || null,
            notes: formData.notes || null,
          })
          .eq("id", id);

        if (error) throw error;
      } else {
        // Child patient
        let guardianId: string;
        
        // Check if guardian already exists in guardians table
        const existingGuardian = guardians.find(g => g.phone === formData.guardian_phone);
        
        if (existingGuardian) {
          guardianId = existingGuardian.id;
        } else {
          // Guardian doesn't exist - create new one
          const newGuardian = await createGuardian(
            formData.guardian_phone,
            formData.guardian_name,
            formData.guardian_email
          );
          if (!newGuardian) return false;
          guardianId = newGuardian.id;
        }

        const { error } = await supabase
          .from("patients")
          .update({
            full_name: formData.full_name,
            date_of_birth: formData.date_of_birth,
            guardian_id: guardianId,
            notes: formData.notes || null,
          })
          .eq("id", id);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Patient updated successfully",
      });
      
      await fetchPatients();
      return true;
    } catch (error) {
      console.error("Error updating patient:", error);
      toast({
        title: "Error",
        description: "Failed to update patient",
        variant: "destructive",
      });
      return false;
    }
  };

  const updatePatientStatus = async (id: string, status: PatientStatus): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("patients")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Patient status updated to ${status.replace("_", " ")}`,
      });
      
      await fetchPatients();
      return true;
    } catch (error) {
      console.error("Error updating patient status:", error);
      toast({
        title: "Error",
        description: "Failed to update patient status",
        variant: "destructive",
      });
      return false;
    }
  };

  const deletePatient = async (id: string): Promise<boolean> => {
    try {
      // First verify the patient is archived
      const patient = patients.find((p) => p.id === id);
      if (!patient || patient.status !== "archived") {
        toast({
          title: "Cannot Delete",
          description: "Only archived patients can be permanently deleted.",
          variant: "destructive",
        });
        return false;
      }

      // First, delete all related appointments for this patient
      const { error: appointmentsError } = await supabase
        .from("appointments")
        .delete()
        .eq("patient_id", id);

      if (appointmentsError) {
        console.error("Error deleting patient appointments:", appointmentsError);
        // Continue anyway - appointments might not exist
      }

      // Now delete the patient
      const { error } = await supabase.from("patients").delete().eq("id", id);

      if (error) {
        // Handle foreign key constraint errors
        if (error.code === "23503") {
          toast({
            title: "Cannot Delete",
            description: "This patient still has linked records. Please contact support.",
            variant: "destructive",
          });
          return false;
        }
        throw error;
      }

      // Immediately update local state for instant UI feedback
      setPatients((prev) => prev.filter((p) => p.id !== id));

      toast({
        title: "Success",
        description: "Patient permanently deleted",
      });

      return true;
    } catch (error) {
      console.error("Error deleting patient:", error);
      toast({
        title: "Error",
        description: "Failed to delete patient. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const searchByPhone = async (phone: string): Promise<{ patients: Patient[]; guardians: Guardian[] }> => {
    if (!phone || phone.length < 3) {
      return { patients: [], guardians: [] };
    }

    try {
      // Search patients by phone
      const { data: patientResults, error: patientError } = await supabase
        .from("patients")
        .select(`*, guardian:guardians(*)`)
        .ilike("phone", `%${phone}%`)
        .neq("status", "archived")
        .limit(5);

      if (patientError) throw patientError;

      // Search guardians by phone
      const { data: guardianResults, error: guardianError } = await supabase
        .from("guardians")
        .select("*")
        .ilike("phone", `%${phone}%`)
        .limit(5);

      if (guardianError) throw guardianError;

      return {
        patients: patientResults as Patient[],
        guardians: guardianResults as Guardian[],
      };
    } catch (error) {
      console.error("Error searching by phone:", error);
      return { patients: [], guardians: [] };
    }
  };

  return {
    patients,
    guardians,
    loading,
    fetchPatients,
    findGuardianByPhone,
    searchGuardiansByPhone,
    createPatient,
    updatePatient,
    updatePatientStatus,
    deletePatient,
    searchByPhone,
    checkPhoneExists,
  };
}
