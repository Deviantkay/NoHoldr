"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Upload, FileText, Download, Image, PackageOpen, AlertTriangle } from "lucide-react";
import { downloadFile, downloadAsZip, formatBytes } from "@/lib/download-manager";

interface PageResult {
    name: string;
    blob: Blob;
    size: number;
}

export default function PDFToImagesPage() {
    const [file, setFile] = useState<File | null>(null);
    const [pageCount, setPageCount] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState("");
    const [format, setFormat] = useState("image/jpeg");
    const [quality, setQuality] = useState([85]);
    const [scale, setScale] = useState("2");
    const [results, setResults] = useState<PageResult[]>([]);
    const [error, setError] = useState<string | null>(null);

    const formatExt = format === "image/jpeg" ? "jpg" : format === "image/png" ? "png" : "webp";

    const handleFile = useCallback(async (f: File) => {
        if (f.type !== "application/pdf") {
            setError("Please upload a PDF file.");
            return;
        }
        setError(null);
        setResults([]);

        try {
            const { PDFDocument } = await import("pdf-lib");
            const pdf = await PDFDocument.load(await f.arrayBuffer());
            setFile(f);
            setPageCount(pdf.getPageCount());
        } catch {
            setError("Could not read PDF. File may be corrupted or encrypted.");
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    }, [handleFile]);

    const convert = async () => {
        if (!file) return;
        setIsProcessing(true);
        setProgress(5);
        setError(null);
        setResults([]);
        setStatusText("Loading PDF renderer...");

        try {
            const { pdfjsLib } = await import("@/lib/pdfjs-setup");
            setProgress(10);

            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const numPages = pdf.numPages;
            const baseName = file.name.replace(/\.pdf$/i, "");
            const scaleNum = parseFloat(scale);
            const jpegQuality = quality[0] / 100;
            const pageResults: PageResult[] = [];

            for (let i = 1; i <= numPages; i++) {
                setProgress(10 + Math.round((i / numPages) * 85));
                setStatusText(`Rendering page ${i} of ${numPages}...`);

                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: scaleNum });

                const canvas = document.createElement("canvas");
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const ctx = canvas.getContext("2d")!;

                // White background for JPEG
                if (format === "image/jpeg") {
                    ctx.fillStyle = "#ffffff";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await page.render({ canvasContext: ctx, viewport } as any).promise;

                const blob = await new Promise<Blob>((resolve, reject) => {
                    canvas.toBlob(
                        (b) => (b ? resolve(b) : reject(new Error(`Failed to render page ${i}`))),
                        format,
                        format !== "image/png" ? jpegQuality : undefined
                    );
                });

                const pageName = numPages === 1
                    ? `${baseName}.${formatExt}`
                    : `${baseName}_page${i}.${formatExt}`;

                pageResults.push({ name: pageName, blob, size: blob.size });

                // Free canvas memory
                canvas.width = 0;
                canvas.height = 0;
            }

            setResults(pageResults);
            setProgress(100);
            setStatusText("Done!");
            setTimeout(() => {
                setIsProcessing(false);
                setProgress(0);
                setStatusText("");
            }, 800);
        } catch (err) {
            console.error("PDF to images failed:", err);
            setError(err instanceof Error ? err.message : "Conversion failed. The PDF may be corrupted or password-protected.");
            setIsProcessing(false);
            setProgress(0);
            setStatusText("");
        }
    };

    const handleDownloadSingle = (item: PageResult) => {
        downloadFile(item.blob, item.name);
    };

    const handleDownloadAllZip = async () => {
        if (results.length === 0 || !file) return;
        const baseName = file.name.replace(/\.pdf$/i, "");
        await downloadAsZip(
            results.map((r) => ({ name: r.name, blob: r.blob })),
            `${baseName}_images.zip`
        );
    };

    const handleDownloadAllIndividual = async () => {
        if (results.length === 0) return;
        const { downloadMultipleFiles } = await import("@/lib/download-manager");
        await downloadMultipleFiles(results.map((r) => ({ name: r.name, blob: r.blob })));
    };

    const totalSize = results.reduce((a, r) => a + r.size, 0);

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/pdf"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">PDF to Images</h1>
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
                    {/* File Info */}
                    <div className="border rounded-xl p-4 mb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-red-500" />
                                <div>
                                    <span className="text-sm font-medium">{file.name}</span>
                                    <p className="text-xs text-muted-foreground">{pageCount} page{pageCount > 1 ? "s" : ""}</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => { setFile(null); setResults([]); setError(null); setPageCount(0); }}>Change</Button>
                        </div>
                    </div>

                    {/* Options */}
                    {results.length === 0 && (
                        <div className="border rounded-xl p-4 mb-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">Format</label>
                                <Select value={format} onValueChange={setFormat}>
                                    <SelectTrigger className="w-28">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="image/jpeg">JPG</SelectItem>
                                        <SelectItem value="image/png">PNG</SelectItem>
                                        <SelectItem value="image/webp">WebP</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {format !== "image/png" && (
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-medium">Quality</label>
                                        <span className="text-sm">{quality[0]}%</span>
                                    </div>
                                    <Slider value={quality} onValueChange={setQuality} min={10} max={100} step={5} />
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">Resolution</label>
                                <Select value={scale} onValueChange={setScale}>
                                    <SelectTrigger className="w-28">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1x (72 DPI)</SelectItem>
                                        <SelectItem value="2">2x (144 DPI)</SelectItem>
                                        <SelectItem value="3">3x (216 DPI)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {/* Progress */}
                    {isProcessing && (
                        <div className="mb-4">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>{statusText}</span>
                                <span>{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-1.5" />
                        </div>
                    )}

                    {/* Results */}
                    {results.length > 0 && (
                        <div className="border rounded-xl p-4 mb-4">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium">
                                    {results.length} image{results.length > 1 ? "s" : ""} • {formatBytes(totalSize)}
                                </span>
                            </div>

                            {/* Download options for multiple files */}
                            {results.length > 1 && (
                                <div className="flex gap-2 mb-3">
                                    <Button onClick={handleDownloadAllZip} size="sm" className="flex-1">
                                        <PackageOpen className="h-4 w-4 mr-2" />Download as ZIP
                                    </Button>
                                    <Button onClick={handleDownloadAllIndividual} size="sm" variant="outline" className="flex-1">
                                        <Download className="h-4 w-4 mr-2" />Download All
                                    </Button>
                                </div>
                            )}

                            {/* Individual file list */}
                            <div className="space-y-1.5 max-h-60 overflow-y-auto">
                                {results.map((item, i) => (
                                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm">
                                        <Image className="h-4 w-4 text-blue-500 shrink-0" />
                                        <span className="flex-1 truncate">{item.name}</span>
                                        <span className="text-xs text-muted-foreground">{formatBytes(item.size)}</span>
                                        <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => handleDownloadSingle(item)}>
                                            <Download className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action */}
                    {results.length === 0 && (
                        <Button onClick={convert} disabled={isProcessing} className="w-full h-11">
                            {isProcessing ? statusText : (
                                <><Image className="h-4 w-4 mr-2" />Convert to {formatExt.toUpperCase()}</>
                            )}
                        </Button>
                    )}

                    {results.length > 0 && results.length === 1 && (
                        <Button onClick={() => handleDownloadSingle(results[0])} className="w-full h-11">
                            <Download className="h-4 w-4 mr-2" />Download Image
                        </Button>
                    )}

                    {results.length > 0 && (
                        <Button variant="ghost" onClick={() => { setResults([]); }} className="w-full mt-2">
                            Convert Again
                        </Button>
                    )}
                </>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">Processed locally • PDF rendered via PDF.js</p>
        </div>
    );
}
