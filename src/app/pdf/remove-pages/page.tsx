"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Upload, FileText, Download, Trash2 } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { downloadPdfBytes } from "@/lib/pdf-utils";

export default function RemovePagesPage() {
    const [file, setFile] = useState<File | null>(null);
    const [pageCount, setPageCount] = useState(0);
    const [pagesToRemove, setPagesToRemove] = useState("");
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleFile = useCallback(async (f: File) => {
        if (f.type !== "application/pdf") return;
        const pdf = await PDFDocument.load(await f.arrayBuffer());
        setFile(f);
        setPageCount(pdf.getPageCount());
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    }, [handleFile]);

    const parsePages = (): number[] => {
        const pages: number[] = [];
        const parts = pagesToRemove.split(",").map(p => p.trim()).filter(Boolean);
        for (const part of parts) {
            if (part.includes("-")) {
                const [a, b] = part.split("-").map(n => parseInt(n.trim(), 10));
                if (!isNaN(a) && !isNaN(b)) for (let i = a; i <= b; i++) pages.push(i);
            } else {
                const n = parseInt(part, 10);
                if (!isNaN(n)) pages.push(n);
            }
        }
        return [...new Set(pages)].filter(p => p >= 1 && p <= pageCount).sort((a, b) => a - b);
    };

    const removePages = async () => {
        if (!file) return;
        const toRemove = parsePages();
        if (toRemove.length === 0) return;

        setIsProcessing(true);
        setProgress(20);

        const pdf = await PDFDocument.load(await file.arrayBuffer());
        setProgress(50);

        // Remove pages in reverse order
        for (const page of toRemove.sort((a, b) => b - a)) {
            pdf.removePage(page - 1);
        }

        setProgress(80);
        const bytes = await pdf.save();
        downloadPdfBytes(bytes, file.name.replace(".pdf", "_removed.pdf"));

        setProgress(100);
        setTimeout(() => { setIsProcessing(false); setProgress(0); }, 1000);
    };

    const parsed = parsePages();

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/pdf"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">Remove Pages</h1>
            </div>

            {!file ? (
                <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById("pdf-input")?.click()}
                >
                    <input type="file" accept="application/pdf" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" id="pdf-input" />
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm"><span className="font-medium">Drop PDF</span> <span className="text-muted-foreground">or tap</span></p>
                </div>
            ) : (
                <>
                    <div className="border rounded-xl p-4 mb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-red-500" />
                                <div><span className="text-sm font-medium">{file.name}</span><p className="text-xs text-muted-foreground">{pageCount} pages</p></div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setFile(null)}>Change</Button>
                        </div>
                    </div>

                    <div className="border rounded-xl p-4 mb-4">
                        <label className="text-sm font-medium mb-2 block">Pages to remove</label>
                        <Input
                            value={pagesToRemove}
                            onChange={(e) => setPagesToRemove(e.target.value)}
                            placeholder="1, 3, 5-10"
                        />
                        {parsed.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-2">
                                Will remove: {parsed.join(", ")} ({parsed.length} pages)
                            </p>
                        )}
                    </div>

                    {isProcessing && <Progress value={progress} className="h-1.5 mb-4" />}

                    <Button onClick={removePages} disabled={isProcessing || parsed.length === 0} className="w-full h-11">
                        <Trash2 className="h-4 w-4 mr-2" />Remove & Download
                    </Button>
                </>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">Processed locally</p>
        </div>
    );
}
