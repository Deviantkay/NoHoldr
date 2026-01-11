"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Upload, Image as ImageIcon, Download, X, Lock, LockOpen } from "lucide-react";
import JSZip from "jszip";

interface ImageFile {
    id: string;
    file: File;
    name: string;
    width: number;
    height: number;
    resizedUrl?: string;
}

export default function ResizeImagePage() {
    const [images, setImages] = useState<ImageFile[]>([]);
    const [mode, setMode] = useState<"dimensions" | "percentage">("dimensions");
    const [width, setWidth] = useState("");
    const [height, setHeight] = useState("");
    const [percentage, setPercentage] = useState("50");
    const [maintainAspect, setMaintainAspect] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    const addImages = async (files: File[]) => {
        const newImages: ImageFile[] = [];
        for (const file of files) {
            if (!file.type.startsWith("image/")) continue;
            const dims = await getImageDimensions(file);
            newImages.push({
                id: crypto.randomUUID(),
                file,
                name: file.name,
                width: dims.width,
                height: dims.height,
            });
        }
        setImages(prev => [...prev, ...newImages]);
        if (newImages.length > 0 && !width && !height) {
            setWidth(String(newImages[0].width));
            setHeight(String(newImages[0].height));
        }
    };

    const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                resolve({ width: img.width, height: img.height });
                URL.revokeObjectURL(img.src);
            };
            img.src = URL.createObjectURL(file);
        });
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        addImages(Array.from(e.dataTransfer.files));
    }, []);

    const handleWidthChange = (value: string) => {
        setWidth(value);
        if (maintainAspect && images.length > 0) {
            const ratio = images[0].height / images[0].width;
            setHeight(String(Math.round(parseInt(value || "0") * ratio)));
        }
    };

    const handleHeightChange = (value: string) => {
        setHeight(value);
        if (maintainAspect && images.length > 0) {
            const ratio = images[0].width / images[0].height;
            setWidth(String(Math.round(parseInt(value || "0") * ratio)));
        }
    };

    const resizeImage = async (file: File, newWidth: number, newHeight: number): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = newWidth;
                canvas.height = newHeight;
                const ctx = canvas.getContext("2d");
                if (!ctx) { reject(new Error("No context")); return; }
                ctx.drawImage(img, 0, 0, newWidth, newHeight);
                canvas.toBlob((blob) => {
                    if (blob) resolve(URL.createObjectURL(blob));
                    else reject(new Error("Failed"));
                }, file.type || "image/jpeg", 0.92);
            };
            img.onerror = () => reject(new Error("Failed to load"));
            img.src = URL.createObjectURL(file);
        });
    };

    const handleResize = async () => {
        if (images.length === 0) return;
        setIsProcessing(true);
        setProgress(0);

        const updated = [...images];
        for (let i = 0; i < updated.length; i++) {
            setProgress(Math.round((i / updated.length) * 100));
            try {
                let newWidth: number, newHeight: number;
                if (mode === "percentage") {
                    const scale = parseInt(percentage) / 100;
                    newWidth = Math.round(updated[i].width * scale);
                    newHeight = Math.round(updated[i].height * scale);
                } else {
                    newWidth = parseInt(width) || updated[i].width;
                    newHeight = parseInt(height) || updated[i].height;
                }
                updated[i].resizedUrl = await resizeImage(updated[i].file, newWidth, newHeight);
            } catch (error) {
                console.error(`Failed to resize ${updated[i].name}:`, error);
            }
        }

        setImages(updated);
        setProgress(100);
        setIsProcessing(false);
    };

    const downloadImage = (img: ImageFile) => {
        if (!img.resizedUrl) return;
        const ext = img.file.type.split("/")[1] || "jpg";
        const link = document.createElement("a");
        link.href = img.resizedUrl;
        link.download = img.name.replace(/\.[^.]+$/, "") + `_resized.${ext}`;
        link.click();
    };

    const downloadAll = async () => {
        const zip = new JSZip();
        for (const img of images) {
            if (img.resizedUrl) {
                const response = await fetch(img.resizedUrl);
                const blob = await response.blob();
                const ext = img.file.type.split("/")[1] || "jpg";
                zip.file(img.name.replace(/\.[^.]+$/, "") + `_resized.${ext}`, blob);
            }
        }
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(zipBlob);
        link.download = "resized_images.zip";
        link.click();
    };

    const hasResized = images.some(img => img.resizedUrl);

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/image"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">Resize Images</h1>
            </div>

            {/* Drop Zone */}
            <div
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors mb-4 ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onDrop={handleDrop}
                onClick={() => document.getElementById("img-input")?.click()}
            >
                <input type="file" accept="image/*" multiple onChange={(e) => e.target.files && addImages(Array.from(e.target.files))} className="hidden" id="img-input" />
                <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm"><span className="font-medium">Drop images</span> <span className="text-muted-foreground">or click</span></p>
            </div>

            {/* Image List */}
            {images.length > 0 && (
                <div className="border rounded-xl p-4 mb-4">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-medium">{images.length} image{images.length > 1 ? "s" : ""}</span>
                        <Button variant="ghost" size="sm" onClick={() => setImages([])}>Clear</Button>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                        {images.map((img) => (
                            <div key={img.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm">
                                <ImageIcon className="h-4 w-4 text-blue-500 shrink-0" />
                                <span className="flex-1 truncate">{img.name}</span>
                                <span className="text-xs text-muted-foreground">{img.width}×{img.height}</span>
                                {img.resizedUrl && (
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
                </div>
            )}

            {/* Resize Options */}
            {images.length > 0 && (
                <div className="border rounded-xl p-4 mb-4 space-y-4">
                    {/* Mode Toggle */}
                    <div className="flex bg-muted rounded-lg p-1">
                        <button
                            onClick={() => setMode("dimensions")}
                            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${mode === "dimensions" ? "bg-background shadow-sm" : ""}`}
                        >
                            Dimensions
                        </button>
                        <button
                            onClick={() => setMode("percentage")}
                            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${mode === "percentage" ? "bg-background shadow-sm" : ""}`}
                        >
                            Percentage
                        </button>
                    </div>

                    {mode === "dimensions" ? (
                        <>
                            <div className="flex gap-3 items-end">
                                <div className="flex-1">
                                    <label className="text-xs text-muted-foreground mb-1 block">Width (px)</label>
                                    <Input type="number" value={width} onChange={e => handleWidthChange(e.target.value)} />
                                </div>
                                <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => setMaintainAspect(!maintainAspect)}>
                                    {maintainAspect ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
                                </Button>
                                <div className="flex-1">
                                    <label className="text-xs text-muted-foreground mb-1 block">Height (px)</label>
                                    <Input type="number" value={height} onChange={e => handleHeightChange(e.target.value)} />
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">{maintainAspect ? "Aspect ratio locked" : "Free resize"}</p>
                        </>
                    ) : (
                        <>
                            <div className="w-32">
                                <label className="text-xs text-muted-foreground mb-1 block">Scale (%)</label>
                                <Input type="number" min="1" max="500" value={percentage} onChange={e => setPercentage(e.target.value)} />
                            </div>
                            {images[0] && (
                                <p className="text-xs text-muted-foreground">
                                    {images[0].width}×{images[0].height} → {Math.round(images[0].width * parseInt(percentage || "100") / 100)}×{Math.round(images[0].height * parseInt(percentage || "100") / 100)}
                                </p>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Progress */}
            {isProcessing && <Progress value={progress} className="h-1.5 mb-4" />}

            {/* Actions */}
            {images.length > 0 && (
                <div className="flex gap-2">
                    <Button onClick={handleResize} disabled={isProcessing} className="flex-1">
                        {hasResized ? "Re-resize" : "Resize"}
                    </Button>
                    {hasResized && images.length > 1 && (
                        <Button variant="outline" onClick={downloadAll}>
                            <Download className="h-4 w-4 mr-2" />ZIP
                        </Button>
                    )}
                </div>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">Processed locally</p>
        </div>
    );
}
