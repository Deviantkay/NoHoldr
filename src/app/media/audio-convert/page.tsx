"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, Download, Music } from "lucide-react";

export default function AudioConvertPage() {
    const [file, setFile] = useState<File | null>(null);
    const [outputFormat, setOutputFormat] = useState("audio/wav");
    const [outputUrl, setOutputUrl] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    const formats = [
        { value: "audio/wav", label: "WAV", ext: "wav" },
        { value: "audio/webm", label: "WebM", ext: "webm" },
    ];

    const handleFile = useCallback((f: File) => {
        if (!f.type.startsWith("audio/")) return;
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
        setProgress(10);

        try {
            // Create audio context
            const audioContext = new AudioContext();
            const arrayBuffer = await file.arrayBuffer();
            setProgress(30);

            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            setProgress(50);

            // Create offline context for rendering
            const offlineContext = new OfflineAudioContext(
                audioBuffer.numberOfChannels,
                audioBuffer.length,
                audioBuffer.sampleRate
            );

            const source = offlineContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(offlineContext.destination);
            source.start();

            const renderedBuffer = await offlineContext.startRendering();
            setProgress(70);

            // Convert to WAV
            const wavBlob = audioBufferToWav(renderedBuffer);
            setProgress(90);

            const url = URL.createObjectURL(wavBlob);
            setOutputUrl(url);
            setProgress(100);
        } catch (error) {
            console.error("Conversion failed:", error);
        }

        setIsProcessing(false);
    };

    const audioBufferToWav = (buffer: AudioBuffer): Blob => {
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

        // Write audio data
        const offset = 44;
        const channelData = [];
        for (let i = 0; i < numChannels; i++) {
            channelData.push(buffer.getChannelData(i));
        }

        for (let i = 0; i < samples; i++) {
            for (let ch = 0; ch < numChannels; ch++) {
                const sample = Math.max(-1, Math.min(1, channelData[ch][i]));
                const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
                view.setInt16(offset + (i * numChannels + ch) * 2, int16, true);
            }
        }

        return new Blob([arrayBuffer], { type: "audio/wav" });
    };

    const download = () => {
        if (!outputUrl || !file) return;
        const a = document.createElement("a");
        a.href = outputUrl;
        a.download = file.name.replace(/\.[^.]+$/, "") + ".wav";
        a.click();
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/media"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">Convert Audio</h1>
            </div>

            {!file ? (
                <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById("audio-input")?.click()}
                >
                    <input type="file" accept="audio/*" onChange={handleFileSelect} className="hidden" id="audio-input" />
                    <Music className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm"><span className="font-medium">Drop audio</span> <span className="text-muted-foreground">or tap</span></p>
                </div>
            ) : (
                <>
                    <div className="border rounded-xl p-4 mb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Music className="h-5 w-5 text-purple-500" />
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
                    </div>

                    {isProcessing && (
                        <div className="mb-4">
                            <Progress value={progress} className="h-1.5" />
                        </div>
                    )}

                    {outputUrl && (
                        <div className="border rounded-xl p-4 mb-4">
                            <audio ref={audioRef} src={outputUrl} controls className="w-full" />
                        </div>
                    )}

                    <div className="flex gap-2">
                        <Button onClick={convert} disabled={isProcessing} className="flex-1 h-11">
                            Convert to WAV
                        </Button>
                        {outputUrl && (
                            <Button onClick={download} variant="outline" className="h-11">
                                <Download className="h-4 w-4 mr-2" />Download
                            </Button>
                        )}
                    </div>
                </>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">Processed locally using Web Audio API</p>
        </div>
    );
}
