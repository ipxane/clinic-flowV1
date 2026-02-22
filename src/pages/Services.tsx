import { useState } from "react";
import {
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Clock,
  DollarSign,
  RotateCcw,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useServices, Service, ServiceFormData } from "@/hooks/useServices";
import { ServiceForm } from "@/components/services/ServiceForm";
import { ServiceViewDialog } from "@/components/services/ServiceViewDialog";

export default function Services() {
  const {
    activeServices,
    inactiveServices,
    isLoading,
    addService,
    updateService,
    deleteService,
    restoreService,
    permanentlyDeleteService,
  } = useServices();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPermanentDeleteDialogOpen, setIsPermanentDeleteDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [activeTab, setActiveTab] = useState("active");

  const handleView = (service: Service) => {
    setSelectedService(service);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (service: Service) => {
    setSelectedService(service);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (service: Service) => {
    setSelectedService(service);
    setIsDeleteDialogOpen(true);
  };

  const handlePermanentDelete = (service: Service) => {
    setSelectedService(service);
    setIsPermanentDeleteDialogOpen(true);
  };

  const handleRestore = async (service: Service) => {
    await restoreService(service.id);
  };

  const confirmDelete = async () => {
    if (selectedService) {
      await deleteService(selectedService.id);
      setIsDeleteDialogOpen(false);
      setSelectedService(null);
    }
  };

  const confirmPermanentDelete = async () => {
    if (selectedService) {
      await permanentlyDeleteService(selectedService.id);
      setIsPermanentDeleteDialogOpen(false);
      setSelectedService(null);
    }
  };

  const handleAddSubmit = async (data: ServiceFormData): Promise<boolean> => {
    return await addService(data);
  };

  const handleEditSubmit = async (data: ServiceFormData): Promise<boolean> => {
    if (!selectedService) return false;
    return await updateService(selectedService.id, data);
  };

  const activeColumns = [
    {
      key: "name",
      header: "Service",
      cell: (service: Service) => (
        <div>
          <p className="font-medium">{service.name}</p>
          {service.description && (
            <p className="text-sm text-muted-foreground line-clamp-1">
              {service.description}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      cell: (service: Service) =>
        service.category ? (
          <Badge variant="secondary">{service.category}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "price",
      header: "Price",
      cell: (service: Service) => (
        <div className="flex items-center gap-1.5 font-medium">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span>{service.price.toFixed(2)}</span>
        </div>
      ),
    },
    {
      key: "duration",
      header: "Duration",
      cell: (service: Service) => (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{service.duration} min</span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      cell: (service: Service) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleView(service)}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEdit(service)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleDelete(service)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Deactivate
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const inactiveColumns = [
    {
      key: "name",
      header: "Service",
      cell: (service: Service) => (
        <div>
          <p className="font-medium">{service.name}</p>
          {service.description && (
            <p className="text-sm text-muted-foreground line-clamp-1">
              {service.description}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      cell: (service: Service) =>
        service.category ? (
          <Badge variant="secondary">{service.category}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "price",
      header: "Price",
      cell: (service: Service) => (
        <div className="flex items-center gap-1.5 font-medium">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span>{service.price.toFixed(2)}</span>
        </div>
      ),
    },
    {
      key: "duration",
      header: "Duration",
      cell: (service: Service) => (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{service.duration} min</span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      cell: (service: Service) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleView(service)}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleRestore(service)}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Restore
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handlePermanentDelete(service)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Permanently
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title="Services"
          description="Manage the services offered by your clinic."
        />
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Services"
        description="Manage the services offered by your clinic."
        actions={
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Service
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="active">
            Active ({activeServices.length})
          </TabsTrigger>
          <TabsTrigger value="inactive">
            Inactive ({inactiveServices.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <DataTable
            columns={activeColumns}
            data={activeServices}
            emptyMessage="No active services found. Add your first service to get started."
          />
        </TabsContent>

        <TabsContent value="inactive">
          <DataTable
            columns={inactiveColumns}
            data={inactiveServices}
            emptyMessage="No inactive services."
          />
        </TabsContent>
      </Tabs>

      {/* Add Service Dialog */}
      <ServiceForm
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddSubmit}
        mode="add"
      />

      {/* Edit Service Dialog */}
      <ServiceForm
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        service={selectedService}
        onSubmit={handleEditSubmit}
        mode="edit"
      />

      {/* View Service Dialog */}
      <ServiceViewDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        service={selectedService}
      />

      {/* Deactivate Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Service</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate "{selectedService?.name}"?
              This service will no longer be available for booking but can be
              restored later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permanent Delete Confirmation Dialog */}
      <Dialog
        open={isPermanentDeleteDialogOpen}
        onOpenChange={setIsPermanentDeleteDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Service Permanently</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete "{selectedService?.name}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPermanentDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmPermanentDelete}>
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
