"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Upload, FileText, Download, GripVertical, ArrowUp, ArrowDown, RotateCcw } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { downloadFile, formatBytes } from "@/lib/download-manager";

interface PageItem {
    index: number;       // original page index (0-based)
    label: string;       // display label
    thumbnail?: string;  // data URL of thumbnail
}

export default function ReorderPagesPage() {
    const [file, setFile] = useState<File | null>(null);
    const [pages, setPages] = useState<PageItem[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState("");
    const [isLoadingThumbs, setIsLoadingThumbs] = useState(false);
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const handleFile = useCallback(async (f: File) => {
        if (f.type !== "application/pdf") return;
        setFile(f);
        setIsLoadingThumbs(true);

        try {
            const { pdfjsLib } = await import("@/lib/pdfjs-setup");
            const pdf = await pdfjsLib.getDocument({ data: await f.arrayBuffer() }).promise;
            const numPages = pdf.numPages;
            const items: PageItem[] = [];

            for (let i = 1; i <= numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 0.3 });

                const canvas = document.createElement("canvas");
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const ctx = canvas.getContext("2d")!;
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await page.render({ canvasContext: ctx, viewport } as any).promise;

                items.push({
                    index: i - 1,
                    label: `Page ${i}`,
                    thumbnail: canvas.toDataURL("image/jpeg", 0.6),
                });

                canvas.width = 0;
                canvas.height = 0;
            }

            setPages(items);
        } catch (err) {
            console.error("Failed to load PDF:", err);
        }

        setIsLoadingThumbs(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    }, [handleFile]);

    // Drag-and-drop reorder
    const handleDragStart = (index: number) => {
        dragItem.current = index;
    };

    const handleDragEnter = (index: number) => {
        dragOverItem.current = index;
    };

    const handleDragEnd = () => {
        if (dragItem.current === null || dragOverItem.current === null) return;
        const copy = [...pages];
        const [removed] = copy.splice(dragItem.current, 1);
        copy.splice(dragOverItem.current, 0, removed);
        setPages(copy);
        dragItem.current = null;
        dragOverItem.current = null;
    };

    // Move page up/down
    const movePage = (from: number, to: number) => {
        if (to < 0 || to >= pages.length) return;
        const copy = [...pages];
        const [item] = copy.splice(from, 1);
        copy.splice(to, 0, item);
        setPages(copy);
    };

    // Reset to original order
    const resetOrder = () => {
        const sorted = [...pages].sort((a, b) => a.index - b.index);
        setPages(sorted);
    };

    // Check if order changed
    const hasChanges = pages.some((p, i) => p.index !== i);

    const handleReorder = async () => {
        if (!file || !hasChanges) return;
        setIsProcessing(true);
        setProgress(10);
        setStatusText("Loading PDF...");

        try {
            const source = await PDFDocument.load(await file.arrayBuffer());
            setProgress(30);
            setStatusText("Re-ordering pages...");

            const newDoc = await PDFDocument.create();
            const newOrder = pages.map((p) => p.index);

            const copiedPages = await newDoc.copyPages(source, newOrder);
            copiedPages.forEach((page) => newDoc.addPage(page));

            setProgress(80);
            setStatusText("Saving...");

            const bytes = await newDoc.save();
            const blob = new Blob([new Uint8Array(bytes).buffer as ArrayBuffer], { type: "application/pdf" });
            downloadFile(blob, file.name.replace(/\.pdf$/i, "_reordered.pdf"));

            setProgress(100);
            setStatusText("Done!");
            setTimeout(() => {
                setIsProcessing(false);
                setProgress(0);
                setStatusText("");
            }, 800);
        } catch (err) {
            console.error("Reorder failed:", err);
            setIsProcessing(false);
            setProgress(0);
            setStatusText("");
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/pdf"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">Re-order Pages</h1>
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
                    {/* File info */}
                    <div className="border rounded-xl p-4 mb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-red-500" />
                                <div>
                                    <span className="text-sm font-medium">{file.name}</span>
                                    <p className="text-xs text-muted-foreground">{pages.length} pages • {formatBytes(file.size)}</p>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                {hasChanges && (
                                    <Button variant="ghost" size="sm" onClick={resetOrder}>
                                        <RotateCcw className="h-3 w-3 mr-1" />Reset
                                    </Button>
                                )}
                                <Button variant="ghost" size="sm" onClick={() => { setFile(null); setPages([]); }}>Change</Button>
                            </div>
                        </div>
                    </div>

                    {/* Loading thumbnails */}
                    {isLoadingThumbs && (
                        <div className="text-center py-8">
                            <p className="text-sm text-muted-foreground">Rendering page thumbnails...</p>
                        </div>
                    )}

                    {/* Sortable page list */}
                    {pages.length > 0 && !isLoadingThumbs && (
                        <div className="border rounded-xl overflow-hidden mb-4">
                            <div className="p-2 space-y-1 max-h-[60vh] overflow-y-auto">
                                {pages.map((page, i) => (
                                    <div
                                        key={`${page.index}-${i}`}
                                        className="flex items-center gap-3 p-2 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors cursor-grab active:cursor-grabbing"
                                        draggable
                                        onDragStart={() => handleDragStart(i)}
                                        onDragEnter={() => handleDragEnter(i)}
                                        onDragEnd={handleDragEnd}
                                        onDragOver={(e) => e.preventDefault()}
                                    >
                                        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />

                                        {page.thumbnail && (
                                            <img
                                                src={page.thumbnail}
                                                alt={page.label}
                                                className="h-16 w-12 object-cover rounded border bg-white shrink-0"
                                            />
                                        )}

                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium">{page.label}</p>
                                            {page.index !== i && (
                                                <p className="text-xs text-blue-600 dark:text-blue-400">
                                                    Originally page {page.index + 1} → now position {i + 1}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex gap-0.5 shrink-0">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => movePage(i, i - 1)} disabled={i === 0}>
                                                <ArrowUp className="h-3 w-3" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => movePage(i, i + 1)} disabled={i === pages.length - 1}>
                                                <ArrowDown className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
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

                    {/* Action */}
                    <Button onClick={handleReorder} disabled={isProcessing || !hasChanges} className="w-full h-11">
                        <Download className="h-4 w-4 mr-2" />
                        {hasChanges ? "Save Re-ordered PDF" : "Drag pages to re-order"}
                    </Button>
                </>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">Drag & drop to re-order • Processed locally</p>
        </div>
    );
}
