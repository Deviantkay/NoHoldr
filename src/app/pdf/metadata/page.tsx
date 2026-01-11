"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Upload, FileText, Eye } from "lucide-react";
import { PDFDocument } from "pdf-lib";

interface PDFMetadata {
    title: string | undefined;
    author: string | undefined;
    subject: string | undefined;
    creator: string | undefined;
    producer: string | undefined;
    creationDate: Date | undefined;
    modificationDate: Date | undefined;
    pageCount: number;
    keywords: string | undefined;
}

export default function PDFMetadataPage() {
    const [file, setFile] = useState<File | null>(null);
    const [metadata, setMetadata] = useState<PDFMetadata | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFile = useCallback(async (f: File) => {
        if (f.type !== "application/pdf") return;
        const pdf = await PDFDocument.load(await f.arrayBuffer());
        setFile(f);
        setMetadata({
            title: pdf.getTitle(),
            author: pdf.getAuthor(),
            subject: pdf.getSubject(),
            creator: pdf.getCreator(),
            producer: pdf.getProducer(),
            creationDate: pdf.getCreationDate(),
            modificationDate: pdf.getModificationDate(),
            pageCount: pdf.getPageCount(),
            keywords: pdf.getKeywords(),
        });
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    }, [handleFile]);

    const formatDate = (date: Date | undefined) => date ? date.toLocaleString() : "—";

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/pdf"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">View PDF Metadata</h1>
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
            ) : metadata && (
                <>
                    <div className="border rounded-xl p-4 mb-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-red-500" />
                                <span className="text-sm font-medium">{file.name}</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => { setFile(null); setMetadata(null); }}>Change</Button>
                        </div>

                        <div className="space-y-3 text-sm">
                            <div className="grid grid-cols-3 gap-2 p-2 rounded bg-muted/30">
                                <span className="text-muted-foreground">Title</span>
                                <span className="col-span-2 font-medium">{metadata.title || "—"}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 p-2 rounded bg-muted/30">
                                <span className="text-muted-foreground">Author</span>
                                <span className="col-span-2 font-medium">{metadata.author || "—"}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 p-2 rounded bg-muted/30">
                                <span className="text-muted-foreground">Subject</span>
                                <span className="col-span-2 font-medium">{metadata.subject || "—"}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 p-2 rounded bg-muted/30">
                                <span className="text-muted-foreground">Creator</span>
                                <span className="col-span-2 font-medium">{metadata.creator || "—"}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 p-2 rounded bg-muted/30">
                                <span className="text-muted-foreground">Producer</span>
                                <span className="col-span-2 font-medium">{metadata.producer || "—"}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 p-2 rounded bg-muted/30">
                                <span className="text-muted-foreground">Pages</span>
                                <span className="col-span-2 font-medium">{metadata.pageCount}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 p-2 rounded bg-muted/30">
                                <span className="text-muted-foreground">Created</span>
                                <span className="col-span-2 font-medium">{formatDate(metadata.creationDate)}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 p-2 rounded bg-muted/30">
                                <span className="text-muted-foreground">Modified</span>
                                <span className="col-span-2 font-medium">{formatDate(metadata.modificationDate)}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 p-2 rounded bg-muted/30">
                                <span className="text-muted-foreground">Keywords</span>
                                <span className="col-span-2 font-medium">{metadata.keywords || "—"}</span>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">Processed locally</p>
        </div>
    );
}
