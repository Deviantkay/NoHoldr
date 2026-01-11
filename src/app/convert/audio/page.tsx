"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Upload, Music, Download, AlertTriangle } from "lucide-react";

export default function AudioConverterPage() {
    const [file, setFile] = useState<File | null>(null);
    const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleFile = useCallback((f: File) => {
        if (!f.type.startsWith("audio/")) return;
        setFile(f);
        setConvertedUrl(null);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    }, [handleFile]);

    const convertAudio = async () => {
        if (!file) return;
        setIsProcessing(true);
        setProgress(20);

        try {
            const audioContext = new AudioContext();
            const arrayBuffer = await file.arrayBuffer();
            setProgress(40);

            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            setProgress(60);

            // Convert to WAV
            const wavBuffer = audioBufferToWav(audioBuffer);
            setProgress(80);

            const blob = new Blob([wavBuffer], { type: "audio/wav" });
            setConvertedUrl(URL.createObjectURL(blob));
            setProgress(100);
        } catch (error) {
            console.error("Conversion failed:", error);
        }

        setIsProcessing(false);
    };

    // WAV encoder
    const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
        const numChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const format = 1; // PCM
        const bitDepth = 16;

        const bytesPerSample = bitDepth / 8;
        const blockAlign = numChannels * bytesPerSample;

        const samples = buffer.length;
        const dataSize = samples * blockAlign;
        const bufferSize = 44 + dataSize;

        const arrayBuffer = new ArrayBuffer(bufferSize);
        const view = new DataView(arrayBuffer);

        // WAV header
        const writeString = (offset: number, str: string) => {
            for (let i = 0; i < str.length; i++) {
                view.setUint8(offset + i, str.charCodeAt(i));
            }
        };

        writeString(0, "RIFF");
        view.setUint32(4, bufferSize - 8, true);
        writeString(8, "WAVE");
        writeString(12, "fmt ");
        view.setUint32(16, 16, true);
        view.setUint16(20, format, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * blockAlign, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitDepth, true);
        writeString(36, "data");
        view.setUint32(40, dataSize, true);

        // Audio data
        const channels: Float32Array[] = [];
        for (let i = 0; i < numChannels; i++) {
            channels.push(buffer.getChannelData(i));
        }

        let offset = 44;
        for (let i = 0; i < samples; i++) {
            for (let ch = 0; ch < numChannels; ch++) {
                const sample = Math.max(-1, Math.min(1, channels[ch][i]));
                const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
                view.setInt16(offset, intSample, true);
                offset += 2;
            }
        }

        return arrayBuffer;
    };

    const download = () => {
        if (!convertedUrl || !file) return;
        const a = document.createElement("a");
        a.href = convertedUrl;
        a.download = file.name.replace(/\.[^.]+$/, ".wav");
        a.click();
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/convert"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <div>
                    <h1 className="text-lg font-semibold">Audio Converter</h1>
                    <p className="text-xs text-muted-foreground">Convert to WAV</p>
                </div>
            </div>

            <div className="border rounded-xl p-4 mb-4 bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                    <div className="text-sm text-muted-foreground">
                        <p className="font-medium text-foreground mb-1">Browser Limitation</p>
                        <p>Browser audio conversion only supports WAV output. For MP3/AAC encoding, use desktop tools like FFmpeg or Audacity.</p>
                    </div>
                </div>
            </div>

            {/* Drop Zone */}
            <div
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors mb-4 ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onDrop={handleDrop}
                onClick={() => document.getElementById("audio-input")?.click()}
            >
                <input type="file" accept="audio/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" id="audio-input" />
                <Music className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm"><span className="font-medium">Drop audio file</span> <span className="text-muted-foreground">or click</span></p>
                <p className="text-xs text-muted-foreground mt-1">Supports MP3, M4A, OGG, etc.</p>
            </div>

            {file && (
                <>
                    <div className="border rounded-xl p-4 mb-4">
                        <div className="flex items-center gap-3">
                            <Music className="h-5 w-5 text-purple-500" />
                            <span className="text-sm font-medium flex-1 truncate">{file.name}</span>
                            <span className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                    </div>

                    {isProcessing && <Progress value={progress} className="h-1.5 mb-4" />}

                    <div className="flex gap-2">
                        <Button onClick={convertAudio} disabled={isProcessing} className="flex-1">
                            Convert to WAV
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
