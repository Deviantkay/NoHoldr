"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, Copy, Check, Pipette } from "lucide-react";

interface ExtractedColor {
    hex: string;
    rgb: string;
    count: number;
    percent: number;
}

function rgbToHex(r: number, g: number, b: number): string {
    return "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("");
}

function quantize(value: number, step: number): number {
    return Math.round(value / step) * step;
}

export default function ColorExtractorPage() {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [colors, setColors] = useState<ExtractedColor[]>([]);
    const [paletteSize, setPaletteSize] = useState(8);
    const [pickedColor, setPickedColor] = useState<string | null>(null);
    const [copied, setCopied] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    const extractColors = useCallback((img: HTMLImageElement, count: number) => {
        const canvas = canvasRef.current!;
        const maxSize = 200; // Sample at smaller size for speed
        const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const colorMap = new Map<string, number>();
        const step = 24; // Quantization step

        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] < 128) continue; // Skip transparent
            const r = quantize(data[i], step);
            const g = quantize(data[i + 1], step);
            const b = quantize(data[i + 2], step);
            const key = `${r},${g},${b}`;
            colorMap.set(key, (colorMap.get(key) || 0) + 1);
        }

        const totalPixels = canvas.width * canvas.height;
        const sorted = Array.from(colorMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, count)
            .map(([key, cnt]) => {
                const [r, g, b] = key.split(",").map(Number);
                return {
                    hex: rgbToHex(r, g, b),
                    rgb: `rgb(${r}, ${g}, ${b})`,
                    count: cnt,
                    percent: Math.round((cnt / totalPixels) * 100),
                };
            });

        setColors(sorted);
    }, []);

    const handleUpload = (file: File) => {
        if (!file.type.startsWith("image/")) return;
        const url = URL.createObjectURL(file);
        setImageUrl(url);
        const img = new window.Image();
        img.onload = () => {
            if (imgRef.current) imgRef.current.src = url;
            extractColors(img, paletteSize);
        };
        img.src = url;
    };

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        const x = Math.round((e.clientX - rect.left) * (canvas.width / rect.width));
        const y = Math.round((e.clientY - rect.top) * (canvas.height / rect.height));
        const ctx = canvas.getContext("2d")!;
        const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
        setPickedColor(rgbToHex(r, g, b));
    };

    const copy = async (text: string) => {
        await navigator.clipboard.writeText(text);
        setCopied(text);
        setTimeout(() => setCopied(null), 1500);
    };

    const exportPalette = () => {
        const css = colors.map((c, i) => `  --color-${i + 1}: ${c.hex};`).join("\n");
        const text = `:root {\n${css}\n}`;
        navigator.clipboard.writeText(text);
        setCopied("palette");
        setTimeout(() => setCopied(null), 1500);
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/data"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">Image Color Extractor</h1>
            </div>

            {!imageUrl ? (
                <div className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 transition-colors"
                    onClick={() => document.getElementById("color-upload")?.click()}>
                    <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} className="hidden" id="color-upload" />
                    <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">Upload an image</p>
                    <p className="text-xs text-muted-foreground mt-1">Extract dominant colors from any image</p>
                </div>
            ) : (
                <>
                    {/* Image preview + color picker canvas */}
                    <div className="border rounded-xl overflow-hidden mb-4">
                        <div className="relative bg-[repeating-conic-gradient(#e5e7eb_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]">
                            <canvas ref={canvasRef} onClick={handleCanvasClick}
                                className="w-full max-h-64 object-contain cursor-crosshair" style={{ imageRendering: "auto" }} />
                        </div>
                        <div className="p-3 flex items-center justify-between border-t">
                            <div className="flex items-center gap-2">
                                {pickedColor && (
                                    <>
                                        <Pipette className="h-3.5 w-3.5 text-muted-foreground" />
                                        <div className="w-5 h-5 rounded border" style={{ backgroundColor: pickedColor }} />
                                        <button onClick={() => copy(pickedColor)} className="font-mono text-xs hover:underline">{pickedColor}</button>
                                    </>
                                )}
                            </div>
                            <button onClick={() => { setImageUrl(null); setColors([]); setPickedColor(null); }}
                                className="text-xs text-muted-foreground hover:text-foreground">Change image</button>
                        </div>
                    </div>

                    {/* Palette size */}
                    <div className="flex items-center gap-3 mb-4">
                        <label className="text-xs text-muted-foreground">Colors:</label>
                        <div className="flex gap-1">
                            {[4, 6, 8, 12, 16].map(n => (
                                <button key={n} onClick={() => {
                                    setPaletteSize(n);
                                    if (imageUrl) {
                                        const img = new window.Image();
                                        img.onload = () => extractColors(img, n);
                                        img.src = imageUrl;
                                    }
                                }}
                                    className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${paletteSize === n ? "bg-foreground text-background" : ""}`}>
                                    {n}
                                </button>
                            ))}
                        </div>
                        <div className="flex-1" />
                        <Button variant="outline" size="sm" className="text-xs h-7" onClick={exportPalette}>
                            {copied === "palette" ? <Check className="h-3 w-3 mr-1 text-green-500" /> : <Copy className="h-3 w-3 mr-1" />}
                            CSS Variables
                        </Button>
                    </div>

                    {/* Color palette */}
                    {colors.length > 0 && (
                        <>
                            {/* Gradient bar */}
                            <div className="h-10 rounded-lg overflow-hidden flex mb-4">
                                {colors.map((c, i) => (
                                    <div key={i} style={{ backgroundColor: c.hex, flex: c.count }} title={`${c.hex} (${c.percent}%)`} />
                                ))}
                            </div>

                            {/* Color list */}
                            <div className="border rounded-xl overflow-hidden">
                                {colors.map((c, i) => (
                                    <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b last:border-0 hover:bg-muted/20 transition-colors">
                                        <div className="w-8 h-8 rounded-lg border shrink-0" style={{ backgroundColor: c.hex }} />
                                        <div className="flex-1 min-w-0">
                                            <button onClick={() => copy(c.hex)} className="font-mono text-sm font-medium hover:underline">{c.hex}</button>
                                            <p className="text-xs text-muted-foreground">{c.rgb}</p>
                                        </div>
                                        <span className="text-xs text-muted-foreground shrink-0">{c.percent}%</span>
                                        <button onClick={() => copy(c.hex)} className="shrink-0 text-muted-foreground hover:text-foreground">
                                            {copied === c.hex ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </>
            )}

            <canvas ref={canvasRef} className={imageUrl ? "" : "hidden"} />
            <p className="text-xs text-muted-foreground text-center mt-6">100% local • No data sent</p>
        </div>
    );
}
