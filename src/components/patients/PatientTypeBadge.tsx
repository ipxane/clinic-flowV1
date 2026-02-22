import { cn } from "@/lib/utils";
import { PatientType } from "@/hooks/usePatients";
import { User, Baby } from "lucide-react";

interface PatientTypeBadgeProps {
  type: PatientType;
  className?: string;
}

export function PatientTypeBadge({ type, className }: PatientTypeBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
        type === "adult"
          ? "bg-muted text-muted-foreground"
          : "bg-primary/10 text-primary",
        className
      )}
    >
      {type === "adult" ? (
        <User className="h-3 w-3" />
      ) : (
        <Baby className="h-3 w-3" />
      )}
      {type === "adult" ? "Adult" : "Child"}
    </span>
  );
}
