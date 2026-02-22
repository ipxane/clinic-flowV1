import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface BookingSuccessProps {
    onReset: () => void;
}

export function BookingSuccess({ onReset }: BookingSuccessProps) {
    return (
        <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background flex items-center justify-center p-4">
            <Card className="w-full max-w-md text-center shadow-2xl border-border/40 overflow-hidden">
                {/* Success header gradient */}
                <div className="bg-gradient-to-r from-[#10B981]/20 via-[#10B981]/10 to-transparent pt-10 pb-6">
                    <div className="w-24 h-24 rounded-full bg-[#10B981]/10 flex items-center justify-center mx-auto border-4 border-[#10B981]/20">
                        <CheckCircle className="w-12 h-12 text-[#10B981]" />
                    </div>
                </div>

                <CardContent className="pb-10 pt-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Request Submitted!</h2>
                    <p className="text-muted-foreground mb-8 leading-relaxed text-base">
                        Thank you for your booking request. Our clinic staff will review your request and contact you to confirm your appointment.
                    </p>
                    <Button
                        size="lg"
                        className="h-12 px-8 text-base font-semibold"
                        onClick={onReset}
                    >
                        Submit Another Request
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
