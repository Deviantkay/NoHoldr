"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Upload, Image as ImageIcon, Download, X, FileText } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { downloadPdfBytes } from "@/lib/pdf-utils";

interface ImageFile {
    id: string;
    file: File;
    url: string;
}

export default function ImagesToPDFPage() {
    const [images, setImages] = useState<ImageFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

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
            url: URL.createObjectURL(f),
        }))]);
    };

    const removeImage = (id: string) => setImages(images.filter(img => img.id !== id));

    const convert = async () => {
        if (images.length === 0) return;
        setIsProcessing(true);
        setProgress(10);

        const pdf = await PDFDocument.create();

        for (let i = 0; i < images.length; i++) {
            setProgress(10 + Math.round((i / images.length) * 80));
            const img = images[i];
            const bytes = await img.file.arrayBuffer();

            let image;
            if (img.file.type === "image/png") {
                image = await pdf.embedPng(bytes);
            } else {
                image = await pdf.embedJpg(bytes);
            }

            const page = pdf.addPage([image.width, image.height]);
            page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
        }

        setProgress(95);
        const bytes = await pdf.save();
        downloadPdfBytes(bytes, "images_combined.pdf");

        setProgress(100);
        setTimeout(() => { setIsProcessing(false); setProgress(0); }, 1000);
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/pdf"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">Images to PDF</h1>
            </div>

            <div
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors mb-4 ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onDrop={handleDrop}
                onClick={() => document.getElementById("img-input")?.click()}
            >
                <input type="file" accept="image/png,image/jpeg" multiple onChange={handleFileSelect} className="hidden" id="img-input" />
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm"><span className="font-medium">Drop images</span> <span className="text-muted-foreground">or tap</span></p>
            </div>

            {images.length > 0 && (
                <>
                    <div className="border rounded-xl p-4 mb-4">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-sm font-medium">{images.length} images</span>
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setImages([])}>Clear</Button>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {images.map(img => (
                                <div key={img.id} className="relative group">
                                    <img src={img.url} alt="" className="w-full h-16 object-cover rounded-lg" />
                                    <button
                                        onClick={() => removeImage(img.id)}
                                        className="absolute top-1 right-1 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="h-3 w-3 text-white" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {isProcessing && <Progress value={progress} className="h-1.5 mb-4" />}

                    <Button onClick={convert} disabled={isProcessing} className="w-full h-11">
                        <FileText className="h-4 w-4 mr-2" />{isProcessing ? "Creating PDF..." : "Create PDF & Download"}
                    </Button>
                </>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">Processed locally • Supports JPG & PNG</p>
        </div>
    );
}
