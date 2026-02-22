import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ClinicSettings, Testimonial } from "./useSettings";

export function useMarketingSettings() {
    const [clinicSettings, setClinicSettings] = useState<ClinicSettings | null>(null);
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            try {
                // Fetch clinic settings
                const { data: settingsData } = await supabase
                    .from("clinic_settings")
                    .select("*")
                    .single();

                if (settingsData) {
                    setClinicSettings(settingsData as ClinicSettings);
                }

                // Fetch testimonials
                const { data: testimonialsData } = await (supabase as any)
                    .from("testimonials")
                    .select("*")
                    .eq("is_active", true)
                    .order("created_at", { ascending: false });

                setTestimonials((testimonialsData as Testimonial[]) || []);
            } catch (error) {
                console.error("Error fetching marketing data:", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, []);

    return {
        clinicSettings,
        testimonials,
        isLoading,
    };
}
