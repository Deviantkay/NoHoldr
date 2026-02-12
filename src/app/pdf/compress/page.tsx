"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Upload, FileText, Download, Gauge, AlertTriangle } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { downloadFile, formatBytes } from "@/lib/download-manager";

export default function CompressPDFPage() {
    const [file, setFile] = useState<File | null>(null);
    const [quality, setQuality] = useState([70]);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState("");
    const [result, setResult] = useState<{ original: number; compressed: number; blob: Blob } | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Cleanup blob on unmount / file change
    useEffect(() => {
        return () => {
            if (result) URL.revokeObjectURL(URL.createObjectURL(result.blob));
        };
    }, [result]);

    const handleFile = useCallback(async (f: File) => {
        if (f.type !== "application/pdf") {
            setError("Please upload a PDF file.");
            return;
        }
        if (f.size > 200 * 1024 * 1024) {
            setError("File too large. Maximum 200 MB.");
            return;
        }
        setFile(f);
        setResult(null);
        setError(null);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    }, [handleFile]);

    const compress = async () => {
        if (!file) return;
        setIsProcessing(true);
        setProgress(5);
        setError(null);
        setResult(null);
        setStatusText("Loading PDF...");

        try {
            // Dynamically import pdfjs to avoid SSR issues
            const { pdfjsLib } = await import("@/lib/pdfjs-setup");

            const arrayBuffer = await file.arrayBuffer();
            setProgress(10);
            setStatusText("Parsing PDF structure...");

            const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const numPages = pdfDoc.numPages;
            setStatusText(`Compressing ${numPages} page${numPages > 1 ? "s" : ""}...`);

            // Determine JPEG quality from slider (slider is 10-100, map to 0.1-1.0)
            const jpegQuality = quality[0] / 100;
            // Scale factor — lower quality = slightly lower resolution for more compression
            const scaleFactor = quality[0] <= 30 ? 1.0 : quality[0] <= 60 ? 1.5 : 2.0;

            // Create new PDF from rendered pages
            const newPdf = await PDFDocument.create();

            for (let i = 1; i <= numPages; i++) {
                setProgress(10 + Math.round((i / numPages) * 80));
                setStatusText(`Compressing page ${i} of ${numPages}...`);

                const page = await pdfDoc.getPage(i);
                const viewport = page.getViewport({ scale: scaleFactor });

                // Render to canvas
                const canvas = document.createElement("canvas");
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const ctx = canvas.getContext("2d")!;

                // White background for JPEG
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await page.render({ canvasContext: ctx, viewport } as any).promise;

                // Convert to JPEG bytes at specified quality
                const jpegBlob = await new Promise<Blob>((resolve, reject) => {
                    canvas.toBlob(
                        (blob) => (blob ? resolve(blob) : reject(new Error(`Failed to render page ${i}`))),
                        "image/jpeg",
                        jpegQuality
                    );
                });

                const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
                const jpegImage = await newPdf.embedJpg(jpegBytes);

                // Get original page dimensions to maintain layout
                const origPage = page.getViewport({ scale: 1 });
                const newPage = newPdf.addPage([origPage.width, origPage.height]);
                newPage.drawImage(jpegImage, {
                    x: 0,
                    y: 0,
                    width: origPage.width,
                    height: origPage.height,
                });

                // Free canvas memory
                canvas.width = 0;
                canvas.height = 0;
            }

            setProgress(92);
            setStatusText("Finalizing compressed PDF...");

            const compressedBytes = await newPdf.save({
                useObjectStreams: true,
                addDefaultPage: false,
            });

            const compressedBlob = new Blob([new Uint8Array(compressedBytes).buffer as ArrayBuffer], { type: "application/pdf" });

            setResult({
                original: file.size,
                compressed: compressedBlob.size,
                blob: compressedBlob,
            });

            setProgress(100);
            setStatusText("Done!");
            setTimeout(() => {
                setIsProcessing(false);
                setProgress(0);
                setStatusText("");
            }, 800);
        } catch (err) {
            console.error("Compression failed:", err);
            setError(err instanceof Error ? err.message : "Compression failed. The PDF may be corrupted or encrypted.");
            setIsProcessing(false);
            setProgress(0);
            setStatusText("");
        }
    };

    const handleDownload = () => {
        if (!result || !file) return;
        downloadFile(result.blob, file.name.replace(/\.pdf$/i, "_compressed.pdf"));
    };

    const compressionRatio = result
        ? Math.round((1 - result.compressed / result.original) * 100)
        : 0;

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/pdf"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">Compress PDF</h1>
            </div>

            {error && (
                <div className="border rounded-xl p-4 mb-4 bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                    </div>
                </div>
            )}

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
                                <div><span className="text-sm font-medium">{file.name}</span><p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p></div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => { setFile(null); setResult(null); setError(null); }}>Change</Button>
                        </div>
                    </div>

                    <div className="border rounded-xl p-4 mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium">Quality</label>
                            <span className="text-sm">{quality[0]}%</span>
                        </div>
                        <Slider value={quality} onValueChange={setQuality} min={10} max={100} step={10} disabled={isProcessing} />
                        <p className="text-xs text-muted-foreground mt-2">
                            {quality[0] <= 30 ? "Maximum compression • Reduced clarity" :
                                quality[0] <= 60 ? "Balanced compression • Good clarity" :
                                    "Minimal compression • Best clarity"}
                        </p>
                    </div>

                    <div className="border rounded-xl p-4 mb-4 bg-amber-50/30 dark:bg-amber-950/10 border-amber-200/50 dark:border-amber-800/50">
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                            ⚠️ Compression renders pages as images. Text will no longer be selectable in the output.
                        </p>
                    </div>

                    {result && (
                        <div className="border rounded-xl p-4 mb-4 bg-muted/30">
                            <div className="flex items-center gap-2">
                                <Gauge className="h-4 w-4 text-green-500" />
                                <span className="text-sm">{formatBytes(result.original)} → {formatBytes(result.compressed)}</span>
                                {compressionRatio > 0 ? (
                                    <span className="text-xs text-green-600 font-medium">({compressionRatio}% saved)</span>
                                ) : (
                                    <span className="text-xs text-amber-600">(No size reduction)</span>
                                )}
                            </div>
                        </div>
                    )}

                    {isProcessing && (
                        <div className="mb-4">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>{statusText}</span>
                                <span>{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-1.5" />
                        </div>
                    )}

                    {result ? (
                        <Button onClick={handleDownload} className="w-full h-11">
                            <Download className="h-4 w-4 mr-2" />Download Compressed PDF
                        </Button>
                    ) : (
                        <Button onClick={compress} disabled={isProcessing} className="w-full h-11">
                            {isProcessing ? statusText : <><Download className="h-4 w-4 mr-2" />Compress PDF</>}
                        </Button>
                    )}
                </>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">Processed locally • Pages re-rendered at selected quality</p>
        </div>
    );
}
