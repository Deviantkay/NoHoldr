"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Upload, Download, X, File } from "lucide-react";
import JSZip from "jszip";

interface FileItem {
    id: string;
    file: File;
    name: string;
    size: number;
}

export default function CreateZIPPage() {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [zipName, setZipName] = useState("archive");
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        addFiles(Array.from(e.dataTransfer.files));
    }, []);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) addFiles(Array.from(e.target.files));
    }, []);

    const addFiles = (newFiles: File[]) => {
        setFiles(prev => [...prev, ...newFiles.map(f => ({
            id: crypto.randomUUID(),
            file: f,
            name: f.name,
            size: f.size,
        }))]);
    };

    const removeFile = (id: string) => setFiles(files.filter(f => f.id !== id));

    const createZIP = async () => {
        if (files.length === 0) return;
        setIsProcessing(true);
        setProgress(0);

        const zip = new JSZip();

        for (let i = 0; i < files.length; i++) {
            setProgress(Math.round((i / files.length) * 80));
            const arrayBuffer = await files[i].file.arrayBuffer();
            zip.file(files[i].name, arrayBuffer);
        }

        setProgress(90);
        const blob = await zip.generateAsync({ type: "blob" });

        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${zipName}.zip`;
        a.click();

        setProgress(100);
        setTimeout(() => { setIsProcessing(false); setProgress(0); }, 1000);
    };

    const fmt = (b: number) => b < 1024 ? b + " B" : b < 1048576 ? (b / 1024).toFixed(1) + " KB" : (b / 1048576).toFixed(1) + " MB";
    const totalSize = files.reduce((a, f) => a + f.size, 0);

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/files"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">Create ZIP</h1>
            </div>

            <div
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors mb-4 ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-input")?.click()}
            >
                <input type="file" multiple onChange={handleFileSelect} className="hidden" id="file-input" />
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm"><span className="font-medium">Drop files</span> <span className="text-muted-foreground">or tap</span></p>
            </div>

            {files.length > 0 && (
                <>
                    <div className="border rounded-xl p-4 mb-4">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-sm font-medium">{files.length} files • {fmt(totalSize)}</span>
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setFiles([])}>Clear</Button>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {files.map(f => (
                                <div key={f.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm">
                                    <File className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="flex-1 truncate">{f.name}</span>
                                    <span className="text-xs text-muted-foreground">{fmt(f.size)}</span>
                                    <button onClick={() => removeFile(f.id)} className="p-1 rounded hover:bg-muted"><X className="h-3 w-3" /></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                        <Input
                            value={zipName}
                            onChange={(e) => setZipName(e.target.value)}
                            placeholder="archive"
                            className="w-32"
                        />
                        <span className="text-sm text-muted-foreground">.zip</span>
                    </div>

                    {isProcessing && (
                        <div className="mb-4">
                            <Progress value={progress} className="h-1.5" />
                        </div>
                    )}

                    <Button onClick={createZIP} disabled={isProcessing} className="w-full h-11">
                        <Download className="h-4 w-4 mr-2" />Create & Download ZIP
                    </Button>
                </>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">Processed locally</p>
        </div>
    );
}
