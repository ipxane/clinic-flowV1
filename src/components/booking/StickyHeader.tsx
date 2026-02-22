import { useState, useEffect } from 'react';
import { Phone, CalendarDays, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StickyHeaderProps {
    clinicName: string;
    phoneNumber: string | null;
}

export function StickyHeader({ clinicName, phoneNumber }: StickyHeaderProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsVisible(window.scrollY > 300);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToForm = () => {
        document.getElementById('booking-form')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isVisible
                ? 'translate-y-0 opacity-100'
                : '-translate-y-full opacity-0 pointer-events-none'
                }`}
        >
            <div className="bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-[#38BDF8]/10 flex items-center justify-center">
                            <CalendarDays className="w-4 h-4 text-[#38BDF8]" />
                        </div>
                        <span className="font-bold text-slate-900 text-sm md:text-base tracking-tight truncate max-w-[150px] md:max-w-none">
                            {clinicName}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        {phoneNumber && (
                            <a href={`tel:${phoneNumber}`}>
                                <Button variant="ghost" size="sm" className="gap-2 hidden sm:flex text-slate-600 font-semibold hover:text-[#38BDF8] hover:bg-[#38BDF8]/5">
                                    <Phone className="w-4 h-4" />
                                    {phoneNumber}
                                </Button>
                                <Button variant="ghost" size="icon" className="sm:hidden h-10 w-10 text-slate-600 hover:text-[#38BDF8] hover:bg-[#38BDF8]/5">
                                    <Phone className="w-4 h-4" />
                                </Button>
                            </a>
                        )}
                        <Button size="sm" className="h-10 px-6 gap-2 bg-[#38BDF8] hover:bg-[#0EA5E9] text-white font-bold rounded-xl shadow-md shadow-sky-100 transition-all active:scale-95" onClick={scrollToForm}>
                            <CalendarDays className="w-4 h-4" />
                            <span className="hidden sm:inline">Book Appointment</span>
                            <span className="sm:hidden">Book</span>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
