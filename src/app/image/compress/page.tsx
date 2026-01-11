"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Upload, Image as ImageIcon, Download, X } from "lucide-react";

interface ImageFile {
    id: string;
    file: File;
    name: string;
    originalSize: number;
    compressedSize?: number;
    compressedUrl?: string;
}

export default function CompressImagePage() {
    const [images, setImages] = useState<ImageFile[]>([]);
    const [quality, setQuality] = useState([80]);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
    const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        addImages(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/")));
    }, []);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) addImages(Array.from(e.target.files).filter(f => f.type.startsWith("image/")));
    }, []);

    const addImages = (files: File[]) => {
        setImages(prev => [...prev, ...files.map(f => ({
            id: crypto.randomUUID(),
            file: f,
            name: f.name,
            originalSize: f.size,
        }))]);
    };

    const compress = async (file: File, q: number): Promise<{ blob: Blob; url: string }> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                if (!ctx) { reject(new Error("No ctx")); return; }
                ctx.drawImage(img, 0, 0);
                canvas.toBlob(blob => blob ? resolve({ blob, url: URL.createObjectURL(blob) }) : reject(new Error("Failed")), "image/jpeg", q / 100);
            };
            img.onerror = () => reject(new Error("Load failed"));
            img.src = URL.createObjectURL(file);
        });
    };

    const handleCompress = async () => {
        if (images.length === 0) return;
        setIsProcessing(true);
        setProgress(0);

        const updated = [...images];
        for (let i = 0; i < updated.length; i++) {
            setProgress(Math.round((i / updated.length) * 100));
            try {
                if (updated[i].compressedUrl) URL.revokeObjectURL(updated[i].compressedUrl!);
                const result = await compress(updated[i].file, quality[0]);
                updated[i].compressedSize = result.blob.size;
                updated[i].compressedUrl = result.url;
            } catch { /* ignore */ }
        }
        setImages(updated);
        setProgress(100);
        setIsProcessing(false);
    };

    const download = (img: ImageFile) => {
        if (!img.compressedUrl) return;
        const a = document.createElement("a");
        a.href = img.compressedUrl;
        a.download = img.name.replace(/\.[^.]+$/, "") + "_compressed.jpg";
        a.click();
    };

    const downloadAll = async () => {
        const JSZip = (await import("jszip")).default;
        const zip = new JSZip();
        for (const img of images) {
            if (img.compressedUrl) {
                const res = await fetch(img.compressedUrl);
                zip.file(img.name.replace(/\.[^.]+$/, "") + "_compressed.jpg", await res.blob());
            }
        }
        const blob = await zip.generateAsync({ type: "blob" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "compressed.zip";
        a.click();
    };

    const fmt = (b: number) => b < 1024 ? b + " B" : b < 1048576 ? (b / 1024).toFixed(1) + " KB" : (b / 1048576).toFixed(2) + " MB";
    const hasCompressed = images.some(img => img.compressedUrl);
    const totalOrig = images.reduce((a, i) => a + i.originalSize, 0);
    const totalComp = images.reduce((a, i) => a + (i.compressedSize || i.originalSize), 0);

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/image"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">Compress Images</h1>
            </div>

            {/* Drop Zone */}
            <div
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors mb-4 ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById("img-input")?.click()}
            >
                <input type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" id="img-input" />
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm"><span className="font-medium">Drop images</span> <span className="text-muted-foreground">or tap</span></p>
            </div>

            {/* Quality Slider */}
            {images.length > 0 && (
                <div className="border rounded-xl p-4 mb-4">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium">Quality</span>
                        <span>{quality[0]}%</span>
                    </div>
                    <Slider value={quality} onValueChange={setQuality} min={10} max={100} step={5} />
                </div>
            )}

            {/* File List */}
            {images.length > 0 && (
                <div className="border rounded-xl p-4 mb-4">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-medium">{images.length} images</span>
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setImages([])}>Clear</Button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {images.map(img => (
                            <div key={img.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm">
                                <ImageIcon className="h-4 w-4 text-blue-500 shrink-0" />
                                <span className="flex-1 truncate">{img.name}</span>
                                <span className="text-xs text-muted-foreground">
                                    {fmt(img.originalSize)}
                                    {img.compressedSize && <span className="text-green-600"> → {fmt(img.compressedSize)}</span>}
                                </span>
                                {img.compressedUrl && <button onClick={() => download(img)} className="p-1 rounded hover:bg-muted"><Download className="h-3 w-3" /></button>}
                                <button onClick={() => setImages(images.filter(x => x.id !== img.id))} className="p-1 rounded hover:bg-muted"><X className="h-3 w-3" /></button>
                            </div>
                        ))}
                    </div>
                    {hasCompressed && (
                        <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                            Total: {fmt(totalOrig)} → {fmt(totalComp)} ({Math.round((1 - totalComp / totalOrig) * 100)}% saved)
                        </div>
                    )}
                </div>
            )}

            {/* Progress */}
            {isProcessing && (
                <div className="border rounded-xl p-4 mb-4">
                    <Progress value={progress} className="h-1.5" />
                </div>
            )}

            {/* Actions */}
            {images.length > 0 && (
                <div className="flex gap-2">
                    {hasCompressed && images.length > 1 && (
                        <Button variant="outline" onClick={downloadAll} className="flex-1 h-11">Download ZIP</Button>
                    )}
                    <Button onClick={handleCompress} disabled={isProcessing} className="flex-1 h-11">
                        {hasCompressed ? "Re-compress" : "Compress"}
                    </Button>
                </div>
            )}

            <p className="text-xs text-muted-foreground text-center mt-4">Processed locally • Never uploaded</p>
        </div>
    );
}
