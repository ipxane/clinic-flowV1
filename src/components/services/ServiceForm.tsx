import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Service, ServiceFormData } from "@/hooks/useServices";

interface ServiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: Service | null;
  onSubmit: (data: ServiceFormData) => Promise<boolean>;
  mode: "add" | "edit";
}

export function ServiceForm({
  open,
  onOpenChange,
  service,
  onSubmit,
  mode,
}: ServiceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ServiceFormData>({
    name: "",
    price: 0,
    duration: 30,
    description: "",
    category: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when dialog opens/closes or service changes
  useEffect(() => {
    if (open && service && mode === "edit") {
      setFormData({
        name: service.name,
        price: service.price,
        duration: service.duration,
        description: service.description || "",
        category: service.category || "",
      });
    } else if (open && mode === "add") {
      setFormData({
        name: "",
        price: 0,
        duration: 30,
        description: "",
        category: "",
      });
    }
    setErrors({});
  }, [open, service, mode]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Service name is required";
    }

    if (formData.price <= 0) {
      newErrors.price = "Price must be greater than 0";
    }

    if (formData.duration <= 0) {
      newErrors.duration = "Duration must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    const success = await onSubmit(formData);
    setIsSubmitting(false);

    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add New Service" : "Edit Service"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Create a new service for your clinic."
              : "Update the service information below."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Service Name - Required */}
          <div className="grid gap-2">
            <Label htmlFor="name">
              Service Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., General Checkup"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Price and Duration - Required */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="price">
                Price ($) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                placeholder="75.00"
                value={formData.price || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    price: parseFloat(e.target.value) || 0,
                  }))
                }
                className={errors.price ? "border-destructive" : ""}
              />
              {errors.price && (
                <p className="text-sm text-destructive">{errors.price}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="duration">
                Duration (min) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="duration"
                type="number"
                min="1"
                placeholder="30"
                value={formData.duration || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    duration: parseInt(e.target.value) || 0,
                  }))
                }
                className={errors.duration ? "border-destructive" : ""}
              />
              {errors.duration && (
                <p className="text-sm text-destructive">{errors.duration}</p>
              )}
            </div>
          </div>

          {/* Category - Optional */}
          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              placeholder="e.g., General, Dental, Imaging"
              value={formData.category}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, category: e.target.value }))
              }
            />
          </div>

          {/* Description - Optional */}
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the service..."
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting
              ? mode === "add"
                ? "Adding..."
                : "Saving..."
              : mode === "add"
                ? "Add Service"
                : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
