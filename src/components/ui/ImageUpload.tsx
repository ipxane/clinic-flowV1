import { useState, useRef } from "react";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    onRemove: () => void;
    uploadFn: (file: File) => Promise<string>;
    label?: string;
    className?: string;
    aspectRatio?: "video" | "square" | "portrait";
}

export function ImageUpload({
    value,
    onChange,
    onRemove,
    uploadFn,
    label,
    className,
    aspectRatio = "video",
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
        if (!validTypes.includes(file.type)) {
            toast({
                title: "Invalid file type",
                description: "Please select a JPG, PNG, or WebP image.",
                variant: "destructive",
            });
            return;
        }

        // Validate size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "File too large",
                description: "Image size must be less than 5MB.",
                variant: "destructive",
            });
            return;
        }

        setIsUploading(true);
        try {
            const url = await uploadFn(file);
            onChange(url);
        } catch (error: any) {
            console.error("Upload error:", error);
            toast({
                title: "Upload failed",
                description: error.message || "Could not upload image.",
                variant: "destructive",
            });
        } finally {
            setIsUploading(false);
        }
    };

    const aspectClasses = {
        video: "aspect-video",
        square: "aspect-square",
        portrait: "aspect-[3/4]",
    };

    return (
        <div className={cn("space-y-2", className)}>
            {label && <label className="text-sm font-medium">{label}</label>}

            <div
                className={cn(
                    "relative border-2 border-dashed rounded-xl overflow-hidden bg-muted/30 flex flex-col items-center justify-center transition-colors group",
                    aspectClasses[aspectRatio],
                    !value && "hover:border-primary/50 hover:bg-muted/50",
                    value && "border-solid border-border"
                )}
            >
                {value ? (
                    <>
                        <img
                            src={value}
                            alt="Uploaded"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                            >
                                Change
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemove();
                                }}
                                disabled={isUploading}
                            >
                                Remove
                            </Button>
                        </div>
                    </>
                ) : (
                    <div
                        className="flex flex-col items-center justify-center cursor-pointer w-full h-full p-4"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {isUploading ? (
                            <Loader2 className="h-10 w-10 text-primary animate-spin" />
                        ) : (
                            <>
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                                    <Upload className="h-6 w-6 text-primary" />
                                </div>
                                <p className="text-sm font-medium">Click to upload image</p>
                                <p className="text-xs text-muted-foreground mt-1 text-center">
                                    JPG, PNG or WebP. Max 5MB.
                                </p>
                            </>
                        )}
                    </div>
                )}
            </div>

            <input
                type="file"
                className="hidden"
                accept=".jpg,.jpeg,.png,.webp"
                ref={fileInputRef}
                onChange={handleFileChange}
                disabled={isUploading}
            />
        </div>
    );
}
