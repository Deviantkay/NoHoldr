"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Upload, FileText, Lock, AlertTriangle } from "lucide-react";

export default function ProtectPDFPage() {
    const [file, setFile] = useState<File | null>(null);
    const [password, setPassword] = useState("");
    const [isDragging, setIsDragging] = useState(false);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const f = e.dataTransfer.files[0];
        if (f?.type === "application/pdf") setFile(f);
    }, []);

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/pdf"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">Protect PDF</h1>
            </div>

            <div className="border rounded-xl p-4 mb-4 bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                    <div className="text-sm text-muted-foreground">
                        <p className="font-medium text-foreground mb-1">Browser Limitation</p>
                        <p>PDF password encryption requires specialized libraries that aren't available in browser environments for security reasons.</p>
                        <p className="mt-2">To password-protect a PDF, use:</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>Adobe Acrobat Pro</li>
                            <li>PDF24 Tools (desktop)</li>
                            <li>LibreOffice Draw</li>
                        </ul>
                    </div>
                </div>
            </div>

            {!file ? (
                <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById("pdf-input")?.click()}
                >
                    <input type="file" accept="application/pdf" onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])} className="hidden" id="pdf-input" />
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm"><span className="font-medium">Drop PDF to protect</span></p>
                </div>
            ) : (
                <div className="border rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-red-500" />
                            <span className="text-sm font-medium">{file.name}</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setFile(null)}>Change</Button>
                    </div>
                </div>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">Use desktop tools for PDF encryption</p>
        </div>
    );
}
