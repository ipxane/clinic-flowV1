/**
 * Shared patient utility functions.
 * Used by booking confirmation, staff manual booking, and any flow
 * that needs to find or create a patient record.
 */

import { supabase } from '@/integrations/supabase/client';

interface FindOrCreatePatientParams {
  phone: string;
  full_name: string;
  date_of_birth?: string | null;
  patient_type?: 'adult' | 'child';
  guardian_id?: string | null;
  guardian_details?: {
    full_name: string;
    phone: string;
    email?: string | null;
  };
  notes?: string | null;
}

interface FindOrCreatePatientResult {
  patientId: string;
  isNew: boolean;
}

/**
 * Find a guardian by phone number. If not found, create a new one.
 */
export async function findOrCreateGuardian(params: {
  full_name: string;
  phone: string;
  email?: string | null;
}): Promise<string> {
  const { full_name, phone, email } = params;

  // Look up existing guardian by phone
  const { data: existingGuardian } = await supabase
    .from('guardians')
    .select('id')
    .eq('phone', phone)
    .maybeSingle();

  if (existingGuardian) {
    return existingGuardian.id;
  }

  // Create new guardian
  const { data: newGuardian, error } = await supabase
    .from('guardians')
    .insert([{ full_name, phone, email: email || null }])
    .select('id')
    .single();

  if (error) {
    console.error('Error in findOrCreateGuardian:', error);
    throw error;
  }

  return newGuardian.id;
}

/**
 * Find a patient by phone number. If not found, create a new one.
 */
export async function findOrCreatePatient(
  params: FindOrCreatePatientParams
): Promise<FindOrCreatePatientResult> {
  const {
    phone,
    full_name,
    date_of_birth,
    patient_type = 'adult',
    guardian_id,
    guardian_details,
    notes
  } = params;

  // Look up existing patient by phone number
  const { data: existingPatient } = await supabase
    .from('patients')
    .select('id')
    .eq('phone', phone)
    .maybeSingle();

  if (existingPatient) {
    return { patientId: existingPatient.id, isNew: false };
  }

  // --- SAFE UPSERT LOGIC FOR CHILD PATIENTS ---
  let finalGuardianId = guardian_id;

  if (patient_type === 'child') {
    // If we don't have a guardian ID but have details, find or create the guardian first
    if (!finalGuardianId && guardian_details) {
      finalGuardianId = await findOrCreateGuardian(guardian_details);
    }

    // CRITICAL: If still no guardian ID for a child, we must not proceed
    if (!finalGuardianId) {
      throw new Error(`Guardian information is required for child patients. (Patient: ${full_name}). Please ensure guardian details were extracted correctly from notes.`);
    }
  }

  // Create new patient
  const { data: newPatient, error } = await supabase
    .from('patients')
    .insert([{
      full_name,
      phone,
      date_of_birth: date_of_birth || null,
      patient_type,
      guardian_id: finalGuardianId || null,
      notes: notes || null,
      status: 'active'
    }])
    .select('id')
    .single();

  if (error) {
    console.error('Error in findOrCreatePatient:', error);
    // Handle constraint violation specifically if it somehow still happens
    if (error.code === '23514' && error.message.includes('child_requires_guardian')) {
      throw new Error("Patient creation failed: Children must be linked to a guardian.");
    }
    throw error;
  }

  return { patientId: newPatient.id, isNew: true };
}
