"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, File, Copy, Check } from "lucide-react";

interface FileHash {
    name: string;
    size: number;
    hash: string;
}

export default function FileHashPage() {
    const [files, setFiles] = useState<FileHash[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);

    const hashFile = async (file: File): Promise<string> => {
        const buffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    };

    const handleFiles = useCallback(async (fileList: File[]) => {
        setIsProcessing(true);
        const results: FileHash[] = [];

        for (const file of fileList) {
            const hash = await hashFile(file);
            results.push({ name: file.name, size: file.size, hash });
        }

        setFiles(prev => [...prev, ...results]);
        setIsProcessing(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(Array.from(e.dataTransfer.files));
    }, [handleFiles]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) handleFiles(Array.from(e.target.files));
    }, [handleFiles]);

    const copy = async (hash: string) => {
        await navigator.clipboard.writeText(hash);
        setCopied(hash);
        setTimeout(() => setCopied(null), 1500);
    };

    const fmt = (b: number) => b < 1024 ? b + " B" : b < 1048576 ? (b / 1024).toFixed(1) + " KB" : (b / 1048576).toFixed(1) + " MB";

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/files"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">File Hash (SHA-256)</h1>
            </div>

            <div
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors mb-4 ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-input")?.click()}
            >
                <input type="file" multiple onChange={handleFileSelect} className="hidden" id="file-input" />
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm"><span className="font-medium">Drop files</span> <span className="text-muted-foreground">or tap</span></p>
            </div>

            {isProcessing && <p className="text-sm text-center mb-4">Calculating...</p>}

            {files.length > 0 && (
                <div className="border rounded-xl p-4">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-medium">{files.length} files</span>
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setFiles([])}>Clear</Button>
                    </div>
                    <div className="space-y-3">
                        {files.map((f, i) => (
                            <div key={i} className="p-3 rounded-lg bg-muted/50">
                                <div className="flex items-center gap-2 mb-1">
                                    <File className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="text-sm font-medium truncate">{f.name}</span>
                                    <span className="text-xs text-muted-foreground">{fmt(f.size)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 text-xs font-mono text-muted-foreground truncate">{f.hash}</code>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => copy(f.hash)}>
                                        {copied === f.hash ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">Processed locally</p>
        </div>
    );
}
