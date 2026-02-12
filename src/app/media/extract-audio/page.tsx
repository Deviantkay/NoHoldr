"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Upload, Download, Video, Music } from "lucide-react";

export default function ExtractAudioPage() {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);

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

    const extract = async () => {
        if (!file) return;
        setIsProcessing(true);
        setProgress(10);
        let videoSrcUrl: string | null = null;

        try {
            // Create video element to decode
            const video = document.createElement("video");
            videoSrcUrl = URL.createObjectURL(file);
            video.src = videoSrcUrl;
            video.muted = true;

            await new Promise<void>((resolve) => {
                video.onloadedmetadata = () => resolve();
            });
            setProgress(30);

            // Use AudioContext to extract audio
            const audioContext = new AudioContext();
            const arrayBuffer = await file.arrayBuffer();
            setProgress(50);

            // Decode audio from video file
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            setProgress(70);

            // Convert to WAV
            const wavBlob = audioBufferToWav(audioBuffer);
            setProgress(90);

            const url = URL.createObjectURL(wavBlob);
            if (outputUrl) URL.revokeObjectURL(outputUrl);
            setOutputUrl(url);
            setProgress(100);
        } catch (error) {
            console.error("Extraction failed:", error);
        }

        if (videoSrcUrl) URL.revokeObjectURL(videoSrcUrl);
        setIsProcessing(false);
    };

    const audioBufferToWav = (buffer: AudioBuffer): Blob => {
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

        const writeString = (offset: number, str: string) => {
            for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
        };

        writeString(0, "RIFF");
        view.setUint32(4, bufferSize - 8, true);
        writeString(8, "WAVE");
        writeString(12, "fmt ");
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * blockAlign, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitDepth, true);
        writeString(36, "data");
        view.setUint32(40, dataSize, true);

        const channelData = [];
        for (let i = 0; i < numChannels; i++) channelData.push(buffer.getChannelData(i));

        for (let i = 0; i < samples; i++) {
            for (let ch = 0; ch < numChannels; ch++) {
                const sample = Math.max(-1, Math.min(1, channelData[ch][i]));
                view.setInt16(44 + (i * numChannels + ch) * 2, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
            }
        }

        return new Blob([arrayBuffer], { type: "audio/wav" });
    };

    const download = () => {
        if (!outputUrl || !file) return;
        const a = document.createElement("a");
        a.href = outputUrl;
        a.download = file.name.replace(/\.[^.]+$/, "") + "_audio.wav";
        a.click();
        // Revoke after download triggered
        setTimeout(() => {
            if (outputUrl) URL.revokeObjectURL(outputUrl);
        }, 5000);
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/media"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">Extract Audio from Video</h1>
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

                    {isProcessing && (
                        <div className="mb-4">
                            <Progress value={progress} className="h-1.5" />
                        </div>
                    )}

                    {outputUrl && (
                        <div className="border rounded-xl p-4 mb-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Music className="h-4 w-4 text-purple-500" />
                                <span className="text-sm font-medium">Audio extracted</span>
                            </div>
                            <audio src={outputUrl} controls className="w-full" />
                        </div>
                    )}

                    <div className="flex gap-2">
                        <Button onClick={extract} disabled={isProcessing} className="flex-1 h-11">
                            {isProcessing ? "Extracting..." : "Extract Audio"}
                        </Button>
                        {outputUrl && (
                            <Button onClick={download} variant="outline" className="h-11">
                                <Download className="h-4 w-4 mr-2" />Download WAV
                            </Button>
                        )}
                    </div>
                </>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">Processed locally • Output as WAV</p>
        </div>
    );
}
