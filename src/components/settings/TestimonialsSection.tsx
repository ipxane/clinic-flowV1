import { useState } from "react";
import { Plus, Trash2, Edit2, Star, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useSettings, Testimonial } from "@/hooks/useSettings";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { cn } from "@/lib/utils";

export function TestimonialsSection() {
    const { testimonials, addTestimonial, updateTestimonial, deleteTestimonial, uploadImage } = useSettings();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTestimonial, setEditingTestimonial] = useState<Partial<Testimonial> | null>(null);

    const [formData, setFormData] = useState({
        author_name: "",
        author_role: "",
        content: "",
        rating: 5,
        image_url: "",
        is_active: true,
    });

    const handleOpenDialog = (testimonial?: Testimonial) => {
        if (testimonial) {
            setEditingTestimonial(testimonial);
            setFormData({
                author_name: testimonial.author_name,
                author_role: testimonial.author_role || "",
                content: testimonial.content,
                rating: testimonial.rating,
                image_url: testimonial.image_url || "",
                is_active: testimonial.is_active,
            });
        } else {
            setEditingTestimonial(null);
            setFormData({
                author_name: "",
                author_role: "",
                content: "",
                rating: 5,
                image_url: "",
                is_active: true,
            });
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.author_name || !formData.content) return;

        if (editingTestimonial?.id) {
            await updateTestimonial(editingTestimonial.id, formData);
        } else {
            await addTestimonial(formData);
        }
        setIsDialogOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Testimonials</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage feedback from your patients to display on the marketing page.
                    </p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Testimonial
                </Button>
            </div>

            {testimonials.length === 0 ? (
                <Card className="border-dashed shadow-none bg-muted/10">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Quote className="h-10 w-10 mb-2 opacity-10" />
                        <p className="text-sm font-medium">No testimonials yet.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {testimonials.map((t) => (
                        <Card key={t.id} className={cn("shadow-sm", !t.is_active && "opacity-60 bg-muted/5")}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center overflow-hidden border border-primary/10">
                                        {t.image_url ? (
                                            <img src={t.image_url} alt={t.author_name} className="h-full w-full object-cover" />
                                        ) : (
                                            <span className="text-xs font-bold text-primary">{t.author_name.charAt(0)}</span>
                                        )}
                                    </div>
                                    <div>
                                        <CardTitle className="text-sm font-bold tracking-tight">{t.author_name}</CardTitle>
                                        <CardDescription className="text-xs font-medium">{t.author_role}</CardDescription>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" onClick={() => handleOpenDialog(t)}>
                                        <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => deleteTestimonial(t.id)}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex mb-3">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={cn("h-3.5 w-3.5 mr-0.5", i < t.rating ? "fill-primary text-primary" : "text-muted")}
                                        />
                                    ))}
                                </div>
                                <p className="text-sm italic text-muted-foreground/90 leading-relaxed border-l-2 border-primary/10 pl-3">
                                    "{t.content}"
                                </p>
                                {!t.is_active && <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-full mt-3 inline-block">Hidden from public</span>}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingTestimonial ? "Edit Testimonial" : "Add Testimonial"}</DialogTitle>
                        <DialogDescription>
                            Create or modify a patient testimonial.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="grid grid-cols-4 items-center gap-6">
                            <Label htmlFor="author_name" className="text-right font-medium">Name</Label>
                            <Input
                                id="author_name"
                                value={formData.author_name}
                                onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                                className="col-span-3 h-10"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-6">
                            <Label htmlFor="author_role" className="text-right font-medium">Role/Title</Label>
                            <Input
                                id="author_role"
                                placeholder="e.g. Regular Patient"
                                value={formData.author_role}
                                onChange={(e) => setFormData({ ...formData, author_role: e.target.value })}
                                className="col-span-3 h-10"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-6">
                            <Label htmlFor="rating" className="text-right font-medium">Rating</Label>
                            <div className="flex items-center gap-1 col-span-3">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <Button
                                        key={s}
                                        variant="ghost"
                                        size="sm"
                                        className="p-1.5 h-auto hover:bg-primary/10"
                                        onClick={() => setFormData({ ...formData, rating: s })}
                                    >
                                        <Star className={cn("h-5 w-5", s <= formData.rating ? "fill-primary text-primary" : "text-muted")} />
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-start gap-6">
                            <Label htmlFor="content" className="text-right mt-2 font-medium">Content</Label>
                            <div className="col-span-3">
                                <Textarea
                                    id="content"
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    className="resize-none"
                                    rows={4}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-start gap-6">
                            <Label className="text-right mt-2 font-medium">Photo</Label>
                            <div className="col-span-3">
                                <ImageUpload
                                    value={formData.image_url}
                                    onChange={(url) => setFormData({ ...formData, image_url: url })}
                                    onRemove={() => setFormData({ ...formData, image_url: "" })}
                                    uploadFn={(file) => uploadImage(file, "testimonials")}
                                    aspectRatio="square"
                                    className="max-w-[120px]"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-6">
                            <Label htmlFor="is_active" className="text-right font-medium">Active</Label>
                            <div className="col-span-3">
                                <Switch
                                    id="is_active"
                                    checked={formData.is_active}
                                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="px-6">Cancel</Button>
                        <Button onClick={handleSave} className="px-6">Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
