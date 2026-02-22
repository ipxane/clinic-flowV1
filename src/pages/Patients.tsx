import { useState, useMemo, useCallback } from "react";
import { Plus, MoreHorizontal, Eye, Pencil, Archive, RotateCcw, UserCheck, ClipboardList, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { usePatients, Patient, PatientStatus, PatientFormData } from "@/hooks/usePatients";
import { PatientForm } from "@/components/patients/PatientForm";
import { PatientStatusBadge } from "@/components/patients/PatientStatusBadge";
import { PatientTypeBadge } from "@/components/patients/PatientTypeBadge";
import { PatientViewDialog } from "@/components/patients/PatientViewDialog";
import { PhoneSearchInput } from "@/components/patients/PhoneSearchInput";

type FilterStatus = "all" | PatientStatus;

export default function Patients() {
  const {
    patients,
    loading,
    findGuardianByPhone,
    searchGuardiansByPhone,
    createPatient,
    updatePatient,
    updatePatientStatus,
    deletePatient,
    searchByPhone,
  } = usePatients();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [targetStatus, setTargetStatus] = useState<PatientStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Memoize searchByPhone to prevent unnecessary re-renders
  const memoizedSearchByPhone = useCallback(searchByPhone, [searchByPhone]);

  // Filter patients by phone number OR name (case-insensitive, supports Arabic/English)
  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      // Status filter - hide archived by default
      if (statusFilter === "all") {
        if (patient.status === "archived") return false;
      } else if (patient.status !== statusFilter) {
        return false;
      }

      // Search filter: phone or name
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesPhone = patient.phone?.toLowerCase().includes(query);
        const matchesGuardianPhone = patient.guardian?.phone?.toLowerCase().includes(query);
        const matchesName = patient.full_name.toLowerCase().includes(query);
        const matchesGuardianName = patient.guardian?.full_name?.toLowerCase().includes(query);

        return matchesPhone || matchesGuardianPhone || matchesName || matchesGuardianName;
      }

      return true;
    });
  }, [patients, statusFilter, searchQuery]);

  const handleView = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsEditDialogOpen(true);
  };

  const handleStatusChange = (patient: Patient, status: PatientStatus) => {
    setSelectedPatient(patient);
    setTargetStatus(status);
    setIsStatusDialogOpen(true);
  };

  const handleDeleteClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedPatient) return;

    setIsSubmitting(true);
    await deletePatient(selectedPatient.id);
    setIsSubmitting(false);
    setIsDeleteDialogOpen(false);
    setSelectedPatient(null);
  };

  const confirmStatusChange = async () => {
    if (!selectedPatient || !targetStatus) return;

    setIsSubmitting(true);
    await updatePatientStatus(selectedPatient.id, targetStatus);
    setIsSubmitting(false);
    setIsStatusDialogOpen(false);
    setSelectedPatient(null);
    setTargetStatus(null);
  };

  const handleCreatePatient = async (formData: PatientFormData) => {
    setIsSubmitting(true);
    const result = await createPatient(formData);
    setIsSubmitting(false);
    return result;
  };

  const handleUpdatePatient = async (formData: PatientFormData) => {
    if (!selectedPatient) return false;
    setIsSubmitting(true);
    const result = await updatePatient(selectedPatient.id, formData);
    setIsSubmitting(false);
    return result;
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsViewDialogOpen(true);
  };

  const handleGuardianSelect = () => {
    // When guardian is selected from search, could navigate to a guardian view
    // For now, just clear the search
    setSearchQuery("");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Status counts for tabs
  const statusCounts = useMemo(() => {
    return {
      all: patients.filter((p) => p.status !== "archived").length,
      active: patients.filter((p) => p.status === "active").length,
      follow_up: patients.filter((p) => p.status === "follow_up").length,
      archived: patients.filter((p) => p.status === "archived").length,
    };
  }, [patients]);

  const columns = [
    {
      key: "name",
      header: "Patient",
      cell: (patient: Patient) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {getInitials(patient.full_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{patient.full_name}</p>
            <div className="flex items-center gap-2">
              <PatientTypeBadge type={patient.patient_type} />
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      cell: (patient: Patient) => (
        <div className="text-sm">
          {patient.patient_type === "adult" ? (
            <>
              <p className="font-medium">{patient.phone}</p>
              {patient.email && (
                <p className="text-muted-foreground">{patient.email}</p>
              )}
            </>
          ) : (
            <>
              <p className="text-muted-foreground">Guardian:</p>
              <p className="font-medium">{patient.guardian?.phone || "—"}</p>
            </>
          )}
        </div>
      ),
    },
    {
      key: "guardian",
      header: "Guardian / DOB",
      cell: (patient: Patient) => (
        <div className="text-sm">
          {patient.patient_type === "child" ? (
            <>
              <p className="font-medium">{patient.guardian?.full_name || "—"}</p>
              <p className="text-muted-foreground">
                DOB: {patient.date_of_birth
                  ? new Date(patient.date_of_birth).toLocaleDateString()
                  : "—"}
              </p>
            </>
          ) : (
            <p className="text-muted-foreground">
              DOB: {patient.date_of_birth
                ? new Date(patient.date_of_birth).toLocaleDateString()
                : "—"}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (patient: Patient) => <PatientStatusBadge status={patient.status} />,
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      cell: (patient: Patient) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleView(patient)}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEdit(patient)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            {/* Status change options */}
            {patient.status !== "active" && (
              <DropdownMenuItem onClick={() => handleStatusChange(patient, "active")}>
                <UserCheck className="mr-2 h-4 w-4" />
                Mark as Active
              </DropdownMenuItem>
            )}
            {patient.status !== "follow_up" && (
              <DropdownMenuItem onClick={() => handleStatusChange(patient, "follow_up")}>
                <ClipboardList className="mr-2 h-4 w-4" />
                Mark as Follow-up
              </DropdownMenuItem>
            )}
            {patient.status !== "archived" ? (
              <DropdownMenuItem
                onClick={() => handleStatusChange(patient, "archived")}
                className="text-destructive focus:text-destructive"
              >
                <Archive className="mr-2 h-4 w-4" />
                Archive
              </DropdownMenuItem>
            ) : (
              <>
                <DropdownMenuItem onClick={() => handleStatusChange(patient, "active")}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Restore
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDeleteClick(patient)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Permanently
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title="Patients"
          description="Manage your patient records and information."
        />
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Patients"
        description="Manage your patient records and information."
        actions={
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Patient
          </Button>
        }
      />

      {/* Filters */}
      <div className="mb-6 space-y-4">
        {/* Status Tabs */}
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as FilterStatus)}>
          <TabsList>
            <TabsTrigger value="all">
              All Active ({statusCounts.all})
            </TabsTrigger>
            <TabsTrigger value="active">
              Active ({statusCounts.active})
            </TabsTrigger>
            <TabsTrigger value="follow_up">
              Follow-up ({statusCounts.follow_up})
            </TabsTrigger>
            <TabsTrigger value="archived">
              Archived ({statusCounts.archived})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search by Phone or Name */}
        <PhoneSearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          onPatientSelect={handlePatientSelect}
          onGuardianSelect={handleGuardianSelect}
          searchByPhone={memoizedSearchByPhone}
          placeholder="Search by phone or name..."
          className="max-w-sm"
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredPatients}
        emptyMessage={
          statusFilter === "archived"
            ? "No archived patients."
            : searchQuery
              ? "No patients match your search."
              : "No patients found. Add your first patient to get started."
        }
      />

      {/* Add Patient Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Patient</DialogTitle>
            <DialogDescription>
              Enter the patient's information. Select patient type first.
            </DialogDescription>
          </DialogHeader>
          <PatientForm
            onSubmit={handleCreatePatient}
            onCancel={() => setIsAddDialogOpen(false)}
            findGuardianByPhone={findGuardianByPhone}
            searchGuardiansByPhone={searchGuardiansByPhone}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* View Patient Dialog */}
      <PatientViewDialog
        patient={selectedPatient}
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
      />

      {/* Edit Patient Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Patient</DialogTitle>
            <DialogDescription>
              Update the patient's information.
            </DialogDescription>
          </DialogHeader>
          {selectedPatient && (
            <PatientForm
              initialData={selectedPatient}
              onSubmit={handleUpdatePatient}
              onCancel={() => setIsEditDialogOpen(false)}
              findGuardianByPhone={findGuardianByPhone}
              searchGuardiansByPhone={searchGuardiansByPhone}
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Status Change Confirmation Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {targetStatus === "archived" ? "Archive Patient" : "Change Patient Status"}
            </DialogTitle>
            <DialogDescription>
              {targetStatus === "archived"
                ? `Are you sure you want to archive ${selectedPatient?.full_name}? Archived patients will be hidden from the default view.`
                : `Change ${selectedPatient?.full_name}'s status to "${targetStatus?.replace("_", " ")}"?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={targetStatus === "archived" ? "destructive" : "default"}
              onClick={confirmStatusChange}
              disabled={isSubmitting}
            >
              {targetStatus === "archived" ? "Archive" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Patient Permanently</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete {selectedPatient?.full_name}?
              This action cannot be undone and all patient records will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
