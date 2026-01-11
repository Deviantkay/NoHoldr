"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Upload, Image as ImageIcon, Download, X, ArrowRight } from "lucide-react";

interface ImageFile {
    id: string;
    file: File;
    name: string;
    convertedUrl?: string;
    convertedName?: string;
}

const formats = [
    { value: "image/jpeg", label: "JPEG", ext: "jpg" },
    { value: "image/png", label: "PNG", ext: "png" },
    { value: "image/webp", label: "WebP", ext: "webp" },
];

export default function ConvertImagePage() {
    const [images, setImages] = useState<ImageFile[]>([]);
    const [targetFormat, setTargetFormat] = useState("image/jpeg");
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
    const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
        addImages(files);
    }, []);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            addImages(Array.from(e.target.files).filter(f => f.type.startsWith("image/")));
        }
    }, []);

    const addImages = (files: File[]) => {
        const newImages: ImageFile[] = files.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            name: file.name,
        }));
        setImages(prev => [...prev, ...newImages]);
    };

    const convertImage = async (file: File, format: string): Promise<{ url: string; name: string }> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                if (!ctx) { reject(new Error("No context")); return; }

                // White background for JPEG (no transparency)
                if (format === "image/jpeg") {
                    ctx.fillStyle = "#ffffff";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                ctx.drawImage(img, 0, 0);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const ext = formats.find(f => f.value === format)?.ext || "jpg";
                        const newName = file.name.replace(/\.[^.]+$/, "") + "." + ext;
                        resolve({ url: URL.createObjectURL(blob), name: newName });
                    } else {
                        reject(new Error("Failed"));
                    }
                }, format, 0.92);
            };
            img.onerror = () => reject(new Error("Failed to load"));
            img.src = URL.createObjectURL(file);
        });
    };

    const handleConvert = async () => {
        if (images.length === 0) return;

        setIsProcessing(true);
        setProgress(0);

        const updated = [...images];

        for (let i = 0; i < updated.length; i++) {
            setProgress(Math.round((i / updated.length) * 100));

            try {
                if (updated[i].convertedUrl) URL.revokeObjectURL(updated[i].convertedUrl!);

                const result = await convertImage(updated[i].file, targetFormat);
                updated[i].convertedUrl = result.url;
                updated[i].convertedName = result.name;
            } catch (error) {
                console.error(`Failed to convert ${updated[i].name}:`, error);
            }
        }

        setImages(updated);
        setProgress(100);
        setIsProcessing(false);
    };

    const downloadImage = (img: ImageFile) => {
        if (!img.convertedUrl || !img.convertedName) return;
        const link = document.createElement("a");
        link.href = img.convertedUrl;
        link.download = img.convertedName;
        link.click();
    };

    const downloadAll = async () => {
        const JSZip = (await import("jszip")).default;
        const zip = new JSZip();

        for (const img of images) {
            if (img.convertedUrl && img.convertedName) {
                const response = await fetch(img.convertedUrl);
                const blob = await response.blob();
                zip.file(img.convertedName, blob);
            }
        }

        const zipBlob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "converted_images.zip";
        link.click();
        URL.revokeObjectURL(url);
    };

    const hasConverted = images.some(img => img.convertedUrl);
    const targetLabel = formats.find(f => f.value === targetFormat)?.label || "JPEG";

    return (
        <div className="max-w-3xl mx-auto px-4 py-6">
            <div className="flex items-center gap-4 mb-6 border-b pb-4">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/image"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <div>
                    <h1 className="text-xl font-semibold">Convert Images</h1>
                    <p className="text-sm text-muted-foreground">Change format</p>
                </div>
            </div>

            <Card className="mb-4">
                <CardContent className="p-0">
                    <div
                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById("image-upload")?.click()}
                    >
                        <input type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" id="image-upload" />
                        <div className="flex flex-col items-center gap-2">
                            <Upload className="h-6 w-6 text-muted-foreground" />
                            <span className="text-sm"><span className="font-medium">Drop images</span> or click</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {images.length > 0 && (
                <>
                    <Card className="mb-4">
                        <CardContent className="p-4">
                            <Label className="text-sm mb-2 block">Convert to</Label>
                            <Select value={targetFormat} onValueChange={setTargetFormat}>
                                <SelectTrigger className="w-40">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {formats.map(f => (
                                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>

                    <Card className="mb-4">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium">{images.length} images</span>
                                <Button variant="ghost" size="sm" onClick={() => setImages([])} className="text-xs h-7">Clear</Button>
                            </div>
                            <div className="space-y-2">
                                {images.map((img) => (
                                    <div key={img.id} className="flex items-center gap-2 p-2 rounded border bg-muted/30 text-sm">
                                        <ImageIcon className="h-4 w-4 text-blue-500 shrink-0" />
                                        <span className="flex-1 truncate">{img.name}</span>
                                        {img.convertedName && (
                                            <>
                                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-xs text-green-600">{img.convertedName.split(".").pop()?.toUpperCase()}</span>
                                            </>
                                        )}
                                        {img.convertedUrl && (
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => downloadImage(img)}>
                                                <Download className="h-3 w-3" />
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setImages(prev => prev.filter(i => i.id !== img.id))}>
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {isProcessing && (
                        <Card className="mb-4">
                            <CardContent className="py-3 px-4">
                                <Progress value={progress} className="h-2" />
                            </CardContent>
                        </Card>
                    )}

                    <div className="flex justify-end gap-2">
                        {hasConverted && images.length > 1 && (
                            <Button variant="outline" onClick={downloadAll}>
                                <Download className="h-4 w-4 mr-2" />Download All
                            </Button>
                        )}
                        <Button onClick={handleConvert} disabled={isProcessing}>
                            Convert to {targetLabel}
                        </Button>
                    </div>
                </>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">Processed locally • Never uploaded</p>
        </div>
    );
}
