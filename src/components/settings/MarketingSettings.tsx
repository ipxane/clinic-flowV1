import { useState, useEffect } from "react";
import {
    Building2,
    Image as ImageIcon,
    MessageSquare,
    Search,
    Layout,
    Plus,
    Trash2,
    Save,
    Loader2,
    Star,
    CheckCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSettings } from "@/hooks/useSettings";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { TestimonialsSection } from "./TestimonialsSection";
import { GallerySection } from "./GallerySection";
import { useToast } from "@/hooks/use-toast";

interface MarketingFields {
    hero_title?: string;
    hero_description?: string;
    seo_title?: string;
    seo_description?: string;
    features?: { title: string; description: string }[];
    statistics?: { label: string; value: string; suffix?: string }[];
    badges?: string[];
}

interface FormData {
    clinic_name: string;
    clinic_description: string;
    phone: string;
    email: string;
    address: string;
    logo_url: string;
    marketing_fields: MarketingFields;
}

export function MarketingSettings() {
    const { clinicSettings, updateClinicSettings, uploadImage, isLoading } = useSettings();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    // Local state for all fields
    const [formData, setFormData] = useState<FormData>({
        clinic_name: "",
        clinic_description: "",
        phone: "",
        email: "",
        address: "",
        logo_url: "",
        marketing_fields: {}
    });

    useEffect(() => {
        if (clinicSettings) {
            const marketing = (clinicSettings.marketing_fields as MarketingFields) || {};
            setFormData({
                clinic_name: clinicSettings.clinic_name || "",
                clinic_description: clinicSettings.clinic_description || "",
                phone: clinicSettings.phone || "",
                email: clinicSettings.email || "",
                address: clinicSettings.address || "",
                logo_url: clinicSettings.logo_url || "",
                marketing_fields: marketing,
            });
        }
    }, [clinicSettings]);

    const handleSave = async () => {
        if (!clinicSettings) return;
        setIsSaving(true);
        try {
            await updateClinicSettings({
                clinic_name: formData.clinic_name,
                clinic_description: formData.clinic_description,
                phone: formData.phone,
                email: formData.email,
                address: formData.address,
                logo_url: formData.logo_url,
                marketing_fields: formData.marketing_fields,
            });
            toast({
                title: "Settings saved",
                description: "Your marketing settings have been updated successfully.",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save settings. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpload = async (file: File, path: string) => {
        return await uploadImage(file, path);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-10 max-w-5xl">
            {/* Header with Save Button */}
            <div className="flex items-center justify-between sticky top-0 z-10 bg-background/95 backdrop-blur py-4 border-b">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Marketing Page Settings</h2>
                    <p className="text-muted-foreground">Configure how your clinic appears to the public.</p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={handleSave} disabled={isSaving} className="px-6 h-10">
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            <div className="grid gap-10">
                {/* HERO SECTION */}
                <Card className="border shadow-sm bg-card overflow-hidden">
                    <CardHeader className="border-b bg-muted/20 pb-4">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                                <Layout className="h-4 w-4 text-primary" />
                            </div>
                            <CardTitle className="text-lg">Hero Section</CardTitle>
                        </div>
                        <CardDescription>Main headline and introductory content for your booking page.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="clinic_name">Clinic Name</Label>
                                    <Input
                                        id="clinic_name"
                                        value={formData.clinic_name}
                                        onChange={(e) => setFormData({ ...formData, clinic_name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="hero_title">Hero Headline (Optional)</Label>
                                    <Input
                                        id="hero_title"
                                        placeholder="e.g. Expert Eye Care for Your Family"
                                        value={formData.marketing_fields.hero_title || ""}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            marketing_fields: { ...formData.marketing_fields, hero_title: e.target.value }
                                        })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="clinic_description">Short Description</Label>
                                    <Textarea
                                        id="clinic_description"
                                        rows={4}
                                        value={formData.clinic_description}
                                        onChange={(e) => setFormData({ ...formData, clinic_description: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <ImageUpload
                                    label="Clinic Logo"
                                    value={formData.logo_url}
                                    onChange={(url) => setFormData({ ...formData, logo_url: url })}
                                    onRemove={() => setFormData({ ...formData, logo_url: "" })}
                                    uploadFn={(file) => handleUpload(file, "logos")}
                                    aspectRatio="square"
                                    className="max-w-[200px]"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* FEATURES & STATISTICS SECTION */}
                <Card className="border shadow-sm bg-card overflow-hidden">
                    <CardHeader className="border-b bg-muted/20 pb-4">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                                <Star className="h-4 w-4 text-primary" />
                            </div>
                            <CardTitle className="text-lg">Features & Statistics</CardTitle>
                        </div>
                        <CardDescription>Highlights and key metrics about your clinic.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-8">
                        {/* Features Editor */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-sm">Key Features</h4>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const features = formData.marketing_fields.features || [];
                                        setFormData({
                                            ...formData,
                                            marketing_fields: {
                                                ...formData.marketing_fields,
                                                features: [...features, { title: "New Feature", description: "Enter description..." }]
                                            }
                                        });
                                    }}
                                >
                                    <Plus className="h-3 w-3 mr-1" /> Add Feature
                                </Button>
                            </div>
                            <div className="grid gap-4">
                                {(formData.marketing_fields.features || []).map((feature, idx) => (
                                    <div key={idx} className="flex gap-4 p-4 rounded-lg border bg-muted/10">
                                        <div className="flex-1 space-y-3">
                                            <Input
                                                placeholder="Feature Title"
                                                value={feature.title}
                                                onChange={(e) => {
                                                    const features = [...(formData.marketing_fields.features || [])];
                                                    features[idx].title = e.target.value;
                                                    setFormData({
                                                        ...formData,
                                                        marketing_fields: { ...formData.marketing_fields, features }
                                                    });
                                                }}
                                            />
                                            <Textarea
                                                placeholder="Feature Description"
                                                rows={2}
                                                value={feature.description}
                                                onChange={(e) => {
                                                    const features = [...(formData.marketing_fields.features || [])];
                                                    features[idx].description = e.target.value;
                                                    setFormData({
                                                        ...formData,
                                                        marketing_fields: { ...formData.marketing_fields, features }
                                                    });
                                                }}
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                const features = [...(formData.marketing_fields.features || [])].filter((_, i) => i !== idx);
                                                setFormData({
                                                    ...formData,
                                                    marketing_fields: { ...formData.marketing_fields, features }
                                                });
                                            }}
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Statistics Editor */}
                        <div className="space-y-4 pt-4 border-t">
                            <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-sm">Vital Statistics</h4>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const statistics = formData.marketing_fields.statistics || [];
                                        setFormData({
                                            ...formData,
                                            marketing_fields: {
                                                ...formData.marketing_fields,
                                                statistics: [...statistics, { label: "New Stat", value: "0", suffix: "+" }]
                                            }
                                        });
                                    }}
                                >
                                    <Plus className="h-3 w-3 mr-1" /> Add Statistic
                                </Button>
                            </div>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {(formData.marketing_fields.statistics || []).map((stat, idx) => (
                                    <div key={idx} className="p-4 rounded-lg border bg-muted/10 space-y-3 relative group">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                const statistics = [...(formData.marketing_fields.statistics || [])].filter((_, i) => i !== idx);
                                                setFormData({
                                                    ...formData,
                                                    marketing_fields: { ...formData.marketing_fields, statistics }
                                                });
                                            }}
                                            className="h-6 w-6 absolute top-2 right-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Label</Label>
                                            <Input
                                                placeholder="Label"
                                                value={stat.label}
                                                className="h-8"
                                                onChange={(e) => {
                                                    const statistics = [...(formData.marketing_fields.statistics || [])];
                                                    statistics[idx].label = e.target.value;
                                                    setFormData({
                                                        ...formData,
                                                        marketing_fields: { ...formData.marketing_fields, statistics }
                                                    });
                                                }}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Value</Label>
                                                <Input
                                                    placeholder="Value"
                                                    value={stat.value}
                                                    className="h-8"
                                                    onChange={(e) => {
                                                        const statistics = [...(formData.marketing_fields.statistics || [])];
                                                        statistics[idx].value = e.target.value;
                                                        setFormData({
                                                            ...formData,
                                                            marketing_fields: { ...formData.marketing_fields, statistics }
                                                        });
                                                    }}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Suffix</Label>
                                                <Input
                                                    placeholder="Suffix"
                                                    value={stat.suffix || ""}
                                                    className="h-8"
                                                    onChange={(e) => {
                                                        const statistics = [...(formData.marketing_fields.statistics || [])];
                                                        statistics[idx].suffix = e.target.value;
                                                        setFormData({
                                                            ...formData,
                                                            marketing_fields: { ...formData.marketing_fields, statistics }
                                                        });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* GALLERY SECTION */}
                <Card className="border shadow-sm bg-card overflow-hidden">
                    <CardHeader className="border-b bg-muted/20 pb-4">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                                <ImageIcon className="h-4 w-4 text-primary" />
                            </div>
                            <CardTitle className="text-lg">Images & Gallery</CardTitle>
                        </div>
                        <CardDescription>Manage images to showcase your clinic's environment and equipment.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <GallerySection />
                    </CardContent>
                </Card>

                {/* TESTIMONIALS SECTION */}
                <Card className="border shadow-sm bg-card overflow-hidden">
                    <CardHeader className="border-b bg-muted/20 pb-4">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                                <MessageSquare className="h-4 w-4 text-primary" />
                            </div>
                            <CardTitle className="text-lg">Patient Testimonials</CardTitle>
                        </div>
                        <CardDescription>Display positive feedback from your patients to build trust.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <TestimonialsSection />
                    </CardContent>
                </Card>

                {/* SEO & METADATA SECTION */}
                <Card className="border shadow-sm bg-card overflow-hidden">
                    <CardHeader className="border-b bg-muted/20 pb-4">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                                <Search className="h-4 w-4 text-primary" />
                            </div>
                            <CardTitle className="text-lg">SEO & Metadata</CardTitle>
                        </div>
                        <CardDescription>Optimize your page for search engines and social sharing.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="seo_title">SEO Page Title</Label>
                                    <Input
                                        id="seo_title"
                                        placeholder="e.g. Best Eye Clinic in London | MyClinic"
                                        value={formData.marketing_fields.seo_title || ""}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            marketing_fields: { ...formData.marketing_fields, seo_title: e.target.value }
                                        })}
                                    />
                                    <p className="text-xs text-muted-foreground">Appears in browser tabs and search results.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="seo_description">Meta Description</Label>
                                    <Textarea
                                        id="seo_description"
                                        rows={3}
                                        placeholder="Brief summary of your clinic for search engines..."
                                        value={formData.marketing_fields.seo_description || ""}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            marketing_fields: { ...formData.marketing_fields, seo_description: e.target.value }
                                        })}
                                    />
                                </div>
                            </div>
                            <div className="bg-muted/20 p-4 rounded-lg border flex flex-col justify-center">
                                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                    <Search className="h-3 w-3 text-muted-foreground" />
                                    Search Preview
                                </h4>
                                <div className="space-y-1">
                                    <div className="text-blue-600 text-lg font-medium hover:underline cursor-pointer truncate">
                                        {formData.marketing_fields.seo_title || formData.clinic_name || "Clinic Name"}
                                    </div>
                                    <div className="text-green-700 text-sm truncate">
                                        https://{formData.clinic_name?.toLowerCase().replace(/\s+/g, '-') || "your-clinic"}.clinic-flow.com
                                    </div>
                                    <div className="text-muted-foreground text-sm line-clamp-2">
                                        {formData.marketing_fields.seo_description || formData.clinic_description || "Book your appointment online with our expert team..."}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* TRUST BADGES SECTION */}
                <Card className="border shadow-sm bg-card overflow-hidden">
                    <CardHeader className="border-b bg-muted/20 pb-4">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                                <CheckCircle className="h-4 w-4 text-primary" />
                            </div>
                            <CardTitle className="text-lg">Trust Badges</CardTitle>
                        </div>
                        <CardDescription>Short positive labels shown across the page to build credibility.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="grid sm:grid-cols-3 gap-4">
                            {[0, 1, 2].map((idx) => (
                                <div key={idx} className="space-y-2">
                                    <Label>Badge {idx + 1}</Label>
                                    <Input
                                        placeholder="e.g. Expert Care"
                                        value={formData.marketing_fields.badges?.[idx] || ""}
                                        onChange={(e) => {
                                            const badges = [...(formData.marketing_fields.badges || ["", "", ""])];
                                            badges[idx] = e.target.value;
                                            setFormData({
                                                ...formData,
                                                marketing_fields: { ...formData.marketing_fields, badges }
                                            });
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* CONTACT INFO SECTION */}
                <Card className="border shadow-sm bg-card overflow-hidden">
                    <CardHeader className="border-b bg-muted/20 pb-4">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                                <Building2 className="h-4 w-4 text-primary" />
                            </div>
                            <CardTitle className="text-lg">Contact Information</CardTitle>
                        </div>
                        <CardDescription>Configure contact details and location shown on the booking page.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="public_phone">Public Phone</Label>
                                    <Input
                                        id="public_phone"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="public_email">Public Email</Label>
                                    <Input
                                        id="public_email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="public_address">Office Address</Label>
                                <Textarea
                                    id="public_address"
                                    rows={4}
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end pt-6 pb-12 border-t">
                <Button onClick={handleSave} disabled={isSaving} className="px-10 h-11">
                    {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                    Save All Marketing Settings
                </Button>
            </div>
        </div>
    );
}
