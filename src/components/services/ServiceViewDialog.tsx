import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Service } from "@/hooks/useServices";

interface ServiceViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service | null;
}

export function ServiceViewDialog({
  open,
  onOpenChange,
  service,
}: ServiceViewDialogProps) {
  if (!service) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Service Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <h3 className="text-lg font-semibold">{service.name}</h3>
            {service.category && (
              <Badge variant="secondary" className="mt-1">
                {service.category}
              </Badge>
            )}
          </div>

          {service.description && (
            <p className="text-muted-foreground">{service.description}</p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="font-medium">{service.duration} minutes</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Price</p>
              <p className="font-medium">${service.price.toFixed(2)}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge variant={service.is_active ? "default" : "secondary"}>
              {service.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="text-sm">
                {new Date(service.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="text-sm">
                {new Date(service.updated_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
