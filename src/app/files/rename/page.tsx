"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Upload, Download, File, Copy, Check } from "lucide-react";

interface FileItem {
    id: string;
    file: File;
    originalName: string;
    newName: string;
}

export default function BatchRenamePage() {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [prefix, setPrefix] = useState("");
    const [suffix, setSuffix] = useState("");
    const [replace, setReplace] = useState("");
    const [replaceWith, setReplaceWith] = useState("");
    const [isDragging, setIsDragging] = useState(false);

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
            originalName: f.name,
            newName: f.name,
        }))]);
    };

    const applyRename = () => {
        setFiles(files.map(f => {
            const ext = f.originalName.includes(".") ? "." + f.originalName.split(".").pop() : "";
            const baseName = f.originalName.replace(ext, "");

            let newBase = baseName;
            if (replace) newBase = newBase.replaceAll(replace, replaceWith);

            const newName = prefix + newBase + suffix + ext;
            return { ...f, newName };
        }));
    };

    const downloadAll = async () => {
        const JSZip = (await import("jszip")).default;
        const zip = new JSZip();

        for (const f of files) {
            const arrayBuffer = await f.file.arrayBuffer();
            zip.file(f.newName, arrayBuffer);
        }

        const blob = await zip.generateAsync({ type: "blob" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "renamed_files.zip";
        a.click();
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/files"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">Batch Rename</h1>
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
                    <div className="border rounded-xl p-4 mb-4 space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-xs text-muted-foreground">Prefix</label>
                                <Input value={prefix} onChange={e => setPrefix(e.target.value)} placeholder="Add before" className="mt-1" />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground">Suffix</label>
                                <Input value={suffix} onChange={e => setSuffix(e.target.value)} placeholder="Add after" className="mt-1" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-xs text-muted-foreground">Find</label>
                                <Input value={replace} onChange={e => setReplace(e.target.value)} placeholder="Text to replace" className="mt-1" />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground">Replace with</label>
                                <Input value={replaceWith} onChange={e => setReplaceWith(e.target.value)} placeholder="Replacement" className="mt-1" />
                            </div>
                        </div>
                        <Button onClick={applyRename} size="sm">Preview</Button>
                    </div>

                    <div className="border rounded-xl p-4 mb-4">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-sm font-medium">{files.length} files</span>
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setFiles([])}>Clear</Button>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto text-sm">
                            {files.map(f => (
                                <div key={f.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                                    <File className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="truncate text-muted-foreground">{f.originalName}</span>
                                    <span className="text-muted-foreground">→</span>
                                    <span className="truncate font-medium">{f.newName}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Button onClick={downloadAll} className="w-full h-11">
                        <Download className="h-4 w-4 mr-2" />Download Renamed (ZIP)
                    </Button>
                </>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">Processed locally</p>
        </div>
    );
}
