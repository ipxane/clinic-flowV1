import { Sun, Sunset, Moon, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AppointmentCard } from "./AppointmentCard";
import { DisplayAppointment } from "@/types/appointments";
import type { AppointmentStatus } from "@/hooks/useAppointments";

// Default period icons - can be extended
const periodIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Morning: Sun,
  Afternoon: Sunset,
  Evening: Moon,
};

interface PeriodSectionProps {
  period: string;
  appointments: DisplayAppointment[];
  onView: (appointment: DisplayAppointment) => void;
  onConfirm: (appointment: DisplayAppointment) => void;
  onPostpone: (appointment: DisplayAppointment) => void;
  onCancel: (appointment: DisplayAppointment) => void;
  onStatusChange: (appointment: DisplayAppointment, status: AppointmentStatus) => void;
  onDelete?: (appointment: DisplayAppointment) => void;
}

export function PeriodSection({
  period,
  appointments,
  onView,
  onConfirm,
  onPostpone,
  onCancel,
  onStatusChange,
  onDelete,
}: PeriodSectionProps) {
  // Get icon for period, fallback to Clock for custom periods
  const PeriodIcon = periodIcons[period] || Clock;

  return (
    <div>
      {/* Period Header */}
      <div className="period-header mb-3 rounded-t-lg">
        <PeriodIcon className="h-4 w-4" />
        <span>{period}</span>
        <span className="ml-auto text-xs">
          {appointments.length} appointment{appointments.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Appointments Grid or Empty State */}
      {appointments.length === 0 ? (
        <Card>
          <CardContent className="flex h-20 items-center justify-center text-muted-foreground">
            No appointments scheduled for this period.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {appointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onView={onView}
              onConfirm={onConfirm}
              onPostpone={onPostpone}
              onCancel={onCancel}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
