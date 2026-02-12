"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Upload, Download, Video, Gauge, AlertTriangle, Info } from "lucide-react";
import { downloadFile, formatBytes } from "@/lib/download-manager";

export default function VideoCompressPage() {
    const [file, setFile] = useState<File | null>(null);
    const [quality, setQuality] = useState([50]);
    const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState("");
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef(false);

    const handleFile = useCallback((f: File) => {
        if (!f.type.startsWith("video/")) return;
        setFile(f);
        setOutputBlob(null);
        setError(null);
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
        setError(null);
        setOutputBlob(null);
        setProgress(0);
        abortRef.current = false;
        setStatusText("Loading video...");

        try {
            const video = document.createElement("video");
            const videoUrl = URL.createObjectURL(file);
            video.src = videoUrl;
            video.muted = true;

            await new Promise<void>((resolve, reject) => {
                video.onloadedmetadata = () => resolve();
                video.onerror = () => reject(new Error("Failed to load video"));
            });

            setStatusText(`Compressing (${Math.round(video.duration)}s video)...`);

            // Scale down based on quality
            const scale = quality[0] / 100;
            const canvas = document.createElement("canvas");
            canvas.width = Math.round(video.videoWidth * scale);
            canvas.height = Math.round(video.videoHeight * scale);
            const ctx = canvas.getContext("2d")!;

            const stream = canvas.captureStream(24);

            // Lower bitrate for compression
            const bitrate = Math.round(1000000 * scale);
            const recorder = new MediaRecorder(stream, {
                mimeType: "video/webm",
                videoBitsPerSecond: bitrate
            });
            const chunks: Blob[] = [];

            recorder.ondataavailable = (e) => chunks.push(e.data);

            const resultPromise = new Promise<Blob>((resolve) => {
                recorder.onstop = () => {
                    const blob = new Blob(chunks, { type: "video/webm" });
                    resolve(blob);
                };
            });

            recorder.start();
            video.play();

            const duration = video.duration;
            const drawFrame = () => {
                if (abortRef.current) {
                    video.pause();
                    recorder.stop();
                    return;
                }
                if (video.ended || video.paused) {
                    recorder.stop();
                    return;
                }
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                setProgress(Math.round((video.currentTime / duration) * 100));
                requestAnimationFrame(drawFrame);
            };
            drawFrame();

            video.onended = () => recorder.stop();

            const blob = await resultPromise;
            URL.revokeObjectURL(videoUrl);

            if (abortRef.current) {
                setIsProcessing(false);
                setProgress(0);
                setStatusText("");
                return;
            }

            setOutputBlob(blob);
            setProgress(100);
            setStatusText("Done!");
            setTimeout(() => {
                setIsProcessing(false);
                setProgress(0);
                setStatusText("");
            }, 800);
        } catch (err) {
            console.error("Compression failed:", err);
            setError(err instanceof Error ? err.message : "Compression failed");
            setIsProcessing(false);
            setProgress(0);
            setStatusText("");
        }
    };

    const cancel = () => {
        abortRef.current = true;
    };

    const handleDownload = () => {
        if (!outputBlob || !file) return;
        downloadFile(outputBlob, file.name.replace(/\.[^.]+$/, "") + "_compressed.webm");
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/media"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">Compress Video</h1>
            </div>

            {error && (
                <div className="border rounded-xl p-4 mb-4 bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                    </div>
                </div>
            )}

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
                                    <p className="text-xs text-muted-foreground">Original: {formatBytes(file.size)}</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => { setFile(null); setOutputBlob(null); setError(null); }}>Change</Button>
                        </div>
                    </div>

                    <div className="border rounded-xl p-4 mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium">Quality / Size</label>
                            <span className="text-sm">{quality[0]}%</span>
                        </div>
                        <Slider value={quality} onValueChange={setQuality} min={20} max={100} step={10} disabled={isProcessing} />
                        <p className="text-xs text-muted-foreground mt-2">Lower = smaller file, reduced quality and resolution</p>
                    </div>

                    <div className="border rounded-xl p-3 mb-4 bg-amber-50/30 dark:bg-amber-950/10 border-amber-200/50 dark:border-amber-800/50">
                        <div className="flex gap-2">
                            <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-700 dark:text-amber-400">
                                Compression runs at playback speed. Output is WebM format (audio not preserved).
                            </p>
                        </div>
                    </div>

                    {isProcessing && (
                        <div className="mb-4">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>{statusText}</span>
                                <span>{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-1.5" />
                        </div>
                    )}

                    {outputBlob && (
                        <div className="border rounded-xl p-4 mb-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Gauge className="h-4 w-4 text-green-500" />
                                <span className="text-sm font-medium">
                                    Compressed: {formatBytes(outputBlob.size)}
                                    {file && outputBlob.size < file.size && (
                                        ` (${Math.round((1 - outputBlob.size / file.size) * 100)}% smaller)`
                                    )}
                                </span>
                            </div>
                            <video src={URL.createObjectURL(outputBlob)} controls className="w-full rounded-lg" />
                        </div>
                    )}

                    <div className="flex gap-2">
                        {!outputBlob ? (
                            <>
                                <Button onClick={compress} disabled={isProcessing} className="flex-1 h-11">
                                    {isProcessing ? "Compressing..." : "Compress"}
                                </Button>
                                {isProcessing && (
                                    <Button onClick={cancel} variant="outline" className="h-11">Cancel</Button>
                                )}
                            </>
                        ) : (
                            <Button onClick={handleDownload} className="flex-1 h-11">
                                <Download className="h-4 w-4 mr-2" />Download Compressed
                            </Button>
                        )}
                    </div>
                </>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">Processed locally • Output as WebM</p>
        </div>
    );
}
