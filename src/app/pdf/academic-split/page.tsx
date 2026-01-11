"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Upload, FileText, Download, Plus, Trash2, GraduationCap, AlertTriangle, CheckCircle2 } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { pdfBytesToBlob } from "@/lib/pdf-utils";
import JSZip from "jszip";

interface Section {
    id: string;
    name: string;
    pageRanges: string;
    isValid: boolean;
    parsedPages: number[];
}

const presetSections = [
    { label: "Judul / Cover", defaultName: "01_JUDUL" },
    { label: "Daftar Isi", defaultName: "02_DAFTAR_ISI" },
    { label: "Abstrak", defaultName: "03_ABSTRAK" },
    { label: "BAB I", defaultName: "04_BAB_I" },
    { label: "BAB II", defaultName: "05_BAB_II" },
    { label: "BAB III", defaultName: "06_BAB_III" },
    { label: "BAB IV", defaultName: "07_BAB_IV" },
    { label: "BAB V", defaultName: "08_BAB_V" },
    { label: "Daftar Pustaka", defaultName: "09_DAFTAR_PUSTAKA" },
    { label: "Lampiran", defaultName: "10_LAMPIRAN" },
    { label: "Custom", defaultName: "SECTION" },
];

export default function AcademicSplitPage() {
    const [file, setFile] = useState<File | null>(null);
    const [pageCount, setPageCount] = useState(0);
    const [sections, setSections] = useState<Section[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState("");

    const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
    const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = Array.from(e.dataTransfer.files).find(f => f.type === "application/pdf");
        if (droppedFile) await loadPdf(droppedFile);
    }, []);

    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) await loadPdf(e.target.files[0]);
    }, []);

    const loadPdf = async (pdfFile: File) => {
        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const pdf = await PDFDocument.load(arrayBuffer);
            setFile(pdfFile);
            setPageCount(pdf.getPageCount());
            setSections([]);
        } catch (error) {
            console.error("Failed to load PDF:", error);
        }
    };

    const parsePageRanges = (input: string): { valid: boolean; pages: number[] } => {
        const pages: number[] = [];
        const normalized = input.toUpperCase().replace(/AND/g, ",");
        const ranges = normalized.split(",").map(r => r.trim()).filter(Boolean);
        for (const range of ranges) {
            if (range.includes("-")) {
                const [start, end] = range.split("-").map(n => parseInt(n.trim(), 10));
                if (isNaN(start) || isNaN(end) || start > end || start < 1 || end > pageCount) return { valid: false, pages: [] };
                for (let i = start; i <= end; i++) if (!pages.includes(i)) pages.push(i);
            } else {
                const page = parseInt(range, 10);
                if (isNaN(page) || page < 1 || page > pageCount) return { valid: false, pages: [] };
                if (!pages.includes(page)) pages.push(page);
            }
        }
        return { valid: pages.length > 0, pages: pages.sort((a, b) => a - b) };
    };

    const addSection = (defaultName: string) => {
        setSections(prev => [...prev, {
            id: Math.random().toString(36).substr(2, 9),
            name: defaultName,
            pageRanges: "",
            isValid: false,
            parsedPages: [],
        }]);
    };

    const updateSection = (id: string, field: "name" | "pageRanges", value: string) => {
        setSections(prev => prev.map(section => {
            if (section.id !== id) return section;
            const updated = { ...section, [field]: value };
            if (field === "pageRanges") {
                const result = parsePageRanges(value);
                updated.isValid = result.valid;
                updated.parsedPages = result.pages;
            }
            return updated;
        }));
    };

    const removeSection = (id: string) => setSections(prev => prev.filter(s => s.id !== id));

    const getOverlaps = (): number[] => {
        const counts: Map<number, number> = new Map();
        sections.forEach(s => s.parsedPages.forEach(p => counts.set(p, (counts.get(p) || 0) + 1)));
        return Array.from(counts.entries()).filter(([_, c]) => c > 1).map(([p]) => p);
    };

    const handleSplit = async () => {
        if (!file || sections.length === 0) return;
        const overlaps = getOverlaps();
        if (overlaps.length > 0) { alert(`Overlapping pages: ${overlaps.join(", ")}`); return; }
        const validSections = sections.filter(s => s.isValid);
        if (validSections.length === 0) { alert("No valid sections"); return; }

        setIsProcessing(true);
        setProgress(0);
        setStatus("Loading PDF...");

        try {
            const arrayBuffer = await file.arrayBuffer();
            const sourcePdf = await PDFDocument.load(arrayBuffer);
            const zip = new JSZip();

            for (let i = 0; i < validSections.length; i++) {
                const section = validSections[i];
                setStatus(`Creating ${section.name}...`);
                setProgress(Math.round((i / validSections.length) * 80));

                const newPdf = await PDFDocument.create();
                const pageIndices = section.parsedPages.map(p => p - 1);
                const pages = await newPdf.copyPages(sourcePdf, pageIndices);
                pages.forEach(page => newPdf.addPage(page));

                const pdfBytes = await newPdf.save();
                const blob = pdfBytesToBlob(pdfBytes);
                zip.file(`${section.name}.pdf`, blob);
            }

            setStatus("Creating ZIP...");
            setProgress(90);

            const zipBlob = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(zipBlob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${file.name.replace(".pdf", "")}_sections.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setProgress(100);
            setStatus("Done!");
            setTimeout(() => { setIsProcessing(false); setProgress(0); setStatus(""); }, 1500);
        } catch (error) {
            console.error("Split failed:", error);
            setStatus("Error: Failed to split PDF");
            setIsProcessing(false);
        }
    };

    const overlaps = getOverlaps();
    const allValid = sections.length > 0 && sections.every(s => s.isValid);

    return (
        <div className="max-w-3xl mx-auto px-4 py-6">
            <div className="flex items-center gap-4 mb-6 border-b pb-4">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/pdf"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-semibold">Academic Split</h1>
                        <Badge variant="secondary" className="text-xs"><GraduationCap className="h-3 w-3 mr-1" />Skripsi</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Split thesis by sections</p>
                </div>
            </div>

            {!file ? (
                <Card className="mb-4">
                    <CardContent className="p-0">
                        <div
                            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById("pdf-upload")?.click()}
                        >
                            <input type="file" accept="application/pdf" onChange={handleFileSelect} className="hidden" id="pdf-upload" />
                            <div className="flex flex-col items-center gap-2">
                                <Upload className="h-6 w-6 text-muted-foreground" />
                                <span className="text-sm"><span className="font-medium">Drop thesis PDF</span> or click</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <Card className="mb-4">
                        <CardContent className="py-3 px-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-red-500" />
                                <div><p className="text-sm font-medium">{file.name}</p><p className="text-xs text-muted-foreground">{pageCount} pages</p></div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => { setFile(null); setSections([]); }}>Change</Button>
                        </CardContent>
                    </Card>

                    <Card className="mb-4">
                        <CardContent className="p-4">
                            <Label className="text-sm font-medium mb-2 block">Add Section</Label>
                            <div className="flex flex-wrap gap-2">
                                {presetSections.map(p => (
                                    <Button key={p.label} variant="outline" size="sm" onClick={() => addSection(p.defaultName)}>
                                        <Plus className="h-3 w-3 mr-1" />{p.label}
                                    </Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {sections.length > 0 && (
                        <Card className="mb-4">
                            <CardContent className="p-4 space-y-3">
                                {sections.map((section) => (
                                    <div key={section.id} className="flex gap-2 items-start p-3 rounded border bg-muted/30">
                                        <div className="flex-1 grid grid-cols-2 gap-2">
                                            <div>
                                                <Label className="text-xs">Filename</Label>
                                                <Input value={section.name} onChange={e => updateSection(section.id, "name", e.target.value)} className="mt-1 h-8 text-sm" />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Pages <span className="text-muted-foreground font-normal">(use AND for multiple ranges)</span></Label>
                                                <Input
                                                    value={section.pageRanges}
                                                    onChange={e => updateSection(section.id, "pageRanges", e.target.value)}
                                                    className={`mt-1 h-8 text-sm ${section.pageRanges && !section.isValid ? "border-destructive" : ""}`}
                                                    placeholder="1-3 AND 6-9"
                                                />
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeSection(section.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                                <div className="pt-2 border-t">
                                    {overlaps.length > 0 && (
                                        <div className="flex items-center gap-2 text-destructive text-sm">
                                            <AlertTriangle className="h-4 w-4" /><span>Overlapping: {overlaps.join(", ")}</span>
                                        </div>
                                    )}
                                    {allValid && overlaps.length === 0 && (
                                        <div className="flex items-center gap-2 text-green-600 text-sm">
                                            <CheckCircle2 className="h-4 w-4" /><span>All sections valid</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {isProcessing && (
                        <Card className="mb-4">
                            <CardContent className="py-3 px-4">
                                <div className="flex justify-between text-sm mb-2"><span>{status}</span><span>{progress}%</span></div>
                                <Progress value={progress} className="h-2" />
                            </CardContent>
                        </Card>
                    )}

                    <div className="flex justify-end">
                        <Button onClick={handleSplit} disabled={!allValid || overlaps.length > 0 || isProcessing}>
                            <Download className="h-4 w-4 mr-2" />Split & Download ZIP
                        </Button>
                    </div>
                </>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">Files processed locally • Never uploaded</p>
        </div>
    );
}
