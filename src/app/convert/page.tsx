"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
    Upload, FileText, Image, Music, Video, FileArchive, Database,
    AlertCircle, X, Download, Loader2, ArrowLeft, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { detectFileType, formatFileSize, type DetectedFile, type FileCategory } from "@/lib/file-detector";

interface TargetFormat {
    id: string;
    format: string;
    description: string;
    mimeType: string;
    extension: string;
}

interface FormatGroup {
    name: string;
    icon: typeof Image;
    formats: TargetFormat[];
}

const CATEGORY_ICONS: Record<FileCategory, typeof Image> = {
    image: Image, pdf: FileText, document: FileText, audio: Music,
    video: Video, archive: FileArchive, data: Database, unsupported: AlertCircle,
};

const CATEGORY_COLORS: Record<FileCategory, string> = {
    image: "text-blue-500 bg-blue-50 dark:bg-blue-950/30",
    pdf: "text-red-500 bg-red-50 dark:bg-red-950/30",
    document: "text-purple-500 bg-purple-50 dark:bg-purple-950/30",
    audio: "text-green-500 bg-green-50 dark:bg-green-950/30",
    video: "text-orange-500 bg-orange-50 dark:bg-orange-950/30",
    archive: "text-amber-500 bg-amber-50 dark:bg-amber-950/30",
    data: "text-cyan-500 bg-cyan-50 dark:bg-cyan-950/30",
    unsupported: "text-gray-500 bg-gray-50 dark:bg-gray-950/30",
};

const IMAGE_FORMATS: TargetFormat[] = [
    { id: "jpg", format: "JPG", description: "Lossy, smaller size", mimeType: "image/jpeg", extension: "jpg" },
    { id: "png", format: "PNG", description: "Lossless, transparency", mimeType: "image/png", extension: "png" },
    { id: "webp", format: "WEBP", description: "Modern, efficient", mimeType: "image/webp", extension: "webp" },
];

const DOCUMENT_FORMATS: TargetFormat[] = [
    { id: "pdf", format: "PDF", description: "Universal document", mimeType: "application/pdf", extension: "pdf" },
];

const AUDIO_FORMATS: TargetFormat[] = [
    { id: "wav", format: "WAV", description: "Uncompressed audio", mimeType: "audio/wav", extension: "wav" },
];

const VIDEO_FORMATS: TargetFormat[] = [
    { id: "webm", format: "WEBM", description: "Browser-native", mimeType: "video/webm", extension: "webm" },
];

const DATA_FORMATS: TargetFormat[] = [
    { id: "json", format: "JSON", description: "Structured data", mimeType: "application/json", extension: "json" },
    { id: "csv", format: "CSV", description: "Tabular data", mimeType: "text/csv", extension: "csv" },
];

const CATEGORY_FORMAT_GROUPS: Record<FileCategory, FormatGroup[]> = {
    image: [
        { name: "Image", icon: Image, formats: IMAGE_FORMATS },
        { name: "Document", icon: FileText, formats: DOCUMENT_FORMATS },
    ],
    pdf: [
        { name: "Image", icon: Image, formats: IMAGE_FORMATS },
    ],
    document: [
        { name: "Document", icon: FileText, formats: DOCUMENT_FORMATS },
    ],
    audio: [{ name: "Audio", icon: Music, formats: AUDIO_FORMATS }],
    video: [
        { name: "Video", icon: Video, formats: VIDEO_FORMATS },
        { name: "Image", icon: Image, formats: [IMAGE_FORMATS[0], IMAGE_FORMATS[1]] },
    ],
    data: [{ name: "Data", icon: Database, formats: DATA_FORMATS }],
    archive: [],
    unsupported: [],
};

