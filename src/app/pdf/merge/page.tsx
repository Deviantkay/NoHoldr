"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Upload, FileText, Download, X } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { downloadPdfBytes } from "@/lib/pdf-utils";

interface UploadedFile {
    id: string;
    file: File;
    name: string;
    size: number;
    pageCount?: number;
}

export default function MergePDFPage() {
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState("");

    const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
    const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        addFiles(Array.from(e.dataTransfer.files).filter(f => f.type === "application/pdf"));
    }, []);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) addFiles(Array.from(e.target.files).filter(f => f.type === "application/pdf"));
    }, []);

    const addFiles = async (newFiles: File[]) => {
        const uploaded: UploadedFile[] = [];
        for (const file of newFiles) {
            try {
                const pdf = await PDFDocument.load(await file.arrayBuffer());
                uploaded.push({ id: crypto.randomUUID(), file, name: file.name, size: file.size, pageCount: pdf.getPageCount() });
            } catch {
                uploaded.push({ id: crypto.randomUUID(), file, name: file.name, size: file.size });
            }
        }
        setFiles(prev => [...prev, ...uploaded]);
    };

    const moveFile = (i: number, dir: "up" | "down") => {
        const j = dir === "up" ? i - 1 : i + 1;
        if (j < 0 || j >= files.length) return;
        const arr = [...files];
        [arr[i], arr[j]] = [arr[j], arr[i]];
        setFiles(arr);
    };

    const handleMerge = async () => {
        if (files.length < 2) return;
        setIsProcessing(true);
        setProgress(0);
        setStatus("Merging...");

        try {
            const merged = await PDFDocument.create();
            for (let i = 0; i < files.length; i++) {
                setProgress(Math.round((i / files.length) * 90));
                const pdf = await PDFDocument.load(await files[i].file.arrayBuffer());
                const pages = await merged.copyPages(pdf, pdf.getPageIndices());
                pages.forEach(p => merged.addPage(p));
            }
            setProgress(95);
            downloadPdfBytes(await merged.save(), "merged.pdf");
            setProgress(100);
            setStatus("Done!");
            setTimeout(() => { setIsProcessing(false); setProgress(0); setStatus(""); }, 1000);
        } catch {
            setStatus("Error");
            setIsProcessing(false);
        }
    };

    const fmt = (b: number) => b < 1024 ? b + " B" : b < 1048576 ? (b / 1024).toFixed(1) + " KB" : (b / 1048576).toFixed(1) + " MB";
    const totalPages = files.reduce((a, f) => a + (f.pageCount || 0), 0);

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/pdf"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">Merge PDF</h1>
            </div>

            {/* Drop Zone */}
            <div
                className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors mb-4
          ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"}
        `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById("pdf-input")?.click()}
            >
                <input type="file" accept="application/pdf" multiple onChange={handleFileSelect} className="hidden" id="pdf-input" />
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm"><span className="font-medium">Drop PDFs</span> <span className="text-muted-foreground">or tap to select</span></p>
            </div>

            {/* File List */}
            {files.length > 0 && (
                <div className="border rounded-xl p-4 mb-4">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-medium">{files.length} files • {totalPages} pages</span>
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setFiles([])}>Clear</Button>
                    </div>
                    <div className="space-y-2">
                        {files.map((f, i) => (
                            <div key={f.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm">
                                <div className="flex gap-1">
                                    <button onClick={() => moveFile(i, "up")} disabled={i === 0} className="p-1 rounded hover:bg-muted disabled:opacity-30">↑</button>
                                    <button onClick={() => moveFile(i, "down")} disabled={i === files.length - 1} className="p-1 rounded hover:bg-muted disabled:opacity-30">↓</button>
                                </div>
                                <FileText className="h-4 w-4 text-red-500 shrink-0" />
                                <span className="flex-1 truncate">{f.name}</span>
                                <span className="text-xs text-muted-foreground">{f.pageCount}pg • {fmt(f.size)}</span>
                                <button onClick={() => setFiles(files.filter(x => x.id !== f.id))} className="p-1 rounded hover:bg-muted"><X className="h-3 w-3" /></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Progress */}
            {isProcessing && (
                <div className="border rounded-xl p-4 mb-4">
                    <div className="flex justify-between text-sm mb-2"><span>{status}</span><span>{progress}%</span></div>
                    <Progress value={progress} className="h-1.5" />
                </div>
            )}

            {/* Action */}
            <Button onClick={handleMerge} disabled={files.length < 2 || isProcessing} className="w-full h-11">
                <Download className="h-4 w-4 mr-2" />Merge & Download
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-4">Processed locally • Never uploaded</p>
        </div>
    );
}
