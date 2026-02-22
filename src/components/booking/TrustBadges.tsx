import { CheckCircle, Shield, Award } from 'lucide-react';

interface TrustBadgesProps {
    message1: string | null;
    message2: string | null;
    message3: string | null;
}

export function TrustBadges({ message1, message2, message3 }: TrustBadgesProps) {
    const messages = [
        { text: message1, icon: CheckCircle },
        { text: message2, icon: Shield },
        { text: message3, icon: Award },
    ].filter(m => m.text);

    if (messages.length === 0) return null;

    return (
        <div className="py-8 md:py-10">
            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        {messages.map((item, index) => {
                            const Icon = item.icon;
                            return (
                                <div
                                    key={index}
                                    className="flex items-center gap-3 bg-gradient-to-r from-primary/8 to-primary/4 px-5 py-3 rounded-full border border-primary/10"
                                >
                                    <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center">
                                        <Icon className="w-3.5 h-3.5 text-primary" />
                                    </div>
                                    <span className="text-sm font-medium text-foreground/80">{item.text}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
