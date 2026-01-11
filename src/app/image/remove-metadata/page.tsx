"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, Image as ImageIcon, Download, Trash2 } from "lucide-react";

export default function RemoveMetadataPage() {
    const [file, setFile] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [cleanUrl, setCleanUrl] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFile = useCallback((f: File) => {
        if (!f.type.startsWith("image/")) return;
        setFile(f);
        setImageUrl(URL.createObjectURL(f));
        setCleanUrl(null);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    }, [handleFile]);

    const removeMetadata = () => {
        if (!imageUrl) return;
        setIsProcessing(true);

        const img = new Image();
        img.onload = () => {
            // Draw to canvas to strip metadata
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            ctx.drawImage(img, 0, 0);

            // Convert to blob without metadata
            canvas.toBlob((blob) => {
                if (blob) {
                    setCleanUrl(URL.createObjectURL(blob));
                }
                setIsProcessing(false);
            }, "image/png");
        };
        img.src = imageUrl;
    };

    const download = () => {
        if (!cleanUrl || !file) return;
        const a = document.createElement("a");
        a.href = cleanUrl;
        a.download = file.name.replace(/\.[^.]+$/, "") + "_clean.png";
        a.click();
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/image"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">Remove EXIF Data</h1>
            </div>

            {!file ? (
                <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById("img-input")?.click()}
                >
                    <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" id="img-input" />
                    <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm"><span className="font-medium">Drop image</span> <span className="text-muted-foreground">or tap</span></p>
                </div>
            ) : (
                <>
                    <div className="border rounded-xl p-4 mb-4">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-medium">{file.name}</span>
                            <Button variant="ghost" size="sm" onClick={() => { setFile(null); setCleanUrl(null); }}>Change</Button>
                        </div>
                        <img src={cleanUrl || imageUrl || ""} alt="Preview" className="w-full rounded-lg max-h-48 object-contain" />
                    </div>

                    {cleanUrl ? (
                        <div className="space-y-2">
                            <div className="p-4 rounded-xl border bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                                <p className="text-sm text-green-700 dark:text-green-300">✓ Metadata removed. Image re-encoded as PNG.</p>
                            </div>
                            <Button onClick={download} className="w-full h-11">
                                <Download className="h-4 w-4 mr-2" />Download Clean Image
                            </Button>
                        </div>
                    ) : (
                        <Button onClick={removeMetadata} disabled={isProcessing} className="w-full h-11">
                            <Trash2 className="h-4 w-4 mr-2" />{isProcessing ? "Processing..." : "Remove Metadata"}
                        </Button>
                    )}
                </>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">Processed locally • Re-encodes image to strip all metadata</p>
        </div>
    );
}
