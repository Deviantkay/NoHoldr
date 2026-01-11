"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Upload, Image as ImageIcon, Download, Crop, RotateCcw, RotateCw, RefreshCcw, X, Move } from "lucide-react";
import JSZip from "jszip";

interface ImageFile {
    id: string;
    file: File;
    url: string;
}

interface CropBox {
    x: number;
    y: number;
    w: number;
    h: number;
}

const ASPECT_RATIOS = [
    { label: "Free", value: 0 },
    { label: "1:1", value: 1 },
    { label: "4:3", value: 4 / 3 },
    { label: "3:4", value: 3 / 4 },
    { label: "16:9", value: 16 / 9 },
    { label: "9:16", value: 9 / 16 },
    { label: "3:2", value: 3 / 2 },
    { label: "2:3", value: 2 / 3 },
];

const OUTPUT_FORMATS = [
    { label: "JPEG", value: "image/jpeg", ext: "jpg" },
    { label: "PNG", value: "image/png", ext: "png" },
    { label: "WebP", value: "image/webp", ext: "webp" },
];

export default function CropImagePage() {
    const [mode, setMode] = useState<"manual" | "auto">("manual");
    const [file, setFile] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
    const [crop, setCrop] = useState<CropBox>({ x: 0, y: 0, w: 100, h: 100 });
    const [aspectRatio, setAspectRatio] = useState<number>(0);
    const [rotation, setRotation] = useState(0);
    const [outputFormat, setOutputFormat] = useState("image/jpeg");
    const [quality, setQuality] = useState(92);
    const [isDragging, setIsDragging] = useState(false);

    // Drag state
    const [dragging, setDragging] = useState<"move" | "nw" | "ne" | "sw" | "se" | null>(null);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [startCrop, setStartCrop] = useState<CropBox>({ x: 0, y: 0, w: 0, h: 0 });

    // Auto mode
    const [batchImages, setBatchImages] = useState<ImageFile[]>([]);
    const [autoAspectRatio, setAutoAspectRatio] = useState<number>(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    const containerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    const handleFile = useCallback((f: File) => {
        if (!f.type.startsWith("image/")) return;
        setFile(f);
        const url = URL.createObjectURL(f);
        setImageUrl(url);
        setRotation(0);
        setAspectRatio(0);
    }, []);

    useEffect(() => {
        if (!imageUrl) return;
        const img = new Image();
        img.onload = () => {
            setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
            setCrop({ x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight });
        };
        img.src = imageUrl;
    }, [imageUrl]);

    // Get displayed image rect
    const getImageRect = () => {
        if (!imgRef.current) return { left: 0, top: 0, width: 0, height: 0 };
        const rect = imgRef.current.getBoundingClientRect();
        return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (mode === "manual" && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        } else {
            addBatchImages(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/")));
        }
    }, [mode, handleFile]);

    const addBatchImages = (files: File[]) => {
        setBatchImages(prev => [...prev, ...files.map(f => ({
            id: crypto.randomUUID(),
            file: f,
            url: URL.createObjectURL(f),
        }))]);
    };

    const applyAspectRatio = (ratio: number) => {
        setAspectRatio(ratio);
        if (ratio === 0) return; // Free mode - don't change crop

        let newW = naturalSize.w;
        let newH = newW / ratio;
        if (newH > naturalSize.h) {
            newH = naturalSize.h;
            newW = newH * ratio;
        }
        setCrop({
            x: Math.round((naturalSize.w - newW) / 2),
            y: Math.round((naturalSize.h - newH) / 2),
            w: Math.round(newW),
            h: Math.round(newH),
        });
    };

    const rotateLeft = () => setRotation((r) => (r - 90 + 360) % 360);
    const rotateRight = () => setRotation((r) => (r + 90) % 360);
    const resetCrop = () => {
        setCrop({ x: 0, y: 0, w: naturalSize.w, h: naturalSize.h });
        setRotation(0);
        setAspectRatio(0);
    };

    // Mouse/touch handlers
    const handlePointerDown = (e: React.PointerEvent, type: typeof dragging) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(type);
        setStartPos({ x: e.clientX, y: e.clientY });
        setStartCrop({ ...crop });
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!dragging) return;

        const imgRect = getImageRect();
        const scale = naturalSize.w / imgRect.width;

        const dx = (e.clientX - startPos.x) * scale;
        const dy = (e.clientY - startPos.y) * scale;

        let newCrop = { ...startCrop };

        if (dragging === "move") {
            newCrop.x = Math.max(0, Math.min(naturalSize.w - startCrop.w, startCrop.x + dx));
            newCrop.y = Math.max(0, Math.min(naturalSize.h - startCrop.h, startCrop.y + dy));
        } else {
            // Resize from corners
            let newX = newCrop.x;
            let newY = newCrop.y;
            let newW = newCrop.w;
            let newH = newCrop.h;

            if (dragging === "se") {
                newW = Math.max(50, startCrop.w + dx);
                newH = Math.max(50, startCrop.h + dy);
            } else if (dragging === "sw") {
                const deltaW = -dx;
                newW = Math.max(50, startCrop.w + deltaW);
                newX = startCrop.x - deltaW;
                newH = Math.max(50, startCrop.h + dy);
            } else if (dragging === "ne") {
                newW = Math.max(50, startCrop.w + dx);
                const deltaH = -dy;
                newH = Math.max(50, startCrop.h + deltaH);
                newY = startCrop.y - deltaH;
            } else if (dragging === "nw") {
                const deltaW = -dx;
                const deltaH = -dy;
                newW = Math.max(50, startCrop.w + deltaW);
                newH = Math.max(50, startCrop.h + deltaH);
                newX = startCrop.x - deltaW;
                newY = startCrop.y - deltaH;
            }

            // Apply aspect ratio constraint if not free
            if (aspectRatio > 0) {
                if (dragging === "se" || dragging === "ne") {
                    newH = newW / aspectRatio;
                } else {
                    newW = newH * aspectRatio;
                }
                if (dragging === "ne") newY = startCrop.y + startCrop.h - newH;
                if (dragging === "nw") {
                    newX = startCrop.x + startCrop.w - newW;
                    newY = startCrop.y + startCrop.h - newH;
                }
                if (dragging === "sw") newX = startCrop.x + startCrop.w - newW;
            }

            // Clamp to bounds
            if (newX < 0) { newW += newX; newX = 0; }
            if (newY < 0) { newH += newY; newY = 0; }
            if (newX + newW > naturalSize.w) newW = naturalSize.w - newX;
            if (newY + newH > naturalSize.h) newH = naturalSize.h - newY;

            newCrop = { x: Math.round(newX), y: Math.round(newY), w: Math.round(newW), h: Math.round(newH) };
        }

        setCrop(newCrop);
    };

    const handlePointerUp = () => {
        setDragging(null);
    };

    const downloadCropped = () => {
        if (!imageUrl || !file) return;

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            canvas.width = crop.w;
            canvas.height = crop.h;
            ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h);

            const ext = OUTPUT_FORMATS.find(f => f.value === outputFormat)?.ext || "jpg";
            canvas.toBlob((blob) => {
                if (!blob) return;
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = file.name.replace(/\.[^.]+$/, `_cropped.${ext}`);
                a.click();
            }, outputFormat, quality / 100);
        };
        img.src = imageUrl;
    };

    const autoCropBatch = async () => {
        if (batchImages.length === 0) return;
        setIsProcessing(true);
        setProgress(0);

        const zip = new JSZip();

        for (let i = 0; i < batchImages.length; i++) {
            setProgress(Math.round((i / batchImages.length) * 100));
            const imgFile = batchImages[i];

            const image = new Image();
            await new Promise<void>((resolve) => {
                image.onload = () => resolve();
                image.src = imgFile.url;
            });

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) continue;

            const srcW = image.width;
            const srcH = image.height;
            let cW: number, cH: number, cX: number, cY: number;

            if (srcW / srcH > autoAspectRatio) {
                cH = srcH;
                cW = srcH * autoAspectRatio;
                cX = (srcW - cW) / 2;
                cY = 0;
            } else {
                cW = srcW;
                cH = srcW / autoAspectRatio;
                cX = 0;
                cY = (srcH - cH) / 2;
            }

            canvas.width = cW;
            canvas.height = cH;
            ctx.drawImage(image, cX, cY, cW, cH, 0, 0, cW, cH);

            const blob = await new Promise<Blob>((resolve) =>
                canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.92)
            );
            zip.file(imgFile.file.name.replace(/\.[^.]+$/, "_cropped.jpg"), blob);
        }

        setProgress(100);
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(zipBlob);
        a.download = "cropped_images.zip";
        a.click();

        setIsProcessing(false);
    };

    // Calculate display crop box (percentage based)
    const cropStyle = naturalSize.w > 0 ? {
        left: `${(crop.x / naturalSize.w) * 100}%`,
        top: `${(crop.y / naturalSize.h) * 100}%`,
        width: `${(crop.w / naturalSize.w) * 100}%`,
        height: `${(crop.h / naturalSize.h) * 100}%`,
    } : {};

    return (
        <div className="max-w-3xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/image"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">Crop Image</h1>
            </div>

            {/* Mode Toggle */}
            <div className="flex bg-muted rounded-lg p-1 mb-4">
                <button
                    onClick={() => setMode("manual")}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${mode === "manual" ? "bg-background shadow-sm" : ""}`}
                >
                    <Crop className="h-4 w-4 inline mr-2" />Manual Crop
                </button>
                <button
                    onClick={() => setMode("auto")}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${mode === "auto" ? "bg-background shadow-sm" : ""}`}
                >
                    <ImageIcon className="h-4 w-4 inline mr-2" />Auto Batch
                </button>
            </div>

            {mode === "manual" ? (
                <>
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
                                    <Button variant="ghost" size="sm" onClick={() => { setFile(null); setImageUrl(null); }}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>

                                {/* Interactive Crop Area */}
                                <div
                                    ref={containerRef}
                                    className="relative bg-black rounded-lg overflow-hidden select-none touch-none"
                                    onPointerMove={handlePointerMove}
                                    onPointerUp={handlePointerUp}
                                    onPointerLeave={handlePointerUp}
                                >
                                    <img
                                        ref={imgRef}
                                        src={imageUrl || ""}
                                        alt="Preview"
                                        className="w-full h-auto max-h-96 object-contain"
                                        style={{ transform: `rotate(${rotation}deg)` }}
                                        draggable={false}
                                    />

                                    {/* Dark overlay with crop hole */}
                                    {naturalSize.w > 0 && (
                                        <div className="absolute inset-0">
                                            {/* Full dark overlay */}
                                            <div className="absolute inset-0 bg-black/50" />

                                            {/* Clear crop area (punch through) */}
                                            <div
                                                className="absolute bg-transparent border-2 border-white shadow-lg cursor-move"
                                                style={{
                                                    ...cropStyle,
                                                    boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
                                                }}
                                                onPointerDown={(e) => handlePointerDown(e, "move")}
                                            >
                                                {/* Grid lines */}
                                                <div className="absolute inset-0 pointer-events-none">
                                                    <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/30" />
                                                    <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/30" />
                                                    <div className="absolute top-1/3 left-0 right-0 h-px bg-white/30" />
                                                    <div className="absolute top-2/3 left-0 right-0 h-px bg-white/30" />
                                                </div>

                                                {/* Move indicator */}
                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                    <Move className="h-5 w-5 text-white/60 drop-shadow" />
                                                </div>

                                                {/* Resize handles - all 4 corners */}
                                                <div
                                                    className="absolute -left-2 -top-2 w-4 h-4 bg-white rounded-sm cursor-nw-resize shadow-md"
                                                    onPointerDown={(e) => handlePointerDown(e, "nw")}
                                                />
                                                <div
                                                    className="absolute -right-2 -top-2 w-4 h-4 bg-white rounded-sm cursor-ne-resize shadow-md"
                                                    onPointerDown={(e) => handlePointerDown(e, "ne")}
                                                />
                                                <div
                                                    className="absolute -left-2 -bottom-2 w-4 h-4 bg-white rounded-sm cursor-sw-resize shadow-md"
                                                    onPointerDown={(e) => handlePointerDown(e, "sw")}
                                                />
                                                <div
                                                    className="absolute -right-2 -bottom-2 w-4 h-4 bg-white rounded-sm cursor-se-resize shadow-md"
                                                    onPointerDown={(e) => handlePointerDown(e, "se")}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Crop info */}
                                <div className="mt-3 text-xs text-muted-foreground text-center">
                                    Crop: {crop.w} × {crop.h} px {aspectRatio === 0 && "(Free)"}
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="border rounded-xl p-4 mb-4 space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    <Button variant="outline" size="sm" onClick={rotateLeft}><RotateCcw className="h-4 w-4" /></Button>
                                    <Button variant="outline" size="sm" onClick={rotateRight}><RotateCw className="h-4 w-4" /></Button>
                                    <Button variant="outline" size="sm" onClick={resetCrop}><RefreshCcw className="h-4 w-4 mr-1" />Reset</Button>
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-2 block">Aspect Ratio</label>
                                    <div className="flex flex-wrap gap-2">
                                        {ASPECT_RATIOS.map((r) => (
                                            <Button
                                                key={r.label}
                                                variant={aspectRatio === r.value ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => applyAspectRatio(r.value)}
                                            >
                                                {r.label}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Format</label>
                                        <select
                                            value={outputFormat}
                                            onChange={(e) => setOutputFormat(e.target.value)}
                                            className="w-full p-2 border rounded-lg text-sm"
                                        >
                                            {OUTPUT_FORMATS.map((f) => (
                                                <option key={f.value} value={f.value}>{f.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {outputFormat === "image/jpeg" && (
                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Quality: {quality}%</label>
                                            <input
                                                type="range"
                                                value={quality}
                                                onChange={(e) => setQuality(parseInt(e.target.value))}
                                                min={10}
                                                max={100}
                                                className="w-full"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Button onClick={downloadCropped} className="w-full h-11">
                                <Download className="h-4 w-4 mr-2" />Crop & Download
                            </Button>
                        </>
                    )}
                </>
            ) : (
                <>
                    <div
                        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors mb-4 ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"}`}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById("batch-input")?.click()}
                    >
                        <input type="file" accept="image/*" multiple onChange={(e) => e.target.files && addBatchImages(Array.from(e.target.files))} className="hidden" id="batch-input" />
                        <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm"><span className="font-medium">Drop images</span> <span className="text-muted-foreground">for batch crop</span></p>
                    </div>

                    {batchImages.length > 0 && (
                        <div className="border rounded-xl p-4 mb-4">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-sm font-medium">{batchImages.length} images</span>
                                <Button variant="ghost" size="sm" onClick={() => setBatchImages([])}>Clear</Button>
                            </div>
                            <div className="grid grid-cols-6 gap-2 max-h-24 overflow-y-auto">
                                {batchImages.map(img => (
                                    <img key={img.id} src={img.url} alt="" className="w-full h-12 object-cover rounded-lg" />
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="border rounded-xl p-4 mb-4">
                        <label className="text-sm font-medium mb-2 block">Crop Aspect Ratio (from center)</label>
                        <div className="flex flex-wrap gap-2">
                            {ASPECT_RATIOS.slice(1).map((r) => (
                                <Button
                                    key={r.label}
                                    variant={autoAspectRatio === r.value ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setAutoAspectRatio(r.value)}
                                >
                                    {r.label}
                                </Button>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">All images will be cropped from center to match the ratio</p>
                    </div>

                    {isProcessing && <Progress value={progress} className="h-1.5 mb-4" />}

                    <Button onClick={autoCropBatch} disabled={isProcessing || batchImages.length === 0} className="w-full h-11">
                        <Download className="h-4 w-4 mr-2" />{isProcessing ? "Processing..." : "Batch Crop & Download ZIP"}
                    </Button>
                </>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">Drag box to move • Drag corners to resize</p>
        </div>
    );
}
