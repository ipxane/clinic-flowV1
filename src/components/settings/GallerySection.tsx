import { useState } from "react";
import { Trash2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSettings } from "@/hooks/useSettings";
import { ImageUpload } from "@/components/ui/ImageUpload";

export function GallerySection() {
    const { clinicSettings, updateClinicSettings, uploadImage } = useSettings();

    const galleryImages = clinicSettings?.gallery_images || [];

    const handleAddImage = async (url: string) => {
        if (!url) return;

        const updatedImages = [...galleryImages, url];
        await updateClinicSettings({ gallery_images: updatedImages });
    };

    const handleDeleteImage = async (url: string) => {
        const updatedImages = galleryImages.filter((img) => img !== url);
        await updateClinicSettings({ gallery_images: updatedImages });
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ImageUpload
                    label="Add New Image"
                    onChange={handleAddImage}
                    onRemove={() => { }}
                    uploadFn={(file) => uploadImage(file, "gallery")}
                    aspectRatio="video"
                />
            </div>

            {galleryImages.length === 0 ? (
                <Card className="border-dashed shadow-none bg-muted/10">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <ImageIcon className="h-10 w-10 mb-2 opacity-10" />
                        <p className="text-sm font-medium">No images in your gallery yet.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {galleryImages.map((url, index) => (
                        <div key={index} className="group relative aspect-video rounded-md overflow-hidden bg-muted border shadow-sm">
                            <img
                                src={url}
                                alt={`Gallery image ${index + 1}`}
                                className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="h-8 w-8 shadow-lg"
                                    onClick={() => handleDeleteImage(url)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
