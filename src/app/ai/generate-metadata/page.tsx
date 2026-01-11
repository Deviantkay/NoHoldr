"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Wand2, Upload, Copy, Check, X, Download } from "lucide-react";
import { describeImage, hasApiKey, getErrorMessage } from "@/lib/gemini";

interface ImageMeta {
    id: string;
    file: File;
    url: string;
    title?: string;
    description?: string;
    keywords?: string[];
    isProcessing?: boolean;
    error?: string;
}

export default function GenerateMetadataPage() {
    const [images, setImages] = useState<ImageMeta[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleFiles = useCallback((files: File[]) => {
        const newImages = files
            .filter(f => f.type.startsWith("image/"))
            .map(f => ({
                id: crypto.randomUUID(),
                file: f,
                url: URL.createObjectURL(f),
            }));
        setImages(prev => [...prev, ...newImages]);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(Array.from(e.dataTransfer.files));
    }, [handleFiles]);

    const processImages = async () => {
        if (!hasApiKey()) return;
        setIsProcessing(true);

        const updated = [...images];

        for (let i = 0; i < updated.length; i++) {
            if (updated[i].title) continue; // Skip already processed

            updated[i] = { ...updated[i], isProcessing: true };
            setImages([...updated]);

            try {
                const reader = new FileReader();
                const base64 = await new Promise<string>((resolve) => {
                    reader.onload = () => resolve((reader.result as string).split(",")[1]);
                    reader.readAsDataURL(updated[i].file);
                });

                const prompt = `Analyze this image and generate SEO-optimized metadata in the following JSON format only:
{
  "title": "concise descriptive title (max 60 chars)",
  "description": "detailed description for SEO (max 160 chars)",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}
Only return valid JSON, no other text.`;

                const result = await describeImage(base64, updated[i].file.type, prompt);

                // Parse JSON response
                const jsonMatch = result.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    updated[i] = {
                        ...updated[i],
                        title: parsed.title,
                        description: parsed.description,
                        keywords: parsed.keywords,
                        isProcessing: false,
                    };
                } else {
                    throw new Error("Failed to parse response");
                }
            } catch (err) {
                updated[i] = {
                    ...updated[i],
                    error: getErrorMessage(err),
                    isProcessing: false,
                };
            }

            setImages([...updated]);
        }

        setIsProcessing(false);
    };

    const exportCSV = () => {
        const headers = ["filename", "title", "description", "keywords"];
        const rows = images
            .filter(img => img.title)
            .map(img => [
                img.file.name,
                `"${img.title?.replace(/"/g, '""') || ""}"`,
                `"${img.description?.replace(/"/g, '""') || ""}"`,
                `"${img.keywords?.join(", ") || ""}"`,
            ]);

        const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "metadata.csv";
        a.click();
    };

    const copyAll = async () => {
        const text = images
            .filter(img => img.title)
            .map(img => `${img.file.name}\nTitle: ${img.title}\nDescription: ${img.description}\nKeywords: ${img.keywords?.join(", ")}`)
            .join("\n\n---\n\n");
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const hasProcessed = images.some(img => img.title);

    return (
        <div className="max-w-3xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/ai"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <div>
                    <h1 className="text-lg font-semibold flex items-center gap-2">
                        <Wand2 className="h-5 w-5" /> Generate Metadata
                    </h1>
                    <p className="text-xs text-muted-foreground">AI-powered titles, descriptions, keywords</p>
                </div>
            </div>

            {/* Drop Zone */}
            {images.length === 0 ? (
                <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors mb-4 ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                        }`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById("img-input")?.click()}
                >
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
                        className="hidden"
                        id="img-input"
                    />
                    <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                    <p className="font-medium">Drop images</p>
                    <p className="text-sm text-muted-foreground">or click to browse</p>
                </div>
            ) : (
                <>
                    {/* Images Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                        {images.map((img) => (
                            <div key={img.id} className="relative rounded-xl border overflow-hidden">
                                <img src={img.url} alt="" className="w-full h-24 object-cover" />
                                {img.isProcessing && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <Loader2 className="h-5 w-5 text-white animate-spin" />
                                    </div>
                                )}
                                {img.title && (
                                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 p-2">
                                        <p className="text-xs text-white truncate">{img.title}</p>
                                    </div>
                                )}
                                {img.error && (
                                    <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center p-2">
                                        <p className="text-xs text-white text-center">{img.error}</p>
                                    </div>
                                )}
                                <button
                                    onClick={() => setImages(prev => prev.filter(i => i.id !== img.id))}
                                    className="absolute top-1 right-1 p-1 bg-black/50 rounded-full"
                                >
                                    <X className="h-3 w-3 text-white" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mb-6">
                        <Button onClick={processImages} disabled={isProcessing} className="flex-1">
                            {isProcessing ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</>
                            ) : (
                                "Generate Metadata"
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => document.getElementById("img-input")?.click()}
                        >
                            Add More
                        </Button>
                    </div>

                    {/* Results */}
                    {hasProcessed && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Results</span>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" onClick={copyAll}>
                                        {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                                        Copy
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={exportCSV}>
                                        <Download className="h-4 w-4 mr-1" />CSV
                                    </Button>
                                </div>
                            </div>

                            {images.filter(img => img.title).map((img) => (
                                <div key={img.id} className="rounded-xl border p-4">
                                    <p className="font-medium text-sm mb-1">{img.file.name}</p>
                                    <p className="text-sm"><strong>Title:</strong> {img.title}</p>
                                    <p className="text-sm"><strong>Description:</strong> {img.description}</p>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {img.keywords?.map((kw, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-muted rounded-full text-xs">{kw}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            <p className="text-xs text-muted-foreground text-center mt-8">
                Requests go directly to Google Gemini
            </p>
        </div>
    );
}
