import { cn } from "@/lib/utils";
import { PatientStatus } from "@/hooks/usePatients";

interface PatientStatusBadgeProps {
  status: PatientStatus;
  className?: string;
}

const statusConfig: Record<PatientStatus, { label: string; className: string }> = {
  active: {
    label: "Active",
    className: "bg-status-confirmed/15 text-status-confirmed",
  },
  follow_up: {
    label: "Follow-up",
    className: "bg-accent text-accent-foreground",
  },
  archived: {
    label: "Archived",
    className: "bg-muted text-muted-foreground",
  },
};

export function PatientStatusBadge({ status, className }: PatientStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
