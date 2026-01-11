"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Upload, FileText, Download, Type } from "lucide-react";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import { downloadPdfBytes } from "@/lib/pdf-utils";

export default function WatermarkPDFPage() {
    const [file, setFile] = useState<File | null>(null);
    const [pageCount, setPageCount] = useState(0);
    const [text, setText] = useState("CONFIDENTIAL");
    const [opacity, setOpacity] = useState([30]);
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

    const addWatermark = async () => {
        if (!file || !text.trim()) return;
        setIsProcessing(true);
        setProgress(20);

        const pdf = await PDFDocument.load(await file.arrayBuffer());
        const font = await pdf.embedFont(StandardFonts.HelveticaBold);
        setProgress(40);

        const pages = pdf.getPages();
        const alpha = opacity[0] / 100;

        for (let i = 0; i < pages.length; i++) {
            setProgress(40 + Math.round((i / pages.length) * 40));
            const page = pages[i];
            const { width, height } = page.getSize();
            const fontSize = Math.min(width, height) / 10;
            const textWidth = font.widthOfTextAtSize(text, fontSize);

            page.drawText(text, {
                x: (width - textWidth) / 2,
                y: height / 2,
                size: fontSize,
                font,
                color: rgb(0.5, 0.5, 0.5),
                opacity: alpha,
                rotate: degrees(-45),
            });
        }

        setProgress(90);
        const bytes = await pdf.save();
        downloadPdfBytes(bytes, file.name.replace(".pdf", "_watermarked.pdf"));

        setProgress(100);
        setTimeout(() => { setIsProcessing(false); setProgress(0); }, 1000);
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/pdf"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">Add Watermark</h1>
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

                    <div className="border rounded-xl p-4 mb-4 space-y-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Watermark Text</label>
                            <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="CONFIDENTIAL" />
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-medium">Opacity</label>
                                <span className="text-sm">{opacity[0]}%</span>
                            </div>
                            <Slider value={opacity} onValueChange={setOpacity} min={10} max={80} step={5} />
                        </div>
                    </div>

                    {isProcessing && <Progress value={progress} className="h-1.5 mb-4" />}

                    <Button onClick={addWatermark} disabled={isProcessing || !text.trim()} className="w-full h-11">
                        <Type className="h-4 w-4 mr-2" />Add Watermark & Download
                    </Button>
                </>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">Processed locally</p>
        </div>
    );
}
