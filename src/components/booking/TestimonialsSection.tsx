import { Star, Quote } from 'lucide-react';

interface Testimonial {
    author_name: string;
    content: string;
    rating: number;
    image_url?: string | null;
}

interface TestimonialsSectionProps {
    testimonials: Testimonial[];
}

export function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
    if (!testimonials || testimonials.length === 0) return null;

    return (
        <section className="py-12 md:py-16 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/3 to-transparent" />
            <div className="relative container mx-auto px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                            What Our Patients Say
                        </h2>
                        <p className="text-muted-foreground mt-2">Trusted by patients who care about their health</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                        {testimonials.map((testimonial, index) => (
                            <div
                                key={index}
                                className="relative bg-card rounded-2xl border border-border/50 p-6 md:p-8 shadow-sm"
                            >
                                <Quote className="w-8 h-8 text-primary/15 absolute top-4 right-4" />
                                <div className="flex gap-0.5 mb-4">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`w-4 h-4 ${i < testimonial.rating
                                                ? 'text-[#F59E0B] fill-[#F59E0B]'
                                                : 'text-border'
                                                }`}
                                        />
                                    ))}
                                </div>
                                <p className="text-foreground/80 leading-relaxed mb-4 text-sm md:text-base">
                                    "{testimonial.content}"
                                </p>
                                <p className="font-semibold text-foreground text-sm">
                                    — {testimonial.author_name}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
