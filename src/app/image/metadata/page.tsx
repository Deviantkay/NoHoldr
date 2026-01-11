"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, Image as ImageIcon, Eye } from "lucide-react";

interface ImageMetadata {
    width: number;
    height: number;
    type: string;
    size: number;
    name: string;
}

export default function ImageMetadataPage() {
    const [file, setFile] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [metadata, setMetadata] = useState<ImageMetadata | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFile = useCallback((f: File) => {
        if (!f.type.startsWith("image/")) return;
        setFile(f);
        const url = URL.createObjectURL(f);
        setImageUrl(url);

        const img = new Image();
        img.onload = () => {
            setMetadata({
                width: img.width,
                height: img.height,
                type: f.type,
                size: f.size,
                name: f.name,
            });
        };
        img.src = url;
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    }, [handleFile]);

    const fmt = (b: number) => b < 1024 ? b + " B" : b < 1048576 ? (b / 1024).toFixed(1) + " KB" : (b / 1048576).toFixed(2) + " MB";

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/image"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">View Image Metadata</h1>
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
            ) : metadata && (
                <>
                    <div className="border rounded-xl p-4 mb-4">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-medium">{file.name}</span>
                            <Button variant="ghost" size="sm" onClick={() => { setFile(null); setMetadata(null); }}>Change</Button>
                        </div>
                        <img src={imageUrl || ""} alt="Preview" className="w-full rounded-lg max-h-48 object-contain mb-4" />

                        <div className="space-y-2 text-sm">
                            <div className="grid grid-cols-3 gap-2 p-2 rounded bg-muted/30">
                                <span className="text-muted-foreground">Dimensions</span>
                                <span className="col-span-2 font-medium">{metadata.width} × {metadata.height} px</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 p-2 rounded bg-muted/30">
                                <span className="text-muted-foreground">File Size</span>
                                <span className="col-span-2 font-medium">{fmt(metadata.size)}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 p-2 rounded bg-muted/30">
                                <span className="text-muted-foreground">Type</span>
                                <span className="col-span-2 font-medium">{metadata.type}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 p-2 rounded bg-muted/30">
                                <span className="text-muted-foreground">Aspect Ratio</span>
                                <span className="col-span-2 font-medium">{(metadata.width / metadata.height).toFixed(2)}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 p-2 rounded bg-muted/30">
                                <span className="text-muted-foreground">Megapixels</span>
                                <span className="col-span-2 font-medium">{((metadata.width * metadata.height) / 1000000).toFixed(2)} MP</span>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">Processed locally</p>
        </div>
    );
}
