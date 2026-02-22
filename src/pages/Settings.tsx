import { useState, useEffect } from "react";
import { Building2, Calendar, Clock, Plus, Trash2, Upload, Save, CalendarOff, Pencil, Users, Layout } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSettings } from "@/hooks/useSettings";
import { Skeleton } from "@/components/ui/skeleton";
import { HolidaysSection } from "@/components/settings/HolidaysSection";
import { UsersSection } from "@/components/settings/UsersSection";
import { MarketingSettings } from "@/components/settings/MarketingSettings";
import { useAuthContext } from "@/contexts/AuthContext";

export default function Settings() {
  const { isAdmin } = useAuthContext();
  const {
    isLoading,
    workingDays,
    holidays,
    addPeriod,
    updatePeriod,
    deletePeriod,
    addHoliday,
    updateHoliday,
    deleteHoliday,
    addRecurringHoliday,
    updateRecurringHoliday,
    updateClinicSettings,
    toggleWorkingDay,
    clinicSettings,
  } = useSettings();

  // Period dialog state
  const [isAddPeriodDialogOpen, setIsAddPeriodDialogOpen] = useState(false);
  const [isEditPeriodDialogOpen, setIsEditPeriodDialogOpen] = useState(false);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [selectedDayName, setSelectedDayName] = useState<string>("");
  const [editingPeriod, setEditingPeriod] = useState<{ id: string; name: string; start_time: string; end_time: string } | null>(null);
  const [periodName, setPeriodName] = useState("");
  const [periodStart, setPeriodStart] = useState("09:00");
  const [periodEnd, setPeriodEnd] = useState("12:00");

  const handleOpenAddPeriod = (dayId: string, dayName: string) => {
    setSelectedDayId(dayId);
    setSelectedDayName(dayName);
    setPeriodName("");
    setPeriodStart("09:00");
    setPeriodEnd("12:00");
    setIsAddPeriodDialogOpen(true);
  };

  const handleOpenEditPeriod = (dayId: string, dayName: string, period: { id: string; name: string; start_time: string; end_time: string }) => {
    setSelectedDayId(dayId);
    setSelectedDayName(dayName);
    setEditingPeriod(period);
    setPeriodName(period.name);
    setPeriodStart(period.start_time.substring(0, 5));
    setPeriodEnd(period.end_time.substring(0, 5));
    setIsEditPeriodDialogOpen(true);
  };

  const handleAddPeriod = async () => {
    if (!selectedDayId || !periodName.trim()) return;

    await addPeriod(selectedDayId, {
      name: periodName.trim(),
      start_time: periodStart,
      end_time: periodEnd,
    });
    setIsAddPeriodDialogOpen(false);
  };

  const handleUpdatePeriod = async () => {
    if (!editingPeriod) return;

    await updatePeriod(editingPeriod.id, {
      name: periodName.trim(),
      start_time: periodStart,
      end_time: periodEnd,
    });
    setIsEditPeriodDialogOpen(false);
    setEditingPeriod(null);
  };

  const handleDeletePeriod = async (periodId: string) => {
    await deletePeriod(periodId);
  };

  const handleBookingRangeChange = async (value: string) => {
    await updateClinicSettings({ booking_range_days: parseInt(value, 10) });
  };

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title="Settings"
          description="Configure your clinic settings and preferences."
        />
        <div className="space-y-6">
          <Skeleton className="h-12 w-full max-w-2xl" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Settings"
        description="Configure your clinic settings and preferences."
      />

      <Tabs defaultValue="marketing" className="space-y-6">
        <TabsList className={`grid w-full max-w-4xl ${isAdmin ? "grid-cols-5" : "grid-cols-4"}`}>
          <TabsTrigger value="marketing" className="gap-2">
            <Layout className="h-4 w-4" />
            <span className="hidden sm:inline">Marketing</span>
            <span className="sm:hidden">Marketing</span>
          </TabsTrigger>
          <TabsTrigger value="schedule" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Schedule</span>
            <span className="sm:hidden">Schedule</span>
          </TabsTrigger>
          <TabsTrigger value="holidays" className="gap-2">
            <CalendarOff className="h-4 w-4" />
            Holidays
          </TabsTrigger>
          <TabsTrigger value="booking" className="gap-2">
            <Clock className="h-4 w-4" />
            Booking
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
          )}
        </TabsList>

        {/* Marketing Tab */}
        <TabsContent value="marketing">
          <MarketingSettings />
        </TabsContent>

        {/* Working Days & Periods Tab */}
        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Working Days & Periods</CardTitle>
              <CardDescription>
                Configure your clinic's working schedule. Gaps between periods are automatically considered breaks.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {workingDays.map((day) => (
                  <div key={day.id} className="rounded-lg border border-border p-4 hover:border-primary/20 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={day.is_working}
                          onCheckedChange={(checked) => toggleWorkingDay(day.id, checked)}
                        />
                        <span className={`font-semibold ${!day.is_working ? "text-muted-foreground" : ""}`}>
                          {day.day_name}
                        </span>
                        {!day.is_working && (
                          <Badge variant="secondary" className="opacity-70">Closed</Badge>
                        )}
                      </div>
                      {day.is_working && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => handleOpenAddPeriod(day.id, day.day_name)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Period
                        </Button>
                      )}
                    </div>

                    {day.is_working && day.periods.length > 0 && (
                      <div className="grid gap-2 ml-11">
                        {day.periods.map((period) => (
                          <div
                            key={period.id}
                            className="flex items-center justify-between rounded-md bg-muted/40 px-4 py-2 border border-border/30 hover:bg-muted/60 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-medium">{period.name}</span>
                              <Badge variant="outline" className="text-xs font-normal border-primary/20 bg-primary/5">
                                {period.start_time.substring(0, 5)} - {period.end_time.substring(0, 5)}
                              </Badge>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                onClick={() => handleOpenEditPeriod(day.id, day.day_name, period)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeletePeriod(period.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {day.is_working && day.periods.length === 0 && (
                      <p className="ml-11 text-xs text-muted-foreground italic bg-muted/30 p-2 rounded">
                        No periods configured. Add a period to enable bookings for this day.
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-border/50">
                <p className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-0.5">ℹ️</span>
                  Your schedule determines when appointments can be requested. Patients can only book within the specific periods you define above.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Holidays Tab */}
        <TabsContent value="holidays">
          <div className="space-y-1 mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Holidays & Special Dates</h2>
            <p className="text-muted-foreground">
              Manage clinic closures and holidays that affect the booking calendar.
            </p>
          </div>
          <div className="space-y-6">
            <HolidaysSection
              holidays={holidays}
              addHoliday={addHoliday}
              updateHoliday={updateHoliday}
              deleteHoliday={deleteHoliday}
              addRecurringHoliday={addRecurringHoliday}
              updateRecurringHoliday={updateRecurringHoliday}
            />
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-0.5">ℹ️</span>
                  Holiday exceptions override your regular working schedule. Dates marked as closed will not be available for patient bookings.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Booking Range Tab */}
        <TabsContent value="booking">
          <Card>
            <CardHeader>
              <CardTitle>Booking Range Settings</CardTitle>
              <CardDescription>
                Control how far in advance patients can book appointments.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Enable/Disable Toggle */}
              <div className="flex items-center justify-between rounded-lg border border-border p-5 bg-muted/20">
                <div className="space-y-1">
                  <Label htmlFor="booking-range-toggle" className="text-base font-semibold">
                    Enable Booking Range Limit
                  </Label>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    {clinicSettings?.booking_range_enabled !== false
                      ? "Appointments are limited to a maximum advance booking period."
                      : "Booking range is disabled. Appointments can be scheduled without any advance limit."}
                  </p>
                </div>
                <Switch
                  id="booking-range-toggle"
                  checked={clinicSettings?.booking_range_enabled !== false}
                  onCheckedChange={(checked) => updateClinicSettings({ booking_range_enabled: checked })}
                />
              </div>

              {/* Days Input - only shown when enabled */}
              {clinicSettings?.booking_range_enabled !== false && (
                <div className="grid gap-3 max-w-sm pl-2 border-l-2 border-primary/20">
                  <Label htmlFor="booking-range" className="font-medium text-sm">Maximum Booking Range</Label>
                  <Select
                    value={clinicSettings?.booking_range_days?.toString() || "30"}
                    onValueChange={handleBookingRangeChange}
                  >
                    <SelectTrigger id="booking-range" className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="15">15 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="45">45 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground font-medium">
                    Patients can book appointments up to <strong>{clinicSettings?.booking_range_days || 30} days</strong> in advance from today.
                  </p>
                </div>
              )}

              <div className="pt-2 border-t border-border/50">
                <p className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-0.5">ℹ️</span>
                  Limiting the booking range helps prevent scheduling conflicts and ensures your calendar is not over-committed months in advance.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab - Admin Only */}
        {isAdmin && (
          <TabsContent value="users" className="space-y-6">
            <UsersSection />
            <div className="pt-2">
              <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/50 flex items-start gap-2">
                <span className="text-primary mt-0.5">ℹ️</span>
                Account access is strictly controlled. New staff must be approved by an administrator before they can sign in to the system.
              </p>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Add Period Dialog */}
      <Dialog open={isAddPeriodDialogOpen} onOpenChange={setIsAddPeriodDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Period for {selectedDayName}</DialogTitle>
            <DialogDescription>
              Define a new working period. Any gap between periods is considered a break.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="period-name">Period Name</Label>
              <Input
                id="period-name"
                placeholder="e.g., Morning, Afternoon, Evening"
                value={periodName}
                onChange={(e) => setPeriodName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="period-start">Start Time</Label>
                <Input
                  id="period-start"
                  type="time"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="period-end">End Time</Label>
                <Input
                  id="period-end"
                  type="time"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddPeriodDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPeriod} disabled={!periodName.trim()}>
              Add Period
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Period Dialog */}
      <Dialog open={isEditPeriodDialogOpen} onOpenChange={setIsEditPeriodDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Period for {selectedDayName}</DialogTitle>
            <DialogDescription>
              Update the working period details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-period-name">Period Name</Label>
              <Input
                id="edit-period-name"
                placeholder="e.g., Morning, Afternoon, Evening"
                value={periodName}
                onChange={(e) => setPeriodName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-period-start">Start Time</Label>
                <Input
                  id="edit-period-start"
                  type="time"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-period-end">End Time</Label>
                <Input
                  id="edit-period-end"
                  type="time"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditPeriodDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePeriod} disabled={!periodName.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
