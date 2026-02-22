import { useEffect, useRef, useState } from 'react';

interface StatItem {
    label: string;
    value: string;
    suffix?: string;
}

interface StatsSectionProps {
    stats: StatItem[];
}

function AnimatedCounter({ value, suffix }: { value: string; suffix?: string }) {
    const [display, setDisplay] = useState('0');
    const ref = useRef<HTMLDivElement>(null);
    const hasAnimated = useRef(false);

    useEffect(() => {
        const num = parseInt(value, 10);
        if (isNaN(num)) {
            setDisplay(value);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated.current) {
                    hasAnimated.current = true;
                    const duration = 1500;
                    const steps = 40;
                    const increment = num / steps;
                    let current = 0;
                    let step = 0;

                    const timer = setInterval(() => {
                        step++;
                        current = Math.min(Math.round(increment * step), num);
                        setDisplay(current.toLocaleString());
                        if (step >= steps) clearInterval(timer);
                    }, duration / steps);
                }
            },
            { threshold: 0.3 }
        );

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [value]);

    return (
        <div ref={ref} className="text-3xl md:text-4xl font-bold text-primary">
            {display}{suffix}
        </div>
    );
}

export function StatsSection({ stats }: StatsSectionProps) {
    if (!stats || stats.length === 0) return null;

    return (
        <section className="py-12 md:py-16">
            <div className="container mx-auto px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
                        {stats.map((stat, index) => (
                            <div
                                key={index}
                                className="text-center bg-card rounded-2xl border border-border/50 p-6 md:p-8 shadow-sm"
                            >
                                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                                <p className="text-sm md:text-base text-muted-foreground mt-2 font-medium">
                                    {stat.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
