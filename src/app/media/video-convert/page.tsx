"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, Download, Video } from "lucide-react";

export default function VideoConvertPage() {
    const [file, setFile] = useState<File | null>(null);
    const [outputFormat, setOutputFormat] = useState("video/webm");
    const [outputUrl, setOutputUrl] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    const formats = [
        { value: "video/webm", label: "WebM", ext: "webm" },
    ];

    const handleFile = useCallback((f: File) => {
        if (!f.type.startsWith("video/")) return;
        setFile(f);
        setOutputUrl(null);
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

        try {
            // For browser-only conversion, we use MediaRecorder
            // This captures the video playback and re-encodes to WebM
            const video = document.createElement("video");
            video.src = URL.createObjectURL(file);
            video.muted = true;

            await new Promise<void>((resolve) => {
                video.onloadedmetadata = () => resolve();
            });

            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d");

            const stream = canvas.captureStream(30);
            const audioCtx = new AudioContext();
            const source = audioCtx.createMediaElementSource(video);
            const dest = audioCtx.createMediaStreamDestination();
            source.connect(dest);
            source.connect(audioCtx.destination);

            dest.stream.getAudioTracks().forEach(track => stream.addTrack(track));

            const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
            const chunks: Blob[] = [];

            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: "video/webm" });
                setOutputUrl(URL.createObjectURL(blob));
                setIsProcessing(false);
            };

            recorder.start();
            video.play();

            const drawFrame = () => {
                if (video.ended || video.paused) {
                    recorder.stop();
                    return;
                }
                ctx?.drawImage(video, 0, 0);
                requestAnimationFrame(drawFrame);
            };
            drawFrame();

            video.onended = () => recorder.stop();
        } catch (error) {
            console.error("Conversion failed:", error);
            setIsProcessing(false);
        }
    };

    const download = () => {
        if (!outputUrl || !file) return;
        const a = document.createElement("a");
        a.href = outputUrl;
        a.download = file.name.replace(/\.[^.]+$/, "") + ".webm";
        a.click();
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/media"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">Convert Video</h1>
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
                                <span className="text-sm font-medium">{file.name}</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => { setFile(null); setOutputUrl(null); }}>Change</Button>
                        </div>
                    </div>

                    <div className="border rounded-xl p-4 mb-4">
                        <label className="text-sm font-medium mb-2 block">Output Format</label>
                        <Select value={outputFormat} onValueChange={setOutputFormat}>
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {formats.map(f => (
                                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-2">Browser-native conversion to WebM</p>
                    </div>

                    {outputUrl && (
                        <div className="border rounded-xl p-4 mb-4">
                            <video ref={videoRef} src={outputUrl} controls className="w-full rounded-lg" />
                        </div>
                    )}

                    <div className="flex gap-2">
                        <Button onClick={convert} disabled={isProcessing} className="flex-1 h-11">
                            {isProcessing ? "Converting..." : "Convert to WebM"}
                        </Button>
                        {outputUrl && (
                            <Button onClick={download} variant="outline" className="h-11">
                                <Download className="h-4 w-4 mr-2" />Download
                            </Button>
                        )}
                    </div>
                </>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">Processed locally using MediaRecorder API</p>
        </div>
    );
}
