/**
 * Types and helpers for marketing content.
 * Provides defaults since the current schema doesn't have a marketing_content column.
 */

export interface MarketingFeature {
    title: string;
    description: string;
}

export interface MarketingStat {
    label: string;
    value: string;
    suffix?: string;
}

export interface MarketingTestimonial {
    author_name: string;
    content: string;
    rating: number;
    image_url?: string | null;
}

export interface MarketingContent {
    features?: MarketingFeature[];
    statistics?: MarketingStat[];
    testimonials?: MarketingTestimonial[];
    hero_title?: string | null;
    hero_description?: string | null;
    seo_title?: string | null;
    seo_description?: string | null;
    badges?: string[];
}

export const DEFAULT_MARKETING_CONTENT: MarketingContent = {
    features: [
        { title: "Expert Care", description: "Our team of specialists provides top-tier medical assistance tailored to your needs." },
        { title: "Modern Facilities", description: "Equipped with the latest technology for accurate diagnosis and treatment." },
        { title: "Patient First", description: "We prioritize your comfort and well-being in every step of your journey." }
    ],
    statistics: [
        { label: "Happy Patients", value: "5000", suffix: "+" },
        { label: "Years Experience", value: "15", suffix: "" },
        { label: "Specialists", value: "12", suffix: "" }
    ],
    testimonials: [
        { author_name: "John Doe", content: "Excellent service and very professional staff. Highly recommended!", rating: 5 },
        { author_name: "Jane Smith", content: "The booking process was so smooth, and the care was exceptional.", rating: 5 }
    ],
    hero_title: null,
    hero_description: null,
    seo_title: null,
    seo_description: null,
    badges: ["Premium Care", "Expert Specialists", "Modern Technology"]
};

export function parseMarketingContent(raw: unknown): MarketingContent {
    if (!raw || typeof raw !== 'object') return DEFAULT_MARKETING_CONTENT;
    const obj = raw as Record<string, unknown>;

    return {
        features: Array.isArray(obj.features) ? obj.features : DEFAULT_MARKETING_CONTENT.features,
        statistics: Array.isArray(obj.statistics) ? obj.statistics : DEFAULT_MARKETING_CONTENT.statistics,
        testimonials: Array.isArray(obj.testimonials) ? obj.testimonials : DEFAULT_MARKETING_CONTENT.testimonials,
        hero_title: typeof obj.hero_title === 'string' ? obj.hero_title : null,
        hero_description: typeof obj.hero_description === 'string' ? obj.hero_description : null,
        seo_title: typeof obj.seo_title === 'string' ? obj.seo_title : null,
        seo_description: typeof obj.seo_description === 'string' ? obj.seo_description : null,
        badges: Array.isArray(obj.badges) ? obj.badges : DEFAULT_MARKETING_CONTENT.badges,
    };
}
