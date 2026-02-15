"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, Image as ImageIcon, Download, X, ArrowRight } from "lucide-react";

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

const OUTPUT_FORMATS = [
    { value: "image/jpeg", label: "JPEG", ext: "jpg", desc: "Best for photos" },
    { value: "image/png", label: "PNG", ext: "png", desc: "Lossless, transparency" },
    { value: "image/webp", label: "WebP", ext: "webp", desc: "Modern, compact" },
    { value: "image/avif", label: "AVIF", ext: "avif", desc: "Next-gen, tiny" },
    { value: "image/bmp", label: "BMP", ext: "bmp", desc: "Uncompressed" },
    { value: "image/gif", label: "GIF", ext: "gif", desc: "Simple images" },
    { value: "image/svg+xml", label: "SVG (trace)", ext: "svg", desc: "Vector embed" },
    { value: "image/x-icon", label: "ICO", ext: "ico", desc: "Favicon" },
];

function formatBytes(b: number) { return b < 1024 ? b + " B" : b < 1048576 ? (b / 1024).toFixed(1) + " KB" : (b / 1048576).toFixed(1) + " MB"; }

export default function ImageConverterPage() {
    const [images, setImages] = useState<ImageFile[]>([]);
    const [targetFormat, setTargetFormat] = useState("image/webp");
    const [quality, setQuality] = useState(92);
    const [icoSize, setIcoSize] = useState(64);
    const [resizeEnabled, setResizeEnabled] = useState(false);
    const [maxWidth, setMaxWidth] = useState(1920);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    const addImages = (files: File[]) => {
        const newImgs: ImageFile[] = files
            .filter(f => f.type.startsWith("image/") || /\.(heic|heif|bmp|tiff?)$/i.test(f.name))
            .map(f => ({
                id: Math.random().toString(36).substr(2, 9),
                file: f, name: f.name,
                preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
            }));
        setImages(prev => [...prev, ...newImgs]);
    };

    const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); addImages(Array.from(e.dataTransfer.files)); }, []);

    const loadImage = (file: File): Promise<HTMLImageElement> =>
        new Promise((res, rej) => {
            const img = new window.Image();
            img.onload = () => res(img);
            img.onerror = () => rej(new Error("Failed to decode"));
            img.src = URL.createObjectURL(file);
        });

    const createIcoBlob = async (canvas: HTMLCanvasElement): Promise<Blob> => {
        const png = await new Promise<Blob>(r => canvas.toBlob(b => r(b!), "image/png"));
        const data = new Uint8Array(await png.arrayBuffer());
        const s = canvas.width;
        const buf = new ArrayBuffer(22);
        const v = new DataView(buf);
        v.setUint16(0, 0, true); v.setUint16(2, 1, true); v.setUint16(4, 1, true);
        v.setUint8(6, s >= 256 ? 0 : s); v.setUint8(7, s >= 256 ? 0 : s);
        v.setUint8(8, 0); v.setUint8(9, 0);
        v.setUint16(10, 1, true); v.setUint16(12, 32, true);
        v.setUint32(14, data.length, true); v.setUint32(18, 22, true);
        return new Blob([buf, data], { type: "image/x-icon" });
    };

    const convertOne = async (file: File): Promise<{ url: string; name: string; size: number }> => {
        const img = await loadImage(file);
        let w = img.width, h = img.height;
        const fmt = targetFormat;
        if (fmt === "image/x-icon") { w = icoSize; h = icoSize; }
        else if (resizeEnabled && w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
        const c = document.createElement("canvas"); c.width = w; c.height = h;
        const ctx = c.getContext("2d")!;
        if (fmt === "image/jpeg" || fmt === "image/bmp") { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h); }
        ctx.drawImage(img, 0, 0, w, h);

        if (fmt === "image/svg+xml") {
            const du = c.toDataURL("image/png");
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><image href="${du}" width="${w}" height="${h}"/></svg>`;
            const blob = new Blob([svg], { type: "image/svg+xml" });
            return { url: URL.createObjectURL(blob), name: file.name.replace(/\.[^.]+$/, ".svg"), size: blob.size };
        }
        if (fmt === "image/x-icon") {
            const blob = await createIcoBlob(c);
            return { url: URL.createObjectURL(blob), name: file.name.replace(/\.[^.]+$/, ".ico"), size: blob.size };
        }
        return new Promise((res, rej) => {
            const q = ["image/png", "image/gif"].includes(fmt) ? undefined : quality / 100;
            c.toBlob(blob => {
                if (blob) {
                    const ext = OUTPUT_FORMATS.find(f => f.value === fmt)?.ext || "jpg";
                    res({ url: URL.createObjectURL(blob), name: file.name.replace(/\.[^.]+$/, "." + ext), size: blob.size });
                } else rej(new Error("Unsupported format"));
            }, fmt, q);
        });
    };

    const handleConvert = async () => {
        setIsProcessing(true); setProgress(0);
        const updated = [...images];
        for (let i = 0; i < updated.length; i++) {
            setProgress(Math.round(((i + .5) / updated.length) * 100));
            try {
                if (updated[i].convertedUrl) URL.revokeObjectURL(updated[i].convertedUrl!);
                const r = await convertOne(updated[i].file);
                updated[i] = { ...updated[i], convertedUrl: r.url, convertedName: r.name, convertedSize: r.size, error: undefined };
            } catch (e) { updated[i] = { ...updated[i], error: (e as Error).message }; }
        }
        setImages([...updated]); setProgress(100); setIsProcessing(false);
    };

    const downloadOne = (img: ImageFile) => {
        if (!img.convertedUrl) return;
        const a = document.createElement("a"); a.href = img.convertedUrl; a.download = img.convertedName || "converted"; a.click();
    };

    const downloadAll = async () => {
        const JSZip = (await import("jszip")).default;
        const zip = new JSZip();
        for (const img of images) {
            if (img.convertedUrl && img.convertedName) {
                const r = await fetch(img.convertedUrl); zip.file(img.convertedName, await r.blob());
            }
        }
        const b = await zip.generateAsync({ type: "blob" });
        const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "converted.zip"; a.click();
    };

    const hasConverted = images.some(i => i.convertedUrl);
    const label = OUTPUT_FORMATS.find(f => f.value === targetFormat)?.label || "";
    const lossy = !["image/png", "image/gif", "image/svg+xml", "image/bmp", "image/x-icon"].includes(targetFormat);

    return (
        <div className="max-w-3xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6 border-b pb-4">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/convert"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <div>
                    <h1 className="text-xl font-semibold">Image Converter</h1>
                    <p className="text-sm text-muted-foreground">JPEG • PNG • WebP • AVIF • BMP • GIF • SVG • ICO</p>
                </div>
            </div>

            {/* Upload */}
            <div
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer mb-4 ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onDrop={handleDrop}
                onClick={() => document.getElementById("cvt-img-up")?.click()}
            >
                <input type="file" accept="image/*,.heic,.heif,.bmp,.tiff,.tif" multiple onChange={(e) => e.target.files && addImages(Array.from(e.target.files))} className="hidden" id="cvt-img-up" />
                <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                <p className="text-sm"><span className="font-medium">Drop images</span> or click</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP, AVIF, BMP, GIF, TIFF, SVG, ICO</p>
            </div>

            {images.length > 0 && (
                <>
                    {/* Settings */}
                    <div className="border rounded-xl p-4 mb-4 space-y-3">
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Output format</label>
                            <Select value={targetFormat} onValueChange={setTargetFormat}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {OUTPUT_FORMATS.map(f => (
                                        <SelectItem key={f.value} value={f.value}>
                                            <span className="font-medium">{f.label}</span>
                                            <span className="text-xs text-muted-foreground ml-2">{f.desc}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {lossy && (
                            <div>
                                <label className="text-xs text-muted-foreground">Quality: {quality}%</label>
                                <input type="range" min={10} max={100} value={quality} onChange={e => setQuality(+e.target.value)} className="w-full accent-primary" />
                            </div>
                        )}

                        {targetFormat === "image/x-icon" && (
                            <div>
                                <label className="text-xs text-muted-foreground">Icon size</label>
                                <div className="flex gap-1 mt-1">
                                    {[16, 32, 48, 64, 128, 256].map(s => (
                                        <button key={s} onClick={() => setIcoSize(s)}
                                            className={`flex-1 py-1.5 text-xs rounded-md border ${icoSize === s ? "bg-foreground text-background" : ""}`}>{s}px</button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input type="checkbox" checked={resizeEnabled} onChange={e => setResizeEnabled(e.target.checked)} className="rounded" />
                            Limit max width
                            {resizeEnabled && (
                                <select value={maxWidth} onChange={e => setMaxWidth(+e.target.value)} className="h-7 rounded-md border bg-background px-2 text-xs">
                                    {[640, 1024, 1920, 2560, 3840].map(w => <option key={w} value={w}>{w}px</option>)}
                                </select>
                            )}
                        </label>
                    </div>

                    {/* File list */}
                    <div className="border rounded-xl p-4 mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">{images.length} image{images.length > 1 ? "s" : ""}</span>
                            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setImages([])}>Clear</Button>
                        </div>
                        <div className="space-y-1.5 max-h-56 overflow-y-auto">
                            {images.map(img => (
                                <div key={img.id} className={`flex items-center gap-2 p-2 rounded border text-sm ${img.error ? "border-destructive/30 bg-destructive/5" : "bg-muted/20"}`}>
                                    {img.preview ? <img src={img.preview} alt="" className="h-7 w-7 object-cover rounded shrink-0" /> : <ImageIcon className="h-4 w-4 shrink-0 ml-1.5" />}
                                    <div className="flex-1 min-w-0">
                                        <p className="truncate text-xs">{img.name}</p>
                                        <p className="text-xs text-muted-foreground">{formatBytes(img.file.size)}{img.convertedSize ? ` → ${formatBytes(img.convertedSize)}` : ""}</p>
                                    </div>
                                    {img.error && <span className="text-xs text-destructive shrink-0">Failed</span>}
                                    {img.convertedName && !img.error && <><ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" /><span className="text-xs text-green-600 shrink-0">{img.convertedName.split(".").pop()?.toUpperCase()}</span></>}
                                    {img.convertedUrl && <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => downloadOne(img)}><Download className="h-3 w-3" /></Button>}
                                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setImages(p => p.filter(i => i.id !== img.id))}><X className="h-3 w-3" /></Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {isProcessing && <Progress value={progress} className="h-2 mb-4" />}

                    <div className="flex justify-end gap-2">
                        {hasConverted && images.length > 1 && <Button variant="outline" onClick={downloadAll}><Download className="h-4 w-4 mr-2" />All (ZIP)</Button>}
                        <Button onClick={handleConvert} disabled={isProcessing}>{isProcessing ? "Converting..." : `Convert to ${label}`}</Button>
                    </div>
                </>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">All processing in browser • Nothing uploaded</p>
        </div>
    );
}
