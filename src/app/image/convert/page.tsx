"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Upload, Image as ImageIcon, Download, X, ArrowRight, Settings } from "lucide-react";

interface ImageFile {
    id: string;
    file: File;
    name: string;
    preview?: string;
    convertedUrl?: string;
    convertedName?: string;
    convertedSize?: number;
    error?: string;
}

const formats = [
    { value: "image/jpeg", label: "JPEG", ext: "jpg", desc: "Best for photos" },
    { value: "image/png", label: "PNG", ext: "png", desc: "Lossless, transparency" },
    { value: "image/webp", label: "WebP", ext: "webp", desc: "Modern, small size" },
    { value: "image/avif", label: "AVIF", ext: "avif", desc: "Next-gen, tiny size" },
    { value: "image/bmp", label: "BMP", ext: "bmp", desc: "Uncompressed bitmap" },
    { value: "image/gif", label: "GIF", ext: "gif", desc: "Simple animation" },
    { value: "image/svg+xml", label: "SVG (trace)", ext: "svg", desc: "Vector trace" },
    { value: "image/x-icon", label: "ICO", ext: "ico", desc: "Favicon icon" },
];

// Browser can natively read these via <img> tag
const SUPPORTED_INPUT = "image/jpeg,image/png,image/webp,image/avif,image/bmp,image/gif,image/tiff,image/svg+xml,image/x-icon,.heic,.heif";

function formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
}

