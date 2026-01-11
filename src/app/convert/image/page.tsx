"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Upload, Image as ImageIcon, Download, X } from "lucide-react";
import JSZip from "jszip";

interface ImageFile {
    id: string;
    file: File;
    name: string;
    convertedUrl?: string;
}

const OUTPUT_FORMATS = [
    { label: "JPEG", value: "image/jpeg", ext: "jpg" },
    { label: "PNG", value: "image/png", ext: "png" },
    { label: "WebP", value: "image/webp", ext: "webp" },
];

export default function ImageConverterPage() {
    const [images, setImages] = useState<ImageFile[]>([]);
    const [outputFormat, setOutputFormat] = useState("image/jpeg");
    const [quality, setQuality] = useState(92);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    const addImages = (files: File[]) => {
        setImages(prev => [...prev, ...files.filter(f => f.type.startsWith("image/")).map(f => ({
            id: crypto.randomUUID(),
            file: f,
            name: f.name,
        }))]);
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        addImages(Array.from(e.dataTransfer.files));
    }, []);

    const convertImages = async () => {
        setIsProcessing(true);
        setProgress(0);

        const updated = [...images];
        for (let i = 0; i < updated.length; i++) {
            setProgress(Math.round((i / updated.length) * 100));

            const img = new Image();
            await new Promise<void>((resolve) => {
                img.onload = () => resolve();
                img.src = URL.createObjectURL(updated[i].file);
            });

            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            if (!ctx) continue;
            ctx.drawImage(img, 0, 0);

            const blob = await new Promise<Blob>((resolve) =>
                canvas.toBlob((b) => resolve(b!), outputFormat, quality / 100)
            );
            updated[i].convertedUrl = URL.createObjectURL(blob);
        }

        setImages(updated);
        setProgress(100);
        setIsProcessing(false);
    };

    const downloadAll = async () => {
        const zip = new JSZip();
        const ext = OUTPUT_FORMATS.find(f => f.value === outputFormat)?.ext || "jpg";

        for (const img of images) {
            if (img.convertedUrl) {
                const response = await fetch(img.convertedUrl);
                const blob = await response.blob();
                zip.file(img.name.replace(/\.[^.]+$/, `.${ext}`), blob);
            }
        }

        const zipBlob = await zip.generateAsync({ type: "blob" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(zipBlob);
        a.download = "converted_images.zip";
        a.click();
    };

    const hasConverted = images.some(img => img.convertedUrl);

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/convert"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <div>
                    <h1 className="text-lg font-semibold">Image Converter</h1>
                    <p className="text-xs text-muted-foreground">PNG, JPEG, WebP</p>
                </div>
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
                <ImageIcon className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm"><span className="font-medium">Drop images</span> <span className="text-muted-foreground">or click</span></p>
            </div>

            {/* Image List */}
            {images.length > 0 && (
                <>
                    <div className="border rounded-xl p-4 mb-4">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-sm font-medium">{images.length} image{images.length > 1 ? "s" : ""}</span>
                            <Button variant="ghost" size="sm" onClick={() => setImages([])}>Clear</Button>
                        </div>
                        <div className="grid grid-cols-6 gap-2 max-h-24 overflow-y-auto">
                            {images.map(img => (
                                <div key={img.id} className="relative group">
                                    <img src={URL.createObjectURL(img.file)} alt="" className="w-full h-10 object-cover rounded" />
                                    <button
                                        onClick={() => setImages(prev => prev.filter(i => i.id !== img.id))}
                                        className="absolute -top-1 -right-1 p-0.5 bg-black/60 rounded-full opacity-0 group-hover:opacity-100"
                                    >
                                        <X className="h-3 w-3 text-white" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Options */}
                    <div className="border rounded-xl p-4 mb-4 space-y-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Output Format</label>
                            <div className="flex gap-2">
                                {OUTPUT_FORMATS.map(f => (
                                    <Button
                                        key={f.value}
                                        variant={outputFormat === f.value ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setOutputFormat(f.value)}
                                    >
                                        {f.label}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        {outputFormat === "image/jpeg" && (
                            <div>
                                <label className="text-sm font-medium mb-2 block">Quality: {quality}%</label>
                                <input type="range" value={quality} onChange={(e) => setQuality(parseInt(e.target.value))} min={10} max={100} className="w-full" />
                            </div>
                        )}
                    </div>

                    {isProcessing && <Progress value={progress} className="h-1.5 mb-4" />}

                    <div className="flex gap-2">
                        <Button onClick={convertImages} disabled={isProcessing} className="flex-1">
                            Convert
                        </Button>
                        {hasConverted && (
                            <Button variant="outline" onClick={downloadAll}>
                                <Download className="h-4 w-4 mr-2" />Download ZIP
                            </Button>
                        )}
                    </div>
                </>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">Processed locally</p>
        </div>
    );
}
