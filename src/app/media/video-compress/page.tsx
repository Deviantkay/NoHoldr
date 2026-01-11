"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Upload, Download, Video, Gauge } from "lucide-react";

export default function VideoCompressPage() {
    const [file, setFile] = useState<File | null>(null);
    const [quality, setQuality] = useState([50]);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [outputSize, setOutputSize] = useState(0);

    const handleFile = useCallback((f: File) => {
        if (!f.type.startsWith("video/")) return;
        setFile(f);
        setOutputUrl(null);
        setOutputSize(0);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    }, [handleFile]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) handleFile(e.target.files[0]);
    }, [handleFile]);

    const compress = async () => {
        if (!file) return;
        setIsProcessing(true);

        try {
            const video = document.createElement("video");
            video.src = URL.createObjectURL(file);
            video.muted = true;

            await new Promise<void>((resolve) => {
                video.onloadedmetadata = () => resolve();
            });

            // Scale down based on quality
            const scale = quality[0] / 100;
            const canvas = document.createElement("canvas");
            canvas.width = Math.round(video.videoWidth * scale);
            canvas.height = Math.round(video.videoHeight * scale);
            const ctx = canvas.getContext("2d");

            const stream = canvas.captureStream(24);

            // Lower bitrate for compression
            const bitrate = Math.round(1000000 * scale); // Lower quality = lower bitrate
            const recorder = new MediaRecorder(stream, {
                mimeType: "video/webm",
                videoBitsPerSecond: bitrate
            });
            const chunks: Blob[] = [];

            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: "video/webm" });
                setOutputUrl(URL.createObjectURL(blob));
                setOutputSize(blob.size);
                setIsProcessing(false);
            };

            recorder.start();
            video.play();

            const drawFrame = () => {
                if (video.ended || video.paused) {
                    recorder.stop();
                    return;
                }
                ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
                requestAnimationFrame(drawFrame);
            };
            drawFrame();

            video.onended = () => recorder.stop();
        } catch (error) {
            console.error("Compression failed:", error);
            setIsProcessing(false);
        }
    };

    const download = () => {
        if (!outputUrl || !file) return;
        const a = document.createElement("a");
        a.href = outputUrl;
        a.download = file.name.replace(/\.[^.]+$/, "") + "_compressed.webm";
        a.click();
    };

    const fmt = (b: number) => b < 1024 ? b + " B" : b < 1048576 ? (b / 1024).toFixed(1) + " KB" : (b / 1048576).toFixed(2) + " MB";

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/media"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">Compress Video</h1>
            </div>

            {!file ? (
                <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById("video-input")?.click()}
                >
                    <input type="file" accept="video/*" onChange={handleFileSelect} className="hidden" id="video-input" />
                    <Video className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm"><span className="font-medium">Drop video</span> <span className="text-muted-foreground">or tap</span></p>
                </div>
            ) : (
                <>
                    <div className="border rounded-xl p-4 mb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Video className="h-5 w-5 text-blue-500" />
                                <div>
                                    <span className="text-sm font-medium">{file.name}</span>
                                    <p className="text-xs text-muted-foreground">Original: {fmt(file.size)}</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => { setFile(null); setOutputUrl(null); }}>Change</Button>
                        </div>
                    </div>

                    <div className="border rounded-xl p-4 mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium">Quality / Size</label>
                            <span className="text-sm">{quality[0]}%</span>
                        </div>
                        <Slider value={quality} onValueChange={setQuality} min={20} max={100} step={10} />
                        <p className="text-xs text-muted-foreground mt-2">Lower = smaller file, reduced quality</p>
                    </div>

                    {outputUrl && (
                        <div className="border rounded-xl p-4 mb-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Gauge className="h-4 w-4 text-green-500" />
                                <span className="text-sm font-medium">
                                    Compressed: {fmt(outputSize)} ({Math.round((1 - outputSize / file.size) * 100)}% smaller)
                                </span>
                            </div>
                            <video src={outputUrl} controls className="w-full rounded-lg" />
                        </div>
                    )}

                    <div className="flex gap-2">
                        <Button onClick={compress} disabled={isProcessing} className="flex-1 h-11">
                            {isProcessing ? "Compressing..." : "Compress"}
                        </Button>
                        {outputUrl && (
                            <Button onClick={download} variant="outline" className="h-11">
                                <Download className="h-4 w-4 mr-2" />Download
                            </Button>
                        )}
                    </div>
                </>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">Processed locally • Output as WebM</p>
        </div>
    );
}