export default function ConvertImagePage() {
    const [images, setImages] = useState<ImageFile[]>([]);
    const [targetFormat, setTargetFormat] = useState("image/webp");
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    // Quality settings
    const [quality, setQuality] = useState(92);
    const [resizeEnabled, setResizeEnabled] = useState(false);
    const [maxWidth, setMaxWidth] = useState(1920);
    const [icoSize, setIcoSize] = useState(64);

    const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
    const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        addImages(Array.from(e.dataTransfer.files));
    }, []);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) addImages(Array.from(e.target.files));
    }, []);

    const addImages = (files: File[]) => {
        const filtered = files.filter(f => f.type.startsWith("image/") || /\.(heic|heif|bmp|tiff?)$/i.test(f.name));
        const newImages: ImageFile[] = filtered.map(file => {
            const img: ImageFile = { id: Math.random().toString(36).substr(2, 9), file, name: file.name };
            // Create preview for standard formats
            if (file.type.startsWith("image/")) {
                img.preview = URL.createObjectURL(file);
            }
            return img;
        });
        setImages(prev => [...prev, ...newImages]);
    };

    const loadImageElement = (file: File): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
            const img = new window.Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error("Failed to decode " + file.name));
            img.src = URL.createObjectURL(file);
        });
    };

    const convertImage = async (file: File, format: string): Promise<{ url: string; name: string; size: number }> => {
        const img = await loadImageElement(file);

        let w = img.width;
        let h = img.height;

        // ICO: force to standard size
        if (format === "image/x-icon") {
            w = icoSize;
            h = icoSize;
        } else if (resizeEnabled && w > maxWidth) {
            const ratio = maxWidth / w;
            w = maxWidth;
            h = Math.round(h * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;

        // White background for JPEG/BMP (no transparency)
        if (format === "image/jpeg" || format === "image/bmp") {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, w, h);
        }

        ctx.drawImage(img, 0, 0, w, h);

        // SVG trace: create an embedded SVG
        if (format === "image/svg+xml") {
            const dataUrl = canvas.toDataURL("image/png");
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><image href="${dataUrl}" width="${w}" height="${h}"/></svg>`;
            const blob = new Blob([svg], { type: "image/svg+xml" });
            const ext = "svg";
            const newName = file.name.replace(/\.[^.]+$/, "") + "." + ext;
            return { url: URL.createObjectURL(blob), name: newName, size: blob.size };
        }

        // ICO format: create ICO binary
        if (format === "image/x-icon") {
            const icoBlob = await createIcoBlob(canvas);
            const newName = file.name.replace(/\.[^.]+$/, "") + ".ico";
            return { url: URL.createObjectURL(icoBlob), name: newName, size: icoBlob.size };
        }

        // Standard canvas formats
        return new Promise((resolve, reject) => {
            const q = (format === "image/png" || format === "image/gif") ? undefined : quality / 100;
            canvas.toBlob((blob) => {
                if (blob) {
                    const ext = formats.find(f => f.value === format)?.ext || "jpg";
                    const newName = file.name.replace(/\.[^.]+$/, "") + "." + ext;
                    resolve({ url: URL.createObjectURL(blob), name: newName, size: blob.size });
                } else {
                    reject(new Error("Conversion failed — format may not be supported by your browser"));
                }
            }, format, q);
        });
    };

    // Create ICO file from canvas
    const createIcoBlob = async (canvas: HTMLCanvasElement): Promise<Blob> => {
        const pngBlob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/png"));
        const pngData = new Uint8Array(await pngBlob.arrayBuffer());
        const s = canvas.width;

        // ICO header (6 bytes) + 1 entry (16 bytes) + PNG data
        const header = new ArrayBuffer(6 + 16);
        const hv = new DataView(header);
        hv.setUint16(0, 0, true); // reserved
        hv.setUint16(2, 1, true); // type: icon
        hv.setUint16(4, 1, true); // count
        // Entry
        hv.setUint8(6, s >= 256 ? 0 : s);      // width
        hv.setUint8(7, s >= 256 ? 0 : s);      // height
        hv.setUint8(8, 0);                       // palette
        hv.setUint8(9, 0);                       // reserved
        hv.setUint16(10, 1, true);               // color planes
        hv.setUint16(12, 32, true);              // bits per pixel
        hv.setUint32(14, pngData.length, true);  // image size
        hv.setUint32(18, 22, true);              // offset

        return new Blob([header, pngData], { type: "image/x-icon" });
    };

    const handleConvert = async () => {
        if (images.length === 0) return;
        setIsProcessing(true);
        setProgress(0);

        const updated = [...images];
        for (let i = 0; i < updated.length; i++) {
            setProgress(Math.round(((i + 0.5) / updated.length) * 100));
            try {
                if (updated[i].convertedUrl) URL.revokeObjectURL(updated[i].convertedUrl!);
                const result = await convertImage(updated[i].file, targetFormat);
                updated[i].convertedUrl = result.url;
                updated[i].convertedName = result.name;
                updated[i].convertedSize = result.size;
                updated[i].error = undefined;
            } catch (error) {
                updated[i].error = (error as Error).message;
            }
        }
        setImages([...updated]);
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
    const needsQuality = !["image/png", "image/gif", "image/svg+xml", "image/bmp", "image/x-icon"].includes(targetFormat);

    return (
        <div className="max-w-3xl mx-auto px-4 py-6">
            <div className="flex items-center gap-4 mb-6 border-b pb-4">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/image"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <div>
                    <h1 className="text-xl font-semibold">Convert Images</h1>
                    <p className="text-sm text-muted-foreground">JPEG • PNG • WebP • AVIF • BMP • GIF • SVG • ICO</p>
                </div>
            </div>

            {/* Upload */}
            <Card className="mb-4">
                <CardContent className="p-0">
                    <div
                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"}`}
                        onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                        onClick={() => document.getElementById("image-upload")?.click()}
                    >
                        <input type="file" accept={SUPPORTED_INPUT} multiple onChange={handleFileSelect} className="hidden" id="image-upload" />
                        <div className="flex flex-col items-center gap-2">
                            <Upload className="h-6 w-6 text-muted-foreground" />
                            <span className="text-sm"><span className="font-medium">Drop images</span> or click</span>
                            <span className="text-xs text-muted-foreground">PNG, JPG, WebP, AVIF, BMP, GIF, TIFF, SVG, ICO</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {images.length > 0 && (
                <>
                    {/* Format + Settings */}
                    <Card className="mb-4">
                        <CardContent className="p-4 space-y-4">
                            <div className="flex items-end gap-3">
                                <div className="flex-1">
                                    <Label className="text-sm mb-2 block">Convert to</Label>
                                    <Select value={targetFormat} onValueChange={setTargetFormat}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {formats.map(f => (
                                                <SelectItem key={f.value} value={f.value}>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{f.label}</span>
                                                        <span className="text-xs text-muted-foreground">{f.desc}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Quality slider */}
                            {needsQuality && (
                                <div>
                                    <label className="text-xs text-muted-foreground">Quality: {quality}%</label>
                                    <input type="range" min={10} max={100} value={quality} onChange={(e) => setQuality(parseInt(e.target.value))} className="w-full accent-primary" />
                                    <div className="flex justify-between text-xs text-muted-foreground"><span>Smaller file</span><span>Higher quality</span></div>
                                </div>
                            )}

                            {/* ICO size */}
                            {targetFormat === "image/x-icon" && (
                                <div>
                                    <label className="text-xs text-muted-foreground">Icon size</label>
                                    <div className="flex gap-1 mt-1">
                                        {[16, 32, 48, 64, 128, 256].map((s) => (
                                            <button key={s} onClick={() => setIcoSize(s)}
                                                className={`flex-1 py-1.5 text-xs rounded-md border transition-colors ${icoSize === s ? "bg-foreground text-background" : ""}`}>
                                                {s}px
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Optional resize */}
                            <div className="flex items-center gap-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={resizeEnabled} onChange={(e) => setResizeEnabled(e.target.checked)} className="rounded" />
                                    <span className="text-sm">Limit max width</span>
                                </label>
                                {resizeEnabled && (
                                    <select value={maxWidth} onChange={(e) => setMaxWidth(parseInt(e.target.value))}
                                        className="h-8 rounded-md border bg-background px-2 text-sm">
                                        <option value={640}>640px</option>
                                        <option value={1024}>1024px</option>
                                        <option value={1920}>1920px</option>
                                        <option value={2560}>2560px</option>
                                        <option value={3840}>3840px</option>
                                    </select>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* File list */}
                    <Card className="mb-4">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium">{images.length} image{images.length !== 1 ? "s" : ""}</span>
                                <Button variant="ghost" size="sm" onClick={() => setImages([])} className="text-xs h-7">Clear all</Button>
                            </div>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {images.map((img) => (
                                    <div key={img.id} className={`flex items-center gap-2 p-2 rounded border text-sm ${img.error ? "border-destructive/30 bg-destructive/5" : "bg-muted/30"}`}>
                                        {img.preview ? (
                                            <img src={img.preview} alt="" className="h-8 w-8 object-cover rounded shrink-0" />
                                        ) : (
                                            <ImageIcon className="h-4 w-4 text-blue-500 shrink-0 ml-2" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="truncate text-xs">{img.name}</p>
                                            <p className="text-xs text-muted-foreground">{formatBytes(img.file.size)}{img.convertedSize ? ` → ${formatBytes(img.convertedSize)}` : ""}</p>
                                        </div>
                                        {img.error && <span className="text-xs text-destructive shrink-0">Failed</span>}
                                        {img.convertedName && !img.error && (
                                            <>
                                                <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                                                <span className="text-xs text-green-600 shrink-0">{img.convertedName.split(".").pop()?.toUpperCase()}</span>
                                            </>
                                        )}
                                        {img.convertedUrl && (
                                            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => downloadImage(img)}>
                                                <Download className="h-3 w-3" />
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setImages(prev => prev.filter(i => i.id !== img.id))}>
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Progress */}
                    {isProcessing && (
                        <Card className="mb-4">
                            <CardContent className="py-3 px-4">
                                <Progress value={progress} className="h-2" />
                                <p className="text-xs text-muted-foreground mt-1 text-center">{progress}%</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-2">
                        {hasConverted && images.length > 1 && (
                            <Button variant="outline" onClick={downloadAll}>
                                <Download className="h-4 w-4 mr-2" />Download All (ZIP)
                            </Button>
                        )}
                        <Button onClick={handleConvert} disabled={isProcessing}>
                            {isProcessing ? "Converting..." : `Convert to ${targetLabel}`}
                        </Button>
                    </div>
                </>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">All processing happens in your browser • Nothing uploaded</p>
        </div>
    );
}
