"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, Download, Image as ImageIcon, RotateCw, RotateCcw, FlipHorizontal, FlipVertical } from "lucide-react";

export default function RotateImagePage() {
    const [file, setFile] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [rotation, setRotation] = useState(0);
    const [flipH, setFlipH] = useState(false);
    const [flipV, setFlipV] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleFile = useCallback((f: File) => {
        if (!f.type.startsWith("image/")) return;
        setFile(f);
        setImageUrl(URL.createObjectURL(f));
        setRotation(0);
        setFlipH(false);
        setFlipV(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    }, [handleFile]);

    const download = () => {
        if (!imageUrl || !file) return;

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            const isRotated = rotation === 90 || rotation === 270;
            canvas.width = isRotated ? img.height : img.width;
            canvas.height = isRotated ? img.width : img.height;

            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
            ctx.drawImage(img, -img.width / 2, -img.height / 2);

            canvas.toBlob((blob) => {
                if (!blob) return;
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = file.name.replace(/\.[^.]+$/, "") + "_rotated.png";
                a.click();
            }, "image/png");
        };
        img.src = imageUrl;
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/image"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">Rotate Image</h1>
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
                            <Button variant="ghost" size="sm" onClick={() => setFile(null)}>Change</Button>
                        </div>
                        <div className="flex justify-center mb-4">
                            <img
                                src={imageUrl || ""}
                                alt="Preview"
                                style={{
                                    transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                                    maxHeight: "200px",
                                    transition: "transform 0.2s",
                                }}
                            />
                        </div>
                        <div className="flex justify-center gap-2">
                            <Button variant="outline" size="icon" onClick={() => setRotation((r) => (r - 90 + 360) % 360)}>
                                <RotateCcw className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => setRotation((r) => (r + 90) % 360)}>
                                <RotateCw className="h-4 w-4" />
                            </Button>
                            <Button variant={flipH ? "default" : "outline"} size="icon" onClick={() => setFlipH(!flipH)}>
                                <FlipHorizontal className="h-4 w-4" />
                            </Button>
                            <Button variant={flipV ? "default" : "outline"} size="icon" onClick={() => setFlipV(!flipV)}>
                                <FlipVertical className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <Button onClick={download} className="w-full h-11">
                        <Download className="h-4 w-4 mr-2" />Download
                    </Button>
                </>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">Processed locally</p>
        </div>
    );
}
