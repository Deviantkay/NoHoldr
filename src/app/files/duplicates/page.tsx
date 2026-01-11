"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, File, AlertTriangle, CheckCircle } from "lucide-react";

interface FileInfo {
    name: string;
    size: number;
    hash: string;
}

interface DuplicateGroup {
    hash: string;
    size: number;
    files: string[];
}

export default function FindDuplicatesPage() {
    const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
    const [totalFiles, setTotalFiles] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const hashFile = async (file: File): Promise<string> => {
        const buffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    };

    const findDuplicates = useCallback(async (fileList: File[]) => {
        setIsProcessing(true);
        setTotalFiles(fileList.length);

        const fileInfos: FileInfo[] = [];

        for (const file of fileList) {
            const hash = await hashFile(file);
            fileInfos.push({ name: file.name, size: file.size, hash });
        }

        // Group by hash
        const groups = new Map<string, FileInfo[]>();
        for (const info of fileInfos) {
            const existing = groups.get(info.hash) || [];
            existing.push(info);
            groups.set(info.hash, existing);
        }

        // Filter to only duplicates
        const dups: DuplicateGroup[] = [];
        for (const [hash, files] of groups) {
            if (files.length > 1) {
                dups.push({ hash, size: files[0].size, files: files.map(f => f.name) });
            }
        }

        setDuplicates(dups);
        setIsProcessing(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        findDuplicates(Array.from(e.dataTransfer.files));
    }, [findDuplicates]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) findDuplicates(Array.from(e.target.files));
    }, [findDuplicates]);

    const fmt = (b: number) => b < 1024 ? b + " B" : b < 1048576 ? (b / 1024).toFixed(1) + " KB" : (b / 1048576).toFixed(1) + " MB";

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/files"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">Find Duplicates</h1>
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
                <p className="text-sm"><span className="font-medium">Drop files</span> <span className="text-muted-foreground">to compare</span></p>
            </div>

            {isProcessing && <p className="text-sm text-center mb-4">Analyzing...</p>}

            {totalFiles > 0 && !isProcessing && (
                <div className="border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-4">
                        {duplicates.length > 0 ? (
                            <>
                                <AlertTriangle className="h-5 w-5 text-amber-500" />
                                <span className="text-sm font-medium">{duplicates.length} duplicate groups found</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                <span className="text-sm font-medium">No duplicates in {totalFiles} files</span>
                            </>
                        )}
                    </div>

                    {duplicates.length > 0 && (
                        <div className="space-y-3">
                            {duplicates.map((group, i) => (
                                <div key={i} className="p-3 rounded-lg bg-muted/50">
                                    <div className="text-xs text-muted-foreground mb-2">
                                        {group.files.length} identical files • {fmt(group.size)} each
                                    </div>
                                    <div className="space-y-1">
                                        {group.files.map((name, j) => (
                                            <div key={j} className="flex items-center gap-2 text-sm">
                                                <File className="h-3 w-3 text-muted-foreground" />
                                                <span className="truncate">{name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">Processed locally • Files compared by content hash</p>
        </div>
    );
}
