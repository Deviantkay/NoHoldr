"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Upload, FileText, Download, Hash } from "lucide-react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { downloadPdfBytes } from "@/lib/pdf-utils";

export default function PageNumbersPDFPage() {
    const [file, setFile] = useState<File | null>(null);
    const [pageCount, setPageCount] = useState(0);
    const [position, setPosition] = useState<"bottom" | "top">("bottom");
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

    const addPageNumbers = async () => {
        if (!file) return;
        setIsProcessing(true);
        setProgress(20);

        const pdf = await PDFDocument.load(await file.arrayBuffer());
        const font = await pdf.embedFont(StandardFonts.Helvetica);
        setProgress(40);

        const pages = pdf.getPages();
        const total = pages.length;

        for (let i = 0; i < pages.length; i++) {
            setProgress(40 + Math.round((i / pages.length) * 40));
            const page = pages[i];
            const { width, height } = page.getSize();
            const text = `${i + 1} / ${total}`;
            const textWidth = font.widthOfTextAtSize(text, 10);

            page.drawText(text, {
                x: (width - textWidth) / 2,
                y: position === "bottom" ? 20 : height - 30,
                size: 10,
                font,
                color: rgb(0.3, 0.3, 0.3),
            });
        }

        setProgress(90);
        const bytes = await pdf.save();
        downloadPdfBytes(bytes, file.name.replace(".pdf", "_numbered.pdf"));

        setProgress(100);
        setTimeout(() => { setIsProcessing(false); setProgress(0); }, 1000);
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/pdf"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">Add Page Numbers</h1>
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
                        <label className="text-sm font-medium mb-3 block">Position</label>
                        <div className="flex gap-2">
                            <Button variant={position === "bottom" ? "default" : "outline"} onClick={() => setPosition("bottom")} className="flex-1">Bottom</Button>
                            <Button variant={position === "top" ? "default" : "outline"} onClick={() => setPosition("top")} className="flex-1">Top</Button>
                        </div>
                    </div>

                    {isProcessing && <Progress value={progress} className="h-1.5 mb-4" />}

                    <Button onClick={addPageNumbers} disabled={isProcessing} className="w-full h-11">
                        <Hash className="h-4 w-4 mr-2" />Add Numbers & Download
                    </Button>
                </>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">Processed locally</p>
        </div>
    );
}
