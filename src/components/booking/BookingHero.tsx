import { Phone, Mail, MapPin, Stethoscope, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ClinicProfile {
    clinic_name: string;
    logo_url: string | null;
    description: string | null;
    phone_number: string | null;
    email: string | null;
    address: string | null;
    welcome_title?: string | null;
    welcome_description?: string | null;
}

interface BookingHeroProps {
    clinicProfile: ClinicProfile | null;
}

export function BookingHero({ clinicProfile }: BookingHeroProps) {
    const scrollToForm = () => {
        document.getElementById('booking-form')?.scrollIntoView({ behavior: 'smooth' });
    };
    return (
        <header className="relative overflow-hidden bg-gradient-to-br from-primary/8 via-primary/4 to-transparent">
            {/* Decorative background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-primary/3 rounded-full blur-3xl" />
            </div>

            <div className="relative container mx-auto px-4 py-16 md:py-20 lg:py-24">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Logo & Clinic Name */}
                    <div className="flex flex-col items-center mb-8">
                        {clinicProfile?.logo_url ? (
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-xl transform scale-110" />
                                <img
                                    src={clinicProfile.logo_url}
                                    alt={clinicProfile.clinic_name}
                                    className="relative w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover shadow-xl border-4 border-card"
                                />
                            </div>
                        ) : (
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-primary/30 rounded-3xl blur-xl transform scale-110" />
                                <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-xl flex items-center justify-center border-4 border-card">
                                    <Stethoscope className="w-12 h-12 md:w-14 md:h-14 text-primary-foreground" />
                                </div>
                            </div>
                        )}
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
                            {clinicProfile?.clinic_name || 'EyeCare Clinic'}
                        </h1>
                    </div>

                    {/* Welcome Content */}
                    {(clinicProfile?.welcome_title || clinicProfile?.welcome_description) && (
                        <div className="mb-8 space-y-3">
                            {clinicProfile?.welcome_title && (
                                <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold text-foreground/90">
                                    {clinicProfile.welcome_title}
                                </h2>
                            )}
                            {clinicProfile?.welcome_description && (
                                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                                    {clinicProfile.welcome_description}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Short Description */}
                    {clinicProfile?.description && (
                        <p className="text-base md:text-lg text-muted-foreground/80 mb-10 leading-relaxed max-w-2xl mx-auto">
                            {clinicProfile.description}
                        </p>
                    )}

                    {/* CTA Button */}
                    <div className="mb-10">
                        <Button size="lg" className="h-14 px-8 text-lg font-semibold shadow-lg hover:shadow-xl transition-all gap-2" onClick={scrollToForm}>
                            <CalendarDays className="w-5 h-5" />
                            Book Appointment Now
                        </Button>
                    </div>

                    {/* Contact Info Strip */}
                    {(clinicProfile?.phone_number || clinicProfile?.email || clinicProfile?.address) && (
                        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
                            {clinicProfile?.phone_number && (
                                <a
                                    href={`tel:${clinicProfile.phone_number}`}
                                    className="group flex items-center gap-2.5 text-slate-600 hover:text-[#38BDF8] transition-all duration-200 bg-white/50 backdrop-blur-sm px-5 py-3 rounded-full border border-slate-200 hover:border-[#38BDF8]/40 hover:shadow-md"
                                >
                                    <div className="w-8 h-8 rounded-full bg-[#38BDF8]/10 flex items-center justify-center group-hover:bg-[#38BDF8]/20 transition-colors">
                                        <Phone className="w-4 h-4 text-[#38BDF8]" />
                                    </div>
                                    <span className="font-semibold">{clinicProfile.phone_number}</span>
                                </a>
                            )}
                            {clinicProfile?.email && (
                                <a
                                    href={`mailto:${clinicProfile.email}`}
                                    className="group flex items-center gap-2.5 text-slate-600 hover:text-[#38BDF8] transition-all duration-200 bg-white/50 backdrop-blur-sm px-5 py-3 rounded-full border border-slate-200 hover:border-[#38BDF8]/40 hover:shadow-md"
                                >
                                    <div className="w-8 h-8 rounded-full bg-[#38BDF8]/10 flex items-center justify-center group-hover:bg-[#38BDF8]/20 transition-colors">
                                        <Mail className="w-4 h-4 text-[#38BDF8]" />
                                    </div>
                                    <span className="font-semibold">{clinicProfile.email}</span>
                                </a>
                            )}
                            {clinicProfile?.address && (
                                <div className="flex items-center gap-2.5 text-slate-600 bg-white/50 backdrop-blur-sm px-5 py-3 rounded-full border border-slate-200">
                                    <div className="w-8 h-8 rounded-full bg-[#38BDF8]/10 flex items-center justify-center">
                                        <MapPin className="w-4 h-4 text-[#38BDF8]" />
                                    </div>
                                    <span className="font-semibold">{clinicProfile.address}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
