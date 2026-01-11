"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, Download, File, FolderArchive } from "lucide-react";
import JSZip from "jszip";

interface ExtractedFile {
    name: string;
    blob: Blob;
    size: number;
}

export default function ExtractZIPPage() {
    const [files, setFiles] = useState<ExtractedFile[]>([]);
    const [zipName, setZipName] = useState("");
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFile = useCallback(async (file: File) => {
        if (!file.name.endsWith(".zip")) return;

        setIsProcessing(true);
        setZipName(file.name);

        try {
            const zip = await JSZip.loadAsync(file);
            const extracted: ExtractedFile[] = [];

            for (const [name, zipEntry] of Object.entries(zip.files)) {
                if (!zipEntry.dir) {
                    const blob = await zipEntry.async("blob");
                    extracted.push({ name, blob, size: blob.size });
                }
            }

            setFiles(extracted);
        } catch (e) {
            console.error("Failed to extract:", e);
        }

        setIsProcessing(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }, [handleFile]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) handleFile(e.target.files[0]);
    }, [handleFile]);

    const downloadFile = (file: ExtractedFile) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(file.blob);
        a.download = file.name.split("/").pop() || file.name;
        a.click();
    };

    const downloadAll = async () => {
        const zip = new JSZip();
        files.forEach(f => zip.file(f.name, f.blob));
        const blob = await zip.generateAsync({ type: "blob" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = zipName.replace(".zip", "_extracted.zip");
        a.click();
    };

    const fmt = (b: number) => b < 1024 ? b + " B" : b < 1048576 ? (b / 1024).toFixed(1) + " KB" : (b / 1048576).toFixed(1) + " MB";

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/files"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">Extract ZIP</h1>
            </div>

            {files.length === 0 ? (
                <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById("zip-input")?.click()}
                >
                    <input type="file" accept=".zip" onChange={handleFileSelect} className="hidden" id="zip-input" />
                    <FolderArchive className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm"><span className="font-medium">Drop ZIP</span> <span className="text-muted-foreground">or tap</span></p>
                </div>
            ) : (
                <>
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium">{zipName} • {files.length} files</span>
                        <Button variant="ghost" size="sm" onClick={() => setFiles([])}>Change</Button>
                    </div>

                    <div className="border rounded-xl p-4 mb-4">
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {files.map((f, i) => (
                                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm">
                                    <File className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="flex-1 truncate">{f.name}</span>
                                    <span className="text-xs text-muted-foreground">{fmt(f.size)}</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => downloadFile(f)}>
                                        <Download className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Button onClick={downloadAll} className="w-full h-11">
                        <Download className="h-4 w-4 mr-2" />Download All
                    </Button>
                </>
            )}

            {isProcessing && <p className="text-sm text-center mt-4">Extracting...</p>}

            <p className="text-xs text-muted-foreground text-center mt-6">Processed locally</p>
        </div>
    );
}
