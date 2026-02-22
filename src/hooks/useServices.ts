import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  description: string | null;
  category: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceFormData {
  name: string;
  price: number;
  duration: number;
  description?: string;
  category?: string;
}

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchServices = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error("Error fetching services:", error);
      toast({
        title: "Error",
        description: "Failed to load services. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const addService = async (formData: ServiceFormData): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("services")
        .insert({
          name: formData.name.trim(),
          price: formData.price,
          duration: formData.duration,
          description: formData.description?.trim() || null,
          category: formData.category?.trim() || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setServices((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      
      toast({
        title: "Service Added",
        description: `"${data.name}" has been added successfully.`,
      });

      return true;
    } catch (error) {
      console.error("Error adding service:", error);
      toast({
        title: "Error",
        description: "Failed to add service. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateService = async (id: string, formData: ServiceFormData): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("services")
        .update({
          name: formData.name.trim(),
          price: formData.price,
          duration: formData.duration,
          description: formData.description?.trim() || null,
          category: formData.category?.trim() || null,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setServices((prev) =>
        prev
          .map((s) => (s.id === id ? data : s))
          .sort((a, b) => a.name.localeCompare(b.name))
      );

      toast({
        title: "Service Updated",
        description: `"${data.name}" has been updated successfully.`,
      });

      return true;
    } catch (error) {
      console.error("Error updating service:", error);
      toast({
        title: "Error",
        description: "Failed to update service. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteService = async (id: string): Promise<boolean> => {
    const service = services.find((s) => s.id === id);
    
    try {
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from("services")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;

      setServices((prev) =>
        prev.map((s) => (s.id === id ? { ...s, is_active: false } : s))
      );

      toast({
        title: "Service Deactivated",
        description: `"${service?.name}" has been deactivated.`,
      });

      return true;
    } catch (error) {
      console.error("Error deleting service:", error);
      toast({
        title: "Error",
        description: "Failed to delete service. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const restoreService = async (id: string): Promise<boolean> => {
    const service = services.find((s) => s.id === id);
    
    try {
      const { error } = await supabase
        .from("services")
        .update({ is_active: true })
        .eq("id", id);

      if (error) throw error;

      setServices((prev) =>
        prev.map((s) => (s.id === id ? { ...s, is_active: true } : s))
      );

      toast({
        title: "Service Restored",
        description: `"${service?.name}" has been restored.`,
      });

      return true;
    } catch (error) {
      console.error("Error restoring service:", error);
      toast({
        title: "Error",
        description: "Failed to restore service. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const permanentlyDeleteService = async (id: string): Promise<boolean> => {
    const service = services.find((s) => s.id === id);
    
    // Only allow permanent deletion of inactive services
    if (service && service.is_active) {
      toast({
        title: "Cannot Delete",
        description: "Only inactive services can be permanently deleted. Deactivate the service first.",
        variant: "destructive",
      });
      return false;
    }
    
    try {
      // Check if there are any appointments using this service
      const { data: appointments, error: checkError } = await supabase
        .from("appointments")
        .select("id")
        .eq("service_id", id)
        .limit(1);

      if (checkError) {
        console.error("Error checking appointments:", checkError);
      }

      // If appointments exist, delete them first (they're tied to an inactive service anyway)
      if (appointments && appointments.length > 0) {
        const { error: deleteApptsError } = await supabase
          .from("appointments")
          .delete()
          .eq("service_id", id);

        if (deleteApptsError) {
          console.error("Error deleting service appointments:", deleteApptsError);
        }
      }

      const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", id);

      if (error) {
        // Handle foreign key constraint errors
        if (error.code === "23503") {
          toast({
            title: "Cannot Delete",
            description: "This service still has linked records. Please contact support.",
            variant: "destructive",
          });
          return false;
        }
        throw error;
      }

      // Immediately update local state for instant UI feedback
      setServices((prev) => prev.filter((s) => s.id !== id));

      toast({
        title: "Service Deleted",
        description: `"${service?.name}" has been permanently deleted.`,
      });

      return true;
    } catch (error) {
      console.error("Error permanently deleting service:", error);
      toast({
        title: "Error",
        description: "Failed to delete service. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Computed values
  const activeServices = services.filter((s) => s.is_active);
  const inactiveServices = services.filter((s) => !s.is_active);

  return {
    services,
    activeServices,
    inactiveServices,
    isLoading,
    addService,
    updateService,
    deleteService,
    restoreService,
    permanentlyDeleteService,
    refetch: fetchServices,
  };
}
