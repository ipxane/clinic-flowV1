import { Phone, Mail, MapPin, Shield, Heart, Stethoscope } from 'lucide-react';

interface BookingFooterProps {
    clinicName: string;
    logoUrl: string | null;
    phoneNumber: string | null;
    email: string | null;
    address: string | null;
    footerText: string | null;
    footerTrustKeywords: string | null;
}

export function BookingFooter({
    clinicName,
    logoUrl,
    phoneNumber,
    email,
    address,
    footerText,
    footerTrustKeywords,
}: BookingFooterProps) {
    return (
        <footer className="relative mt-12 border-t border-border/50">
            {/* Decorative top gradient */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

            <div className="bg-gradient-to-b from-primary/3 to-transparent">
                <div className="container mx-auto px-4 py-12 md:py-16">
                    <div className="max-w-3xl mx-auto text-center">
                        {/* Clinic Name & Logo */}
                        <div className="flex items-center justify-center gap-4 mb-6">
                            {logoUrl ? (
                                <img
                                    src={logoUrl}
                                    alt={clinicName}
                                    className="w-12 h-12 rounded-xl object-cover shadow-md"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
                                    <Stethoscope className="w-6 h-6 text-primary-foreground" />
                                </div>
                            )}
                            <span className="text-2xl font-bold text-foreground">
                                {clinicName || 'EyeCare Clinic'}
                            </span>
                        </div>

                        {/* Footer Text */}
                        {footerText && (
                            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                                {footerText}
                            </p>
                        )}

                        {/* Contact Info */}
                        {(phoneNumber || email || address) && (
                            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground mb-8">
                                {phoneNumber && (
                                    <a
                                        href={`tel:${phoneNumber}`}
                                        className="flex items-center gap-2 hover:text-primary transition-colors group"
                                    >
                                        <Phone className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                        <span>{phoneNumber}</span>
                                    </a>
                                )}
                                {email && (
                                    <a
                                        href={`mailto:${email}`}
                                        className="flex items-center gap-2 hover:text-primary transition-colors group"
                                    >
                                        <Mail className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                        <span>{email}</span>
                                    </a>
                                )}
                                {address && (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        <span>{address}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Trust Keywords or Default */}
                        <div className="pt-6 border-t border-border/30">
                            {footerTrustKeywords ? (
                                <p className="text-sm text-muted-foreground/70 font-medium tracking-wide">
                                    {footerTrustKeywords}
                                </p>
                            ) : (
                                <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground/70">
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-primary/50" />
                                        <span>Secure Booking</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Heart className="w-4 h-4 text-primary/50" />
                                        <span>Patient Care</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
