import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Patient } from "@/hooks/usePatients";
import { PatientStatusBadge } from "./PatientStatusBadge";
import { User, Baby, Phone, Mail, Calendar, FileText, UserCheck } from "lucide-react";

interface PatientViewDialogProps {
  patient: Patient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PatientViewDialog({ patient, open, onOpenChange }: PatientViewDialogProps) {
  if (!patient) return null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Patient Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                {getInitials(patient.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{patient.full_name}</h3>
                {patient.patient_type === "child" ? (
                  <Baby className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <User className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <PatientStatusBadge status={patient.status} />
                <span className="text-sm text-muted-foreground capitalize">
                  {patient.patient_type} Patient
                </span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="grid gap-4">
            {patient.patient_type === "adult" && patient.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{patient.phone}</p>
                </div>
              </div>
            )}

            {patient.email && (
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{patient.email}</p>
                </div>
              </div>
            )}

            {patient.date_of_birth && (
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">{formatDate(patient.date_of_birth)}</p>
                </div>
              </div>
            )}

            {patient.notes && (
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="font-medium whitespace-pre-wrap">{patient.notes}</p>
                </div>
              </div>
            )}

            {/* Guardian info for children */}
            {patient.patient_type === "child" && patient.guardian && (
              <div className="border-t pt-4 mt-2">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Guardian Information
                </h4>
                <div className="grid gap-3 pl-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{patient.guardian.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{patient.guardian.phone}</p>
                  </div>
                  {patient.guardian.email && (
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{patient.guardian.email}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="border-t pt-4 mt-2 text-sm text-muted-foreground">
              <p>Created: {formatDate(patient.created_at)}</p>
              <p>Last Updated: {formatDate(patient.updated_at)}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
