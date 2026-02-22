import * as React from "react";
import { cn } from "@/lib/utils";

export type Status = "pending" | "confirmed" | "cancelled" | "postponed" | "completed" | "no_show";

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: Status;
}

const statusConfig: Record<Status, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "status-badge status-pending",
  },
  confirmed: {
    label: "Confirmed",
    className: "status-badge status-confirmed",
  },
  cancelled: {
    label: "Cancelled",
    className: "status-badge status-cancelled",
  },
  postponed: {
    label: "Rescheduled",
    className: "status-badge status-postponed",
  },
  completed: {
    label: "Completed",
    className: "status-badge status-confirmed",
  },
  no_show: {
    label: "No-Show",
    className: "status-badge status-cancelled",
  },
};

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, className, ...props }, ref) => {
    const config = statusConfig[status];

    return (
      <span ref={ref} className={cn(config.className, className)} {...props}>
        {config.label}
      </span>
    );
  }
);
StatusBadge.displayName = "StatusBadge";

export { StatusBadge };
