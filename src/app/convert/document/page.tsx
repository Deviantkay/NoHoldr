"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, FileText, Download, AlertTriangle, FileType } from "lucide-react";

export default function DocumentConverterPage() {
    const [file, setFile] = useState<File | null>(null);
    const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFile = useCallback((f: File) => {
        setFile(f);
        setConvertedUrl(null);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    }, [handleFile]);

    // Extract text from TXT file
    const convertToText = async () => {
        if (!file) return;

        if (file.type === "text/plain" || file.name.endsWith(".txt")) {
            // Already text, just re-download
            setConvertedUrl(URL.createObjectURL(file));
        } else {
            // For other formats, show limitation
            alert("Only TXT files can be processed in-browser. For PDF/DOCX conversion, use desktop tools.");
        }
    };

    const download = () => {
        if (!convertedUrl || !file) return;
        const a = document.createElement("a");
        a.href = convertedUrl;
        a.download = file.name.replace(/\.[^.]+$/, ".txt");
        a.click();
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/convert"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <div>
                    <h1 className="text-lg font-semibold">Document Converter</h1>
                    <p className="text-xs text-muted-foreground">PDF, DOCX, TXT</p>
                </div>
            </div>

            <div className="border rounded-xl p-4 mb-4 bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                    <div className="text-sm text-muted-foreground">
                        <p className="font-medium text-foreground mb-1">Server-Side Required</p>
                        <p>PDF to DOCX and DOCX to PDF conversion requires server-side processing with libraries like LibreOffice or Pandoc.</p>
                        <p className="mt-2">Recommended desktop tools:</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>LibreOffice (free, cross-platform)</li>
                            <li>Microsoft Word (PDF export)</li>
                            <li>Pandoc (command line)</li>
                            <li>smallpdf.com (online)</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Drop Zone */}
            <div
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors mb-4 ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onDrop={handleDrop}
                onClick={() => document.getElementById("doc-input")?.click()}
            >
                <input type="file" accept=".pdf,.docx,.doc,.txt" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" id="doc-input" />
                <FileText className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm"><span className="font-medium">Drop document</span> <span className="text-muted-foreground">or click</span></p>
                <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, TXT</p>
            </div>

            {file && (
                <div className="border rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-3">
                        <FileType className="h-5 w-5 text-red-500" />
                        <span className="text-sm font-medium flex-1 truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                        {file.type === "text/plain" || file.name.endsWith(".txt")
                            ? "TXT files can be processed locally."
                            : "This format requires server-side processing. Please use the recommended tools above."}
                    </p>
                </div>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">Use desktop tools for full document conversion</p>
        </div>
    );
}
