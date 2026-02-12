"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Upload, Download, Video, AlertTriangle, Info } from "lucide-react";
import { downloadFile, formatBytes } from "@/lib/download-manager";

export default function VideoConvertPage() {
    const [file, setFile] = useState<File | null>(null);
    const [outputFormat] = useState("video/webm");
    const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState("");
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
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

    const convert = async () => {
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
            video.muted = false;

            await new Promise<void>((resolve, reject) => {
                video.onloadedmetadata = () => resolve();
                video.onerror = () => reject(new Error("Failed to load video"));
            });

            setStatusText(`Converting (${Math.round(video.duration)}s video — runs at playback speed)...`);

            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d")!;

            const stream = canvas.captureStream(30);

            // Capture audio
            try {
                const audioCtx = new AudioContext();
                const source = audioCtx.createMediaElementSource(video);
                const dest = audioCtx.createMediaStreamDestination();
                source.connect(dest);
                source.connect(audioCtx.destination);
                dest.stream.getAudioTracks().forEach(track => stream.addTrack(track));
            } catch {
                // Audio capture may fail — continue without audio
            }

            const recorder = new MediaRecorder(stream, { mimeType: outputFormat });
            const chunks: Blob[] = [];

            recorder.ondataavailable = (e) => chunks.push(e.data);

            const resultPromise = new Promise<Blob>((resolve) => {
                recorder.onstop = () => {
                    const blob = new Blob(chunks, { type: outputFormat });
                    resolve(blob);
                };
            });

            recorder.start();
            video.muted = true; // Mute actual playback, audio captured via AudioContext
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
                ctx.drawImage(video, 0, 0);
                setProgress(Math.round((video.currentTime / duration) * 100));
                requestAnimationFrame(drawFrame);
            };
            drawFrame();

            video.onended = () => {
                recorder.stop();
            };

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
            console.error("Conversion failed:", err);
            setError(err instanceof Error ? err.message : "Conversion failed");
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
        downloadFile(outputBlob, file.name.replace(/\.[^.]+$/, "") + ".webm");
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/media"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">Convert Video</h1>
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
                                    <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => { setFile(null); setOutputBlob(null); setError(null); }}>Change</Button>
                        </div>
                    </div>

                    <div className="border rounded-xl p-4 mb-4">
                        <label className="text-sm font-medium mb-2 block">Output Format</label>
                        <Select value={outputFormat} disabled>
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="video/webm">WebM</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-2">Browser-native conversion to WebM</p>
                    </div>

                    <div className="border rounded-xl p-3 mb-4 bg-amber-50/30 dark:bg-amber-950/10 border-amber-200/50 dark:border-amber-800/50">
                        <div className="flex gap-2">
                            <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-700 dark:text-amber-400">
                                Video conversion runs at playback speed. A 5-minute video takes ~5 minutes to process.
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
                                <Video className="h-4 w-4 text-green-500" />
                                <span className="text-sm font-medium">Converted • {formatBytes(outputBlob.size)}</span>
                            </div>
                            <video ref={videoRef} src={URL.createObjectURL(outputBlob)} controls className="w-full rounded-lg" />
                        </div>
                    )}

                    <div className="flex gap-2">
                        {!outputBlob ? (
                            <>
                                <Button onClick={convert} disabled={isProcessing} className="flex-1 h-11">
                                    {isProcessing ? "Converting..." : "Convert to WebM"}
                                </Button>
                                {isProcessing && (
                                    <Button onClick={cancel} variant="outline" className="h-11">Cancel</Button>
                                )}
                            </>
                        ) : (
                            <Button onClick={handleDownload} className="flex-1 h-11">
                                <Download className="h-4 w-4 mr-2" />Download WebM
                            </Button>
                        )}
                    </div>
                </>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">Processed locally using MediaRecorder API</p>
        </div>
    );
}
