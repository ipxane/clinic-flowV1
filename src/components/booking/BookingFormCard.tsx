import { CalendarDays, Phone, User, Loader2, Clock, Calendar, AlertCircle, Ban, Users, Mail, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DateOfBirthPicker } from '@/components/ui/date-of-birth-picker';

import {
    Service,
    WorkingPeriod,
    AvailableDate,
    PeriodStatus
} from '@/lib/booking-engine';

export interface BookingFormData {
    phone_number: string;
    full_name: string;
    date_of_birth: string;
    service_id: string;
    preferred_date: string;
    preferred_period_id: string;
    patient_type: 'adult' | 'child';
    guardian_phone_number: string;
    guardian_name: string;
    guardian_email: string;
}

interface BookingFormCardProps {
    services: Service[];
    availableDates: AvailableDate[];
    availablePeriods: (WorkingPeriod & { status: PeriodStatus; availableSlots: number })[];
    formData: BookingFormData;
    setFormData: React.Dispatch<React.SetStateAction<BookingFormData>>;
    isSubmitting: boolean;
    onSubmit: (e: React.FormEvent) => Promise<void>;
    selectedDateInfo: AvailableDate | null | undefined;
}

export function BookingFormCard({
    services,
    availableDates,
    availablePeriods,
    formData,
    setFormData,
    isSubmitting,
    onSubmit,
    selectedDateInfo,
}: BookingFormCardProps) {
    const isChild = formData.patient_type === 'child';

    return (
        <section className="py-12 md:py-20 bg-muted/30">
            <div className="container mx-auto px-4">
                <div className="max-w-[720px] mx-auto">
                    <Card className="shadow-xl border-none overflow-hidden bg-white" id="booking-form">
                        <CardHeader className="text-center pb-10 pt-12 px-6">
                            <div className="w-16 h-16 rounded-2xl bg-[#38BDF8]/10 flex items-center justify-center mx-auto mb-6">
                                <CalendarDays className="w-8 h-8 text-[#38BDF8]" />
                            </div>
                            <CardTitle className="text-3xl font-bold text-slate-900 tracking-tight">Request an Appointment</CardTitle>
                            <CardDescription className="text-base mt-4 max-w-sm mx-auto text-slate-500">
                                Please provide your details below to schedule your visit.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="px-6 md:px-12 pb-12">
                            <form onSubmit={onSubmit} className="space-y-12">

                                {/* SECTION 1: PERSONAL INFORMATION */}
                                <div className="space-y-8">
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                            <User className="w-5 h-5 text-[#38BDF8]" />
                                            Personal Information
                                        </h3>
                                        <div className="h-0.5 w-full bg-slate-100" />
                                    </div>

                                    <div className="grid gap-6">
                                        {/* Patient Type */}
                                        <div className="space-y-2.5">
                                            <Label htmlFor="patient_type" className="text-sm font-semibold text-slate-700">Patient Type</Label>
                                            <Select
                                                value={formData.patient_type}
                                                onValueChange={(value: 'adult' | 'child') => setFormData(prev => ({
                                                    ...prev,
                                                    patient_type: value,
                                                    ...(value === 'adult' ? { guardian_phone_number: '', guardian_name: '', guardian_email: '' } : {}),
                                                }))}
                                            >
                                                <SelectTrigger className="h-12 border-slate-200 focus:ring-[#38BDF8] focus:border-[#38BDF8] text-base">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="adult">Adult Patient</SelectItem>
                                                    <SelectItem value="child">Child Patient</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Name and DOB Row */}
                                        <div className="grid sm:grid-cols-2 gap-6">
                                            <div className="space-y-2.5">
                                                <Label htmlFor="full_name" className="text-sm font-semibold text-slate-700">
                                                    {isChild ? "Child's Full Name" : "Full Name"}
                                                </Label>
                                                <Input
                                                    id="full_name"
                                                    placeholder={isChild ? "Jane Doe" : "John Doe"}
                                                    className="h-12 border-slate-200 focus:ring-[#38BDF8] focus:border-[#38BDF8] text-base"
                                                    value={formData.full_name}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-2.5">
                                                <Label htmlFor="date_of_birth" className="text-sm font-semibold text-slate-700">Date of Birth</Label>
                                                <DateOfBirthPicker
                                                    id="date_of_birth"
                                                    value={formData.date_of_birth}
                                                    onChange={(value) => setFormData(prev => ({ ...prev, date_of_birth: value }))}
                                                    required
                                                    className="h-12"
                                                />
                                            </div>
                                        </div>

                                        {/* Phone Number */}
                                        <div className="space-y-2.5">
                                            <Label htmlFor="phone_number" className="text-sm font-semibold text-slate-700">Phone Number</Label>
                                            <div className="relative">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <Input
                                                    id="phone_number"
                                                    type="tel"
                                                    placeholder="05X XXX XXXX"
                                                    className="h-12 border-slate-200 focus:ring-[#38BDF8] focus:border-[#38BDF8] pl-11 text-base"
                                                    value={formData.phone_number}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                                                    required
                                                />
                                            </div>
                                            <p className="text-xs text-slate-400 font-medium">This number will be used for appointment confirmation.</p>
                                        </div>

                                        {/* Guardian Info for Children */}
                                        {isChild && (
                                            <div className="pt-4 mt-2 space-y-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Users className="w-4 h-4 text-[#38BDF8]" />
                                                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Guardian Information</h4>
                                                </div>

                                                <div className="grid gap-6">
                                                    <div className="space-y-2.5">
                                                        <Label htmlFor="guardian_name" className="text-sm font-semibold text-slate-700">Guardian Name</Label>
                                                        <Input
                                                            id="guardian_name"
                                                            placeholder="Full name of parent/guardian"
                                                            className="h-12 border-slate-200 bg-white focus:ring-[#38BDF8] focus:border-[#38BDF8] text-base"
                                                            value={formData.guardian_name}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, guardian_name: e.target.value }))}
                                                            required
                                                        />
                                                    </div>

                                                    <div className="grid sm:grid-cols-2 gap-6">
                                                        <div className="space-y-2.5">
                                                            <Label htmlFor="guardian_phone_number" className="text-sm font-semibold text-slate-700">Guardian Phone</Label>
                                                            <div className="relative">
                                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                                <Input
                                                                    id="guardian_phone_number"
                                                                    placeholder="05X XXX XXXX"
                                                                    className="h-12 border-slate-200 bg-white focus:ring-[#38BDF8] focus:border-[#38BDF8] pl-11 text-base"
                                                                    value={formData.guardian_phone_number}
                                                                    onChange={(e) => setFormData(prev => ({ ...prev, guardian_phone_number: e.target.value }))}
                                                                    required
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2.5">
                                                            <Label htmlFor="guardian_email" className="text-sm font-semibold text-slate-700">Guardian Email (Optional)</Label>
                                                            <div className="relative">
                                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                                <Input
                                                                    id="guardian_email"
                                                                    type="email"
                                                                    placeholder="email@address.com"
                                                                    className="h-12 border-slate-200 bg-white focus:ring-[#38BDF8] focus:border-[#38BDF8] pl-11 text-base"
                                                                    value={formData.guardian_email}
                                                                    onChange={(e) => setFormData(prev => ({ ...prev, guardian_email: e.target.value }))}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* SECTION 2: APPOINTMENT DETAILS */}
                                <div className="space-y-8">
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                            <Calendar className="w-5 h-5 text-[#38BDF8]" />
                                            Appointment Details
                                        </h3>
                                        <div className="h-0.5 w-full bg-slate-100" />
                                    </div>

                                    <div className="grid gap-6">
                                        {/* Service Selection */}
                                        <div className="space-y-2.5">
                                            <Label htmlFor="service" className="text-sm font-semibold text-slate-700">Select Service</Label>
                                            <Select
                                                value={formData.service_id}
                                                onValueChange={(value) => setFormData(prev => ({ ...prev, service_id: value }))}
                                            >
                                                <SelectTrigger className="h-12 border-slate-200 focus:ring-[#38BDF8] focus:border-[#38BDF8] text-base">
                                                    <SelectValue placeholder="Choose a medical service" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {services.map((service) => (
                                                        <SelectItem key={service.id} value={service.id}>
                                                            <div className="flex items-center justify-between w-full min-w-[200px] py-1">
                                                                <span className="font-medium">{service.name}</span>
                                                                <span className="text-slate-400 text-sm ml-4">
                                                                    {service.duration} min {service.price > 0 ? `• ${service.price} SAR` : ''}
                                                                </span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {formData.service_id && (
                                                <div className="flex items-start gap-2 bg-[#38BDF8]/5 p-3 rounded-xl border border-[#38BDF8]/10">
                                                    <Info className="w-4 h-4 text-[#38BDF8] mt-0.5 shrink-0" />
                                                    <p className="text-sm text-slate-600 leading-normal">
                                                        {services.find(s => s.id === formData.service_id)?.description}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Date and Time Row */}
                                        <div className="grid sm:grid-cols-2 gap-6">
                                            <div className="space-y-2.5">
                                                <Label htmlFor="date" className="text-sm font-semibold text-slate-700">Preferred Date</Label>
                                                <Select
                                                    value={formData.preferred_date}
                                                    onValueChange={(value) => setFormData(prev => ({ ...prev, preferred_date: value, preferred_period_id: '' }))}
                                                >
                                                    <SelectTrigger className="h-12 border-slate-200 focus:ring-[#38BDF8] focus:border-[#38BDF8] text-base">
                                                        <SelectValue placeholder="Select a date" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {availableDates.map((dateInfo) => (
                                                            <SelectItem
                                                                key={dateInfo.date}
                                                                value={dateInfo.date}
                                                                disabled={dateInfo.status !== 'available'}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    {dateInfo.status === 'holiday' && <Ban className="w-4 h-4 text-rose-500" />}
                                                                    <span className={dateInfo.status !== 'available' ? 'text-slate-400' : 'text-slate-700'}>
                                                                        {dateInfo.label}
                                                                    </span>
                                                                    {dateInfo.status !== 'available' && (
                                                                        <span className="text-[10px] uppercase font-bold ml-auto px-1.5 py-0.5 rounded bg-slate-100 text-slate-400">
                                                                            {dateInfo.status === 'holiday' ? 'Holiday' : dateInfo.status === 'full' ? 'Full' : 'Closed'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2.5">
                                                <Label htmlFor="period" className="text-sm font-semibold text-slate-700">Preferred Time</Label>
                                                <Select
                                                    value={formData.preferred_period_id}
                                                    onValueChange={(value) => setFormData(prev => ({ ...prev, preferred_period_id: value }))}
                                                    disabled={!formData.preferred_date || selectedDateInfo?.status !== 'available'}
                                                >
                                                    <SelectTrigger className="h-12 border-slate-200 focus:ring-[#38BDF8] focus:border-[#38BDF8] text-base">
                                                        <SelectValue placeholder={!formData.preferred_date ? "Pending date..." : "Choose time"} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {availablePeriods.map((period) => (
                                                            <SelectItem
                                                                key={period.id}
                                                                value={period.id}
                                                                disabled={period.status === 'full'}
                                                            >
                                                                <div className="flex items-center justify-between w-full py-1">
                                                                    <div className="flex items-center gap-3">
                                                                        <Clock className={cn("w-4 h-4", period.status === 'full' ? "text-slate-300" : "text-[#38BDF8]")} />
                                                                        <span className={period.status === 'full' ? "text-slate-300" : "text-slate-700 font-medium"}>
                                                                            {period.name}
                                                                        </span>
                                                                    </div>
                                                                    {period.status === 'full' && (
                                                                        <span className="text-[10px] uppercase font-bold text-slate-400 px-2 py-0.5 bg-slate-50 border border-slate-100 rounded">Fully Booked</span>
                                                                    )}
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* Status Alerts */}
                                        {selectedDateInfo && selectedDateInfo.status !== 'available' && (
                                            <Alert className="bg-rose-50 border-rose-100 text-rose-800 rounded-2xl">
                                                <AlertCircle className="h-4 w-4 text-rose-500" />
                                                <AlertDescription className="font-medium">
                                                    {selectedDateInfo.reason}
                                                </AlertDescription>
                                            </Alert>
                                        )}

                                        <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-500">
                                            <Info className="w-5 h-5 text-slate-400 shrink-0" />
                                            <p className="text-sm font-medium">
                                                Staff will review and confirm your exact appointment time.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 3: SUBMIT */}
                                <div className="pt-6">
                                    <Button
                                        type="submit"
                                        className="w-full h-14 text-lg font-bold bg-[#38BDF8] hover:bg-[#0EA5E9] text-white rounded-2xl shadow-lg shadow-sky-100 active:scale-[0.98] transition-all disabled:shadow-none"
                                        size="lg"
                                        disabled={isSubmitting || (selectedDateInfo?.status !== 'available')}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <CalendarDays className="w-5 h-5 mr-3" />
                                                Confirm Booking Request
                                            </>
                                        )}
                                    </Button>
                                    <p className="text-center text-xs text-slate-400 mt-4 font-medium">By submitting, you agree to our terms and conditions.</p>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    );
}
