"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Image as ImageIcon, Upload, Copy, Check, X } from "lucide-react";
import { describeImage, hasApiKey, getErrorMessage } from "@/lib/gemini";

export default function DescribeImagePage() {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [imageData, setImageData] = useState<{ base64: string; mimeType: string } | null>(null);
    const [customPrompt, setCustomPrompt] = useState("");
    const [description, setDescription] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const handleFile = useCallback((file: File) => {
        if (!file.type.startsWith("image/")) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            setImageUrl(result);
            // Extract base64 data
            const base64 = result.split(",")[1];
            setImageData({ base64, mimeType: file.type });
        };
        reader.readAsDataURL(file);
        setDescription("");
        setError(null);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    }, [handleFile]);

    const describe = async () => {
        if (!imageData || isLoading) return;
        if (!hasApiKey()) {
            setError("Please configure your API key in the AI hub first.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const prompt = customPrompt.trim() || "Describe this image in detail. Include what you see, any text, colors, composition, and context.";
            const result = await describeImage(imageData.base64, imageData.mimeType, prompt);
            setDescription(result);
        } catch (err) {
            setError(getErrorMessage(err));
        }

        setIsLoading(false);
    };

    const copyToClipboard = async () => {
        await navigator.clipboard.writeText(description);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const clearImage = () => {
        setImageUrl(null);
        setImageData(null);
        setDescription("");
        setError(null);
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/ai"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <div>
                    <h1 className="text-lg font-semibold flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" /> Describe Image
                    </h1>
                    <p className="text-xs text-muted-foreground">AI image analysis</p>
                </div>
            </div>

            {/* Drop Zone or Preview */}
            {!imageUrl ? (
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
                        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                        className="hidden"
                        id="img-input"
                    />
                    <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                    <p className="font-medium">Drop an image</p>
                    <p className="text-sm text-muted-foreground">or click to browse</p>
                </div>
            ) : (
                <div className="relative rounded-xl border overflow-hidden mb-4">
                    <img src={imageUrl} alt="Preview" className="w-full max-h-80 object-contain bg-muted" />
                    <Button
                        variant="secondary"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={clearImage}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {/* Custom Prompt */}
            {imageUrl && (
                <div className="mb-4">
                    <label className="text-sm font-medium mb-2 block">Custom prompt (optional)</label>
                    <Textarea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="What would you like to know about this image?"
                        className="min-h-[80px]"
                    />
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20 p-3 mb-4">
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
            )}

            {/* Action */}
            {imageUrl && (
                <Button onClick={describe} disabled={isLoading} className="w-full mb-6">
                    {isLoading ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</>
                    ) : (
                        "Describe Image"
                    )}
                </Button>
            )}

            {/* Result */}
            {description && (
                <div className="rounded-xl border p-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium">Description</span>
                        <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                            {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                            {copied ? "Copied" : "Copy"}
                        </Button>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{description}</p>
                </div>
            )}

            <p className="text-xs text-muted-foreground text-center mt-8">
                Requests go directly to Google Gemini
            </p>
        </div>
    );
}
