"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Upload, FileText, Download } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { downloadPdfBytes } from "@/lib/pdf-utils";

type Mode = "range" | "extract" | "every";

export default function SplitPDFPage() {
    const [file, setFile] = useState<File | null>(null);
    const [pageCount, setPageCount] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState("");
    const [mode, setMode] = useState<Mode>("range");
    const [rangeInput, setRangeInput] = useState("");
    const [extractInput, setExtractInput] = useState("");
    const [everyN, setEveryN] = useState("5");

    const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
    const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const f = Array.from(e.dataTransfer.files).find(f => f.type === "application/pdf");
        if (f) await loadPdf(f);
    }, []);

    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) await loadPdf(e.target.files[0]);
    }, []);

    const loadPdf = async (f: File) => {
        try {
            const pdf = await PDFDocument.load(await f.arrayBuffer());
            setFile(f);
            setPageCount(pdf.getPageCount());
        } catch { /* ignore */ }
    };

    const parseRanges = (input: string): number[][] => {
        const ranges: number[][] = [];
        for (const part of input.split(",").map(p => p.trim()).filter(Boolean)) {
            if (part.includes("-")) {
                const [a, b] = part.split("-").map(n => parseInt(n.trim(), 10));
                if (!isNaN(a) && !isNaN(b) && a >= 1 && b <= pageCount && a <= b) {
                    ranges.push(Array.from({ length: b - a + 1 }, (_, i) => a - 1 + i));
                }
            } else {
                const p = parseInt(part, 10);
                if (!isNaN(p) && p >= 1 && p <= pageCount) ranges.push([p - 1]);
            }
        }
        return ranges;
    };

    const handleSplit = async () => {
        if (!file) return;
        setIsProcessing(true);
        setProgress(0);
        setStatus("Splitting...");

        try {
            const source = await PDFDocument.load(await file.arrayBuffer());
            const base = file.name.replace(".pdf", "");

            if (mode === "range") {
                const ranges = parseRanges(rangeInput);
                if (ranges.length === 0) { setStatus("Invalid range"); setIsProcessing(false); return; }
                for (let i = 0; i < ranges.length; i++) {
                    setProgress(Math.round((i / ranges.length) * 90));
                    const doc = await PDFDocument.create();
                    const pages = await doc.copyPages(source, ranges[i]);
                    pages.forEach(p => doc.addPage(p));
                    downloadPdfBytes(await doc.save(), `${base}_part${i + 1}.pdf`);
                    await new Promise(r => setTimeout(r, 200));
                }
            } else if (mode === "extract") {
                const nums = extractInput.split(",").map(p => parseInt(p.trim(), 10) - 1).filter(p => p >= 0 && p < pageCount);
                if (nums.length === 0) { setStatus("Invalid pages"); setIsProcessing(false); return; }
                setProgress(50);
                const doc = await PDFDocument.create();
                const pages = await doc.copyPages(source, nums);
                pages.forEach(p => doc.addPage(p));
                downloadPdfBytes(await doc.save(), `${base}_extracted.pdf`);
            } else {
                const n = parseInt(everyN, 10);
                if (isNaN(n) || n < 1) { setStatus("Invalid number"); setIsProcessing(false); return; }
                const parts = Math.ceil(pageCount / n);
                for (let i = 0; i < parts; i++) {
                    setProgress(Math.round((i / parts) * 90));
                    const indices = Array.from({ length: Math.min(n, pageCount - i * n) }, (_, j) => i * n + j);
                    const doc = await PDFDocument.create();
                    const pages = await doc.copyPages(source, indices);
                    pages.forEach(p => doc.addPage(p));
                    downloadPdfBytes(await doc.save(), `${base}_part${i + 1}.pdf`);
                    await new Promise(r => setTimeout(r, 200));
                }
            }

            setProgress(100);
            setStatus("Done!");
            setTimeout(() => { setIsProcessing(false); setProgress(0); setStatus(""); }, 1000);
        } catch {
            setStatus("Error");
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/pdf"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">Split PDF</h1>
            </div>

            {!file ? (
                <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById("pdf-input")?.click()}
                >
                    <input type="file" accept="application/pdf" onChange={handleFileSelect} className="hidden" id="pdf-input" />
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm"><span className="font-medium">Drop PDF</span> <span className="text-muted-foreground">or tap</span></p>
                </div>
            ) : (
                <>
                    {/* File Info */}
                    <div className="flex items-center gap-3 p-3 border rounded-xl mb-4">
                        <FileText className="h-5 w-5 text-red-500" />
                        <div className="flex-1"><p className="text-sm font-medium">{file.name}</p><p className="text-xs text-muted-foreground">{pageCount} pages</p></div>
                        <Button variant="ghost" size="sm" onClick={() => setFile(null)}>Change</Button>
                    </div>

                    {/* Mode Tabs */}
                    <div className="flex gap-1 p-1 bg-muted rounded-lg mb-4">
                        {(["range", "extract", "every"] as Mode[]).map(m => (
                            <button
                                key={m}
                                onClick={() => setMode(m)}
                                className={`flex-1 py-2 px-3 text-sm rounded-md transition-colors ${mode === m ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}
                            >
                                {m === "range" ? "Ranges" : m === "extract" ? "Extract" : "Every N"}
                            </button>
                        ))}
                    </div>

                    {/* Mode Content */}
                    <div className="border rounded-xl p-4 mb-4">
                        {mode === "range" && (
                            <div>
                                <label className="text-sm font-medium">Page ranges</label>
                                <Input placeholder="1-5, 10-15" value={rangeInput} onChange={e => setRangeInput(e.target.value)} className="mt-1" />
                                <p className="text-xs text-muted-foreground mt-1">Each range → separate PDF</p>
                            </div>
                        )}
                        {mode === "extract" && (
                            <div>
                                <label className="text-sm font-medium">Pages to extract</label>
                                <Input placeholder="1, 3, 5, 7" value={extractInput} onChange={e => setExtractInput(e.target.value)} className="mt-1" />
                                <p className="text-xs text-muted-foreground mt-1">Combined into one PDF</p>
                            </div>
                        )}
                        {mode === "every" && (
                            <div>
                                <label className="text-sm font-medium">Split every N pages</label>
                                <Input type="number" min="1" value={everyN} onChange={e => setEveryN(e.target.value)} className="mt-1 w-24" />
                                <p className="text-xs text-muted-foreground mt-1">{Math.ceil(pageCount / (parseInt(everyN) || 1))} files</p>
                            </div>
                        )}
                    </div>

                    {/* Progress */}
                    {isProcessing && (
                        <div className="border rounded-xl p-4 mb-4">
                            <div className="flex justify-between text-sm mb-2"><span>{status}</span><span>{progress}%</span></div>
                            <Progress value={progress} className="h-1.5" />
                        </div>
                    )}

                    {/* Action */}
                    <Button onClick={handleSplit} disabled={isProcessing} className="w-full h-11">
                        <Download className="h-4 w-4 mr-2" />Split & Download
                    </Button>
                </>
            )}

            <p className="text-xs text-muted-foreground text-center mt-4">Processed locally • Never uploaded</p>
        </div>
    );
}
