import { useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { CheckCircle, XCircle, Clock, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { AppointmentStatus } from "@/hooks/useAppointments";

interface TodayAppointment {
  id: string;
  start_time: string;
  status: AppointmentStatus;
  patient?: {
    full_name: string;
    date_of_birth: string | null;
  } | null;
  service?: {
    name: string;
  } | null;
}

interface TodayAppointmentsWidgetProps {
  appointments: TodayAppointment[];
  isLoading: boolean;
  onStatusChange: () => void;
}

export function TodayAppointmentsWidget({
  appointments,
  isLoading,
  onStatusChange,
}: TodayAppointmentsWidgetProps) {
  const { toast } = useToast();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Split appointments into active and finalized
  const { activeAppointments, finalizedAppointments } = useMemo(() => {
    const active = appointments
      .filter((a) => a.status === "pending" || a.status === "confirmed")
      .sort((a, b) => a.start_time.localeCompare(b.start_time));

    const finalized = appointments
      .filter((a) => a.status === "completed" || a.status === "no_show")
      .sort((a, b) => a.start_time.localeCompare(b.start_time));

    return { activeAppointments: active, finalizedAppointments: finalized };
  }, [appointments]);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const formatDateOfBirth = (dob: string | null) => {
    if (!dob) return "—";
    try {
      return format(parseISO(dob), "MMM d, yyyy");
    } catch {
      return "—";
    }
  };

  const handleStatusUpdate = async (
    appointmentId: string,
    newStatus: "completed" | "no_show"
  ) => {
    setUpdatingId(appointmentId);
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: newStatus })
        .eq("id", appointmentId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Appointment marked as ${newStatus === "completed" ? "Completed" : "No-Show"}.`,
      });

      onStatusChange();
    } catch (error: any) {
      console.error("Error updating appointment status:", error);
      toast({
        title: "Error",
        description: "Failed to update appointment status.",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const AppointmentCard = ({
    appointment,
    showActions,
  }: {
    appointment: TodayAppointment;
    showActions: boolean;
  }) => (
    <div className="flex items-start justify-between gap-4 px-4 py-3 border-b border-border last:border-b-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground shrink-0" />
          <p className="font-medium truncate">
            {appointment.patient?.full_name || "Unknown Patient"}
          </p>
        </div>
        <div className="mt-1 text-sm text-muted-foreground space-y-0.5">
          <p>DOB: {formatDateOfBirth(appointment.patient?.date_of_birth ?? null)}</p>
          <p className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTime(appointment.start_time)}
          </p>
          <p>{appointment.service?.name || "Unknown Service"}</p>
        </div>
      </div>

      {showActions ? (
        <div className="flex flex-col gap-1.5 shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1 text-status-confirmed border-status-confirmed/30 hover:bg-status-confirmed/10 hover:text-status-confirmed"
            disabled={updatingId === appointment.id}
            onClick={() => handleStatusUpdate(appointment.id, "completed")}
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Completed
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1 text-status-pending border-status-pending/30 hover:bg-status-pending/10 hover:text-status-pending"
            disabled={updatingId === appointment.id}
            onClick={() => handleStatusUpdate(appointment.id, "no_show")}
          >
            <XCircle className="h-3.5 w-3.5" />
            No-Show
          </Button>
        </div>
      ) : (
        <Badge
          variant="outline"
          className={
            appointment.status === "completed"
              ? "border-status-confirmed/30 text-status-confirmed bg-status-confirmed/10"
              : "border-status-cancelled/30 text-status-cancelled bg-status-cancelled/10"
          }
        >
          {appointment.status === "completed" ? "Completed" : "No-Show"}
        </Badge>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Today's Visit Management</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="w-full rounded-none border-b bg-transparent h-auto p-0">
            <TabsTrigger
              value="active"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2.5"
            >
              Today's Appointments
              {activeAppointments.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                  {activeAppointments.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="finalized"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2.5"
            >
              Completed / No-Show
              {finalizedAppointments.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                  {finalizedAppointments.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-0">
            {activeAppointments.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No pending appointments for today.
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {activeAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    showActions
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="finalized" className="mt-0">
            {finalizedAppointments.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No completed or no-show appointments yet.
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {finalizedAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    showActions={false}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
