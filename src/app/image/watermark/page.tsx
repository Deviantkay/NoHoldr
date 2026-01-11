"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Upload, Download, Image as ImageIcon, Grid3X3 } from "lucide-react";

export default function WatermarkImagePage() {
    const [file, setFile] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [text, setText] = useState("© NoHoldr");
    const [opacity, setOpacity] = useState([40]);
    const [repeat, setRepeat] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleFile = useCallback((f: File) => {
        if (!f.type.startsWith("image/")) return;
        setFile(f);
        setImageUrl(URL.createObjectURL(f));
        setPreviewUrl(null);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    }, [handleFile]);

    const applyWatermark = () => {
        if (!imageUrl) return;

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            ctx.drawImage(img, 0, 0);

            const fontSize = Math.max(16, Math.min(img.width, img.height) / (repeat ? 20 : 12));
            ctx.font = `bold ${fontSize}px sans-serif`;
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity[0] / 100})`;
            ctx.strokeStyle = `rgba(0, 0, 0, ${opacity[0] / 200})`;
            ctx.lineWidth = Math.max(1, fontSize / 20);
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            if (repeat) {
                // Tile watermark across entire image
                const textWidth = ctx.measureText(text).width;
                const stepX = textWidth + fontSize * 2;
                const stepY = fontSize * 3;

                ctx.save();
                ctx.rotate(-Math.PI / 6);

                // Calculate bounds for rotated pattern
                const diagonal = Math.sqrt(img.width * img.width + img.height * img.height);
                const startX = -diagonal;
                const startY = -diagonal / 2;

                for (let y = startY; y < diagonal; y += stepY) {
                    for (let x = startX; x < diagonal * 1.5; x += stepX) {
                        ctx.strokeText(text, x, y);
                        ctx.fillText(text, x, y);
                    }
                }
                ctx.restore();
            } else {
                // Single watermark in center
                ctx.save();
                ctx.translate(img.width / 2, img.height / 2);
                ctx.rotate(-Math.PI / 6);
                ctx.strokeText(text, 0, 0);
                ctx.fillText(text, 0, 0);
                ctx.restore();
            }

            setPreviewUrl(canvas.toDataURL("image/png"));
        };
        img.src = imageUrl;
    };

    const download = () => {
        if (!previewUrl || !file) return;
        const a = document.createElement("a");
        a.href = previewUrl;
        a.download = file.name.replace(/\.[^.]+$/, "") + "_watermarked.png";
        a.click();
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/image"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">Add Watermark</h1>
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
                            <Button variant="ghost" size="sm" onClick={() => { setFile(null); setPreviewUrl(null); }}>Change</Button>
                        </div>
                        <img src={previewUrl || imageUrl || ""} alt="Preview" className="w-full rounded-lg max-h-64 object-contain" />
                    </div>

                    <div className="border rounded-xl p-4 mb-4 space-y-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Watermark Text</label>
                            <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="© Your Name" />
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-medium">Opacity</label>
                                <span className="text-sm">{opacity[0]}%</span>
                            </div>
                            <Slider value={opacity} onValueChange={setOpacity} min={10} max={100} step={5} />
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setRepeat(false)}
                                className={`flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-colors ${!repeat ? "bg-primary text-primary-foreground border-primary" : "border-muted-foreground/25 hover:bg-muted"}`}
                            >
                                Center Only
                            </button>
                            <button
                                onClick={() => setRepeat(true)}
                                className={`flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2 ${repeat ? "bg-primary text-primary-foreground border-primary" : "border-muted-foreground/25 hover:bg-muted"}`}
                            >
                                <Grid3X3 className="h-4 w-4" />Repeat All
                            </button>
                        </div>
                        <Button onClick={applyWatermark} variant="outline" className="w-full">Preview</Button>
                    </div>

                    {previewUrl && (
                        <Button onClick={download} className="w-full h-11">
                            <Download className="h-4 w-4 mr-2" />Download
                        </Button>
                    )}
                </>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">Processed locally</p>
        </div>
    );
}
