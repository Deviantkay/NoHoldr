"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Upload, Video, Download, AlertTriangle } from "lucide-react";

export default function VideoConverterPage() {
    const [file, setFile] = useState<File | null>(null);
    const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);

    const handleFile = useCallback((f: File) => {
        if (!f.type.startsWith("video/")) return;
        setFile(f);
        setConvertedUrl(null);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    }, [handleFile]);

    const convertVideo = async () => {
        if (!file) return;
        setIsProcessing(true);
        setProgress(10);

        try {
            // Create video element
            const video = document.createElement("video");
            video.src = URL.createObjectURL(file);
            video.muted = true;

            await new Promise<void>((resolve) => {
                video.onloadedmetadata = () => resolve();
            });

            setProgress(20);

            // Set up canvas
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("No canvas context");

            // Set up MediaRecorder for WebM output
            const stream = canvas.captureStream(30);
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: "video/webm;codecs=vp9",
                videoBitsPerSecond: 5000000,
            });

            const chunks: Blob[] = [];
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            const recordingDone = new Promise<void>((resolve) => {
                mediaRecorder.onstop = () => resolve();
            });

            mediaRecorder.start();
            video.play();

            // Draw frames
            const drawFrame = () => {
                if (video.ended || video.paused) {
                    mediaRecorder.stop();
                    return;
                }
                ctx.drawImage(video, 0, 0);
                setProgress(20 + Math.round((video.currentTime / video.duration) * 70));
                requestAnimationFrame(drawFrame);
            };

            video.onended = () => {
                mediaRecorder.stop();
            };

            drawFrame();
            await recordingDone;

            setProgress(95);
            const blob = new Blob(chunks, { type: "video/webm" });
            setConvertedUrl(URL.createObjectURL(blob));
            setProgress(100);
        } catch (error) {
            console.error("Conversion failed:", error);
        }

        setIsProcessing(false);
    };

    const download = () => {
        if (!convertedUrl || !file) return;
        const a = document.createElement("a");
        a.href = convertedUrl;
        a.download = file.name.replace(/\.[^.]+$/, ".webm");
        a.click();
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/convert"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <div>
                    <h1 className="text-lg font-semibold">Video Converter</h1>
                    <p className="text-xs text-muted-foreground">Convert to WebM</p>
                </div>
            </div>

            <div className="border rounded-xl p-4 mb-4 bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                    <div className="text-sm text-muted-foreground">
                        <p className="font-medium text-foreground mb-1">Browser Limitation</p>
                        <p>Browser video conversion only supports WebM output. For MP4/MOV encoding, use desktop tools like FFmpeg or HandBrake.</p>
                    </div>
                </div>
            </div>

            {/* Drop Zone */}
            <div
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors mb-4 ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onDrop={handleDrop}
                onClick={() => document.getElementById("video-input")?.click()}
            >
                <input type="file" accept="video/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" id="video-input" />
                <Video className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm"><span className="font-medium">Drop video file</span> <span className="text-muted-foreground">or click</span></p>
                <p className="text-xs text-muted-foreground mt-1">Supports MP4, MOV, AVI, etc.</p>
            </div>

            {file && (
                <>
                    <div className="border rounded-xl p-4 mb-4">
                        <div className="flex items-center gap-3">
                            <Video className="h-5 w-5 text-blue-500" />
                            <span className="text-sm font-medium flex-1 truncate">{file.name}</span>
                            <span className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                    </div>

                    {isProcessing && <Progress value={progress} className="h-1.5 mb-4" />}

                    <div className="flex gap-2">
                        <Button onClick={convertVideo} disabled={isProcessing} className="flex-1">
                            {isProcessing ? "Converting..." : "Convert to WebM"}
                        </Button>
                        {convertedUrl && (
                            <Button variant="outline" onClick={download}>
                                <Download className="h-4 w-4 mr-2" />Download
                            </Button>
                        )}
                    </div>
                </>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">Processed locally</p>
        </div>
    );
}
