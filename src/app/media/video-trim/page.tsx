"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Upload, Download, Video, Play, Pause, AlertTriangle, Info } from "lucide-react";
import { downloadFile } from "@/lib/download-manager";

export default function VideoTrimPage() {
    const [file, setFile] = useState<File | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [duration, setDuration] = useState(0);
    const [range, setRange] = useState([0, 100]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState("");
    const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const abortRef = useRef(false);

    const handleFile = useCallback((f: File) => {
        if (!f.type.startsWith("video/")) return;
        setFile(f);
        const url = URL.createObjectURL(f);
        // Revoke previous URL
        if (videoUrl) URL.revokeObjectURL(videoUrl);
        setVideoUrl(url);
        setOutputBlob(null);
        setError(null);
    }, [videoUrl]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    }, [handleFile]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) handleFile(e.target.files[0]);
    }, [handleFile]);

    const onLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
            setRange([0, 100]);
        }
    };

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.currentTime = (range[0] / 100) * duration;
            videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    const trim = async () => {
        if (!file || !videoRef.current) return;
        setIsProcessing(true);
        setError(null);
        setOutputBlob(null);
        setProgress(0);
        abortRef.current = false;

        const startTime = (range[0] / 100) * duration;
        const endTime = (range[1] / 100) * duration;
        const trimDuration = endTime - startTime;
        setStatusText(`Trimming ${formatTime(trimDuration)} of video...`);

        try {
            const video = document.createElement("video");
            const videoSrcUrl = URL.createObjectURL(file);
            video.src = videoSrcUrl;
            video.currentTime = startTime;

            await new Promise<void>((resolve, reject) => {
                video.onloadedmetadata = () => {
                    video.currentTime = startTime;
                };
                video.onseeked = () => resolve();
                video.onerror = () => reject(new Error("Failed to load video"));
            });

            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d")!;

            const stream = canvas.captureStream(30);
            const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
            const chunks: Blob[] = [];

            recorder.ondataavailable = (e) => chunks.push(e.data);

            const resultPromise = new Promise<Blob>((resolve) => {
                recorder.onstop = () => {
                    const blob = new Blob(chunks, { type: "video/webm" });
                    resolve(blob);
                };
            });

            recorder.start();
            video.muted = true;
            video.play();

            const startRecordTime = Date.now();

            const drawFrame = () => {
                const elapsed = (Date.now() - startRecordTime) / 1000;
                if (abortRef.current) {
                    video.pause();
                    recorder.stop();
                    return;
                }
                if (elapsed >= trimDuration || video.ended || video.paused) {
                    video.pause();
                    recorder.stop();
                    return;
                }
                ctx.drawImage(video, 0, 0);
                setProgress(Math.round((elapsed / trimDuration) * 100));
                requestAnimationFrame(drawFrame);
            };
            drawFrame();

            const blob = await resultPromise;
            URL.revokeObjectURL(videoSrcUrl);

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
            console.error("Trim failed:", err);
            setError(err instanceof Error ? err.message : "Trim failed");
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
        downloadFile(outputBlob, file.name.replace(/\.[^.]+$/, "") + "_trimmed.webm");
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/media"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">Trim Video</h1>
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
                        <video
                            ref={videoRef}
                            src={videoUrl || ""}
                            onLoadedMetadata={onLoadedMetadata}
                            className="w-full rounded-lg mb-4"
                        />

                        <div className="flex items-center gap-4 mb-4">
                            <Button variant="outline" size="icon" onClick={togglePlay}>
                                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </Button>
                            <div className="flex-1">
                                <Slider
                                    value={range}
                                    onValueChange={setRange}
                                    min={0}
                                    max={100}
                                    step={0.1}
                                />
                            </div>
                        </div>

                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Start: {formatTime((range[0] / 100) * duration)}</span>
                            <span>End: {formatTime((range[1] / 100) * duration)}</span>
                            <span>Duration: {formatTime(((range[1] - range[0]) / 100) * duration)}</span>
                        </div>
                    </div>

                    <div className="border rounded-xl p-3 mb-4 bg-amber-50/30 dark:bg-amber-950/10 border-amber-200/50 dark:border-amber-800/50">
                        <div className="flex gap-2">
                            <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-700 dark:text-amber-400">
                                Trimming runs at playback speed. Output is WebM format (audio not preserved).
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
                            <p className="text-sm font-medium mb-2">Trimmed video</p>
                            <video src={URL.createObjectURL(outputBlob)} controls className="w-full rounded-lg" />
                        </div>
                    )}

                    <div className="flex gap-2">
                        {!outputBlob ? (
                            <>
                                <Button onClick={trim} disabled={isProcessing} className="flex-1 h-11">
                                    {isProcessing ? "Trimming..." : "Trim Video"}
                                </Button>
                                {isProcessing && (
                                    <Button onClick={cancel} variant="outline" className="h-11">Cancel</Button>
                                )}
                            </>
                        ) : (
                            <Button onClick={handleDownload} className="flex-1 h-11">
                                <Download className="h-4 w-4 mr-2" />Download Trimmed
                            </Button>
                        )}
                    </div>
                </>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">Processed locally • Output as WebM</p>
        </div>
    );
}