export default function SmartConvertPage() {
    const [detectedFile, setDetectedFile] = useState<DetectedFile | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFormat, setSelectedFormat] = useState<TargetFormat | null>(null);
    const [isConverting, setIsConverting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [convertedBlobs, setConvertedBlobs] = useState<{ name: string; blob: Blob }[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [warning, setWarning] = useState<string | null>(null);

    const handleFile = useCallback((file: File) => {
        setDetectedFile(detectFileType(file));
        setSelectedFormat(null);
        setConvertedBlobs([]);
        setError(null);
        setWarning(null);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    }, [handleFile]);

    const clearFile = () => {
        setDetectedFile(null);
        setSelectedFormat(null);
        setConvertedBlobs([]);
        setError(null);
        setWarning(null);
    };

    const convert = async () => {
        if (!detectedFile || !selectedFormat) return;
        setIsConverting(true);
        setProgress(10);
        setError(null);
        setWarning(null);
        setConvertedBlobs([]);

        try {
            const file = detectedFile.file;
            const results: { name: string; blob: Blob }[] = [];

            // Image conversions
            if (detectedFile.category === "image") {
                if (["jpg", "png", "webp"].includes(selectedFormat.id)) {
                    const blob = await convertImage(file, selectedFormat.mimeType);
                    results.push({ name: file.name.replace(/\.[^.]+$/, `.${selectedFormat.extension}`), blob });
                } else if (selectedFormat.id === "pdf") {
                    const blob = await imageToPdf(file);
                    results.push({ name: file.name.replace(/\.[^.]+$/, ".pdf"), blob });
                }
            }
            // PDF to Image
            else if (detectedFile.category === "pdf" && ["jpg", "png", "webp"].includes(selectedFormat.id)) {
                const pages = await pdfToImages(file, selectedFormat.mimeType, selectedFormat.extension);
                results.push(...pages);
                if (pages.length > 1) {
                    setWarning(`Converted ${pages.length} pages. Download each page individually.`);
                }
            }
            // Document to PDF
            else if (detectedFile.category === "document" && selectedFormat.id === "pdf") {
                const blob = await documentToPdf(file);
                results.push({ name: file.name.replace(/\.[^.]+$/, ".pdf"), blob });
                setWarning("Layout may differ from original. Complex formatting, fonts, and images may not render perfectly.");
            }
            // Audio to WAV
            else if (detectedFile.category === "audio" && selectedFormat.id === "wav") {
                const blob = await convertAudioToWav(file);
                results.push({ name: file.name.replace(/\.[^.]+$/, ".wav"), blob });
            }
            // Video to WebM
            else if (detectedFile.category === "video" && selectedFormat.id === "webm") {
                setWarning("Video transcoding is resource-intensive. This may take a while.");
                const blob = await convertVideoToWebm(file);
                results.push({ name: file.name.replace(/\.[^.]+$/, ".webm"), blob });
            }
            // Video to Image (frame extraction)
            else if (detectedFile.category === "video" && ["jpg", "png"].includes(selectedFormat.id)) {
                const blob = await extractVideoFrame(file, selectedFormat.mimeType);
                results.push({ name: file.name.replace(/\.[^.]+$/, `-frame.${selectedFormat.extension}`), blob });
            }
            // Data conversions
            else if (detectedFile.category === "data") {
                const blob = await convertData(file, selectedFormat.id);
                results.push({ name: file.name.replace(/\.[^.]+$/, `.${selectedFormat.extension}`), blob });
            }
            else {
                throw new Error("Conversion not supported");
            }

            setProgress(100);
            setConvertedBlobs(results);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Conversion failed");
        }
        setIsConverting(false);
    };

    // === Conversion Functions ===

    const convertImage = async (file: File, targetMime: string): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const img = new window.Image();
            img.onload = () => {
                setProgress(50);
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                if (!ctx) { reject(new Error("Canvas error")); return; }
                ctx.drawImage(img, 0, 0);
                setProgress(80);
                canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Conversion failed")), targetMime, 0.92);
            };
            img.onerror = () => reject(new Error("Failed to load image"));
            img.src = URL.createObjectURL(file);
        });
    };

    const imageToPdf = async (file: File): Promise<Blob> => {
        const { PDFDocument } = await import("pdf-lib");
        const img = new window.Image();
        await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(); img.src = URL.createObjectURL(file); });
        setProgress(40);
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([img.width, img.height]);
        setProgress(60);
        const imageBytes = await file.arrayBuffer();
        const pdfImage = file.type === "image/png" ? await pdfDoc.embedPng(imageBytes) : await pdfDoc.embedJpg(imageBytes);
        page.drawImage(pdfImage, { x: 0, y: 0, width: img.width, height: img.height });
        setProgress(80);
        const pdfBytes = await pdfDoc.save();
        return new Blob([new Uint8Array(pdfBytes).buffer], { type: "application/pdf" });
    };

    const pdfToImages = async (file: File, mimeType: string, ext: string): Promise<{ name: string; blob: Blob }[]> => {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const results: { name: string; blob: Blob }[] = [];
        const baseName = file.name.replace(/\.pdf$/i, "");

        for (let i = 1; i <= pdf.numPages; i++) {
            setProgress(10 + (80 * i / pdf.numPages));
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2 }); // 2x for quality
            const canvas = document.createElement("canvas");
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext("2d")!;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;

            const blob = await new Promise<Blob>((res, rej) => {
                canvas.toBlob((b) => b ? res(b) : rej(new Error("Failed")), mimeType, 0.92);
            });
            results.push({ name: `${baseName}-page${i}.${ext}`, blob });
        }
        return results;
    };

    const documentToPdf = async (file: File): Promise<Blob> => {
        const mammoth = await import("mammoth");
        const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");

        setProgress(20);
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        const html = result.value;

        setProgress(40);
        // Parse HTML to extract text
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const textContent = doc.body.innerText || doc.body.textContent || "";
        const paragraphs = textContent.split("\n").filter(p => p.trim());

        setProgress(60);
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontSize = 12;
        const margin = 50;
        const lineHeight = fontSize * 1.5;

        let page = pdfDoc.addPage([612, 792]); // Letter size
        let y = 792 - margin;

        for (const para of paragraphs) {
            const words = para.split(" ");
            let line = "";

            for (const word of words) {
                const testLine = line ? `${line} ${word}` : word;
                const width = font.widthOfTextAtSize(testLine, fontSize);

                if (width > 612 - 2 * margin) {
                    if (y < margin + lineHeight) {
                        page = pdfDoc.addPage([612, 792]);
                        y = 792 - margin;
                    }
                    page.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) });
                    y -= lineHeight;
                    line = word;
                } else {
                    line = testLine;
                }
            }

            if (line) {
                if (y < margin + lineHeight) {
                    page = pdfDoc.addPage([612, 792]);
                    y = 792 - margin;
                }
                page.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) });
                y -= lineHeight * 1.5; // Paragraph spacing
            }
        }

        setProgress(90);
        const pdfBytes = await pdfDoc.save();
        return new Blob([new Uint8Array(pdfBytes).buffer], { type: "application/pdf" });
    };

    const convertAudioToWav = async (file: File): Promise<Blob> => {
        const audioContext = new AudioContext();
        const arrayBuffer = await file.arrayBuffer();
        setProgress(30);
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        setProgress(60);
        const wavBuffer = audioBufferToWav(audioBuffer);
        setProgress(90);
        return new Blob([wavBuffer], { type: "audio/wav" });
    };

    const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
        const numChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const bitDepth = 16;
        const bytesPerSample = bitDepth / 8;
        const blockAlign = numChannels * bytesPerSample;
        const samples = buffer.length;
        const dataSize = samples * blockAlign;
        const bufferSize = 44 + dataSize;
        const arrayBuffer = new ArrayBuffer(bufferSize);
        const view = new DataView(arrayBuffer);
        const writeString = (offset: number, str: string) => { for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)); };
        writeString(0, "RIFF"); view.setUint32(4, bufferSize - 8, true); writeString(8, "WAVE"); writeString(12, "fmt ");
        view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * blockAlign, true);
        view.setUint16(32, blockAlign, true); view.setUint16(34, bitDepth, true); writeString(36, "data"); view.setUint32(40, dataSize, true);
        const channels: Float32Array[] = []; for (let i = 0; i < numChannels; i++) channels.push(buffer.getChannelData(i));
        let offset = 44;
        for (let i = 0; i < samples; i++) {
            for (let ch = 0; ch < numChannels; ch++) {
                const sample = Math.max(-1, Math.min(1, channels[ch][i]));
                view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
                offset += 2;
            }
        }
        return arrayBuffer;
    };

    const convertVideoToWebm = async (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const video = document.createElement("video");
            video.src = URL.createObjectURL(file);
            video.muted = true;
            video.onloadedmetadata = async () => {
                const canvas = document.createElement("canvas");
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext("2d")!;
                const stream = canvas.captureStream(30);
                const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
                const chunks: Blob[] = [];
                recorder.ondataavailable = (e) => chunks.push(e.data);
                recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
                recorder.start();
                video.play();
                const duration = Math.min(video.duration, 60); // Cap at 60s
                const interval = setInterval(() => {
                    ctx.drawImage(video, 0, 0);
                    setProgress(10 + (80 * video.currentTime / duration));
                }, 1000 / 30);
                setTimeout(() => {
                    clearInterval(interval);
                    recorder.stop();
                    video.pause();
                }, duration * 1000);
            };
            video.onerror = () => reject(new Error("Failed to load video"));
        });
    };

    const extractVideoFrame = async (file: File, targetMime: string): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const video = document.createElement("video");
            video.src = URL.createObjectURL(file);
            video.muted = true;
            video.currentTime = 1;
            video.onloadeddata = () => {
                video.onseeked = () => {
                    setProgress(50);
                    const canvas = document.createElement("canvas");
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    const ctx = canvas.getContext("2d")!;
                    ctx.drawImage(video, 0, 0);
                    setProgress(80);
                    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Failed")), targetMime, 0.92);
                };
            };
            video.onerror = () => reject(new Error("Failed to load video"));
        });
    };

    const convertData = async (file: File, targetId: string): Promise<Blob> => {
        const text = await file.text();
        setProgress(30);
        const ext = file.name.split(".").pop()?.toLowerCase();
        let result: string;
        if (ext === "json" && targetId === "csv") {
            const data = JSON.parse(text);
            if (Array.isArray(data) && data.length > 0) {
                const headers = Object.keys(data[0]);
                const rows = data.map((item: Record<string, unknown>) => headers.map(h => JSON.stringify(item[h] ?? "")).join(","));
                result = [headers.join(","), ...rows].join("\n");
            } else throw new Error("JSON must be an array of objects");
        } else if (ext === "csv" && targetId === "json") {
            const lines = text.trim().split("\n");
            const headers = lines[0].split(",").map(h => h.trim());
            const data = lines.slice(1).map(line => {
                const values = line.split(",");
                return headers.reduce((obj, h, i) => ({ ...obj, [h]: values[i]?.trim() }), {});
            });
            result = JSON.stringify(data, null, 2);
        } else throw new Error("Unsupported data conversion");
        setProgress(80);
        return new Blob([result], { type: targetId === "json" ? "application/json" : "text/csv" });
    };

    const downloadBlob = (name: string, blob: Blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = name;
        a.click();
    };

    const formatGroups = detectedFile ? CATEGORY_FORMAT_GROUPS[detectedFile.category] || [] : [];
    const CategoryIcon = detectedFile ? CATEGORY_ICONS[detectedFile.category] : Upload;

    return (
        <div className="max-w-3xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <div>
                    <h1 className="text-xl font-semibold">Smart Convert</h1>
                    <p className="text-xs text-muted-foreground">Drop a file, pick a format</p>
                </div>
            </div>

            {!detectedFile ? (
                <div
                    className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/40"}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById("file-input")?.click()}
                >
                    <input type="file" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" id="file-input" />
                    <Upload className={`h-10 w-10 mx-auto mb-3 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="text-lg font-medium mb-1">Drop any file</p>
                    <p className="text-sm text-muted-foreground">to see conversion options</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className={`rounded-xl border p-4 ${CATEGORY_COLORS[detectedFile.category]}`}>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/80 dark:bg-black/20">
                                <CategoryIcon className="h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{detectedFile.file.name}</p>
                                <p className="text-sm opacity-80">{detectedFile.displayType} • {formatFileSize(detectedFile.file.size)}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={clearFile}><X className="h-4 w-4" /></Button>
                        </div>
                    </div>

                    {detectedFile.category === "unsupported" && (
                        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-4">
                            <p className="text-sm text-amber-800 dark:text-amber-200">This file type is not supported for conversion.</p>
                        </div>
                    )}

                    {formatGroups.length > 0 && (
                        <div className="space-y-4">
                            <p className="text-sm font-medium text-muted-foreground">Convert to:</p>
                            {formatGroups.map((group) => (
                                <div key={group.name} className="space-y-2">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
                                        <group.icon className="h-3.5 w-3.5" />{group.name}
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {group.formats.map((format) => (
                                            <button
                                                key={format.id}
                                                onClick={() => setSelectedFormat(format)}
                                                disabled={isConverting}
                                                className={`p-3 rounded-xl border text-left transition-all ${selectedFormat?.id === format.id ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-muted-foreground/20 hover:border-muted-foreground/40"} ${isConverting ? "opacity-50" : ""}`}
                                            >
                                                <p className="font-semibold text-sm">{format.format}</p>
                                                <p className="text-xs text-muted-foreground">{format.description}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {warning && (
                        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-3 flex gap-2">
                            <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-sm text-amber-800 dark:text-amber-200">{warning}</p>
                        </div>
                    )}

                    {error && (
                        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20 p-4">
                            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                        </div>
                    )}

                    {isConverting && <Progress value={progress} className="h-2" />}

                    <div className="flex gap-3">
                        {convertedBlobs.length === 0 ? (
                            <Button onClick={convert} disabled={!selectedFormat || isConverting} className="flex-1">
                                {isConverting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Converting...</> : `Convert to ${selectedFormat?.format || "..."}`}
                            </Button>
                        ) : (
                            <div className="flex-1 space-y-2">
                                {convertedBlobs.map((item, i) => (
                                    <Button key={i} onClick={() => downloadBlob(item.name, item.blob)} variant="outline" className="w-full justify-start">
                                        <Download className="h-4 w-4 mr-2" />{item.name}
                                    </Button>
                                ))}
                                <Button variant="ghost" onClick={() => { setConvertedBlobs([]); setSelectedFormat(null); }} className="w-full">
                                    Convert Again
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="text-center">
                        <Button variant="ghost" size="sm" onClick={clearFile}>Drop another file</Button>
                    </div>
                </div>
            )}

            <p className="text-xs text-muted-foreground text-center mt-8">All conversions run locally in your browser</p>
        </div>
    );
}
