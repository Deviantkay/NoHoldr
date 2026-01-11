"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Upload, Download, Music, Play, Pause } from "lucide-react";

export default function AudioTrimPage() {
    const [file, setFile] = useState<File | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [duration, setDuration] = useState(0);
    const [range, setRange] = useState([0, 100]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    const handleFile = useCallback((f: File) => {
        if (!f.type.startsWith("audio/")) return;
        setFile(f);
        const url = URL.createObjectURL(f);
        setAudioUrl(url);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    }, [handleFile]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) handleFile(e.target.files[0]);
    }, [handleFile]);

    const onLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
            setRange([0, 100]);
        }
    };

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.currentTime = (range[0] / 100) * duration;
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => {
            const endTime = (range[1] / 100) * duration;
            if (audio.currentTime >= endTime) {
                audio.pause();
                setIsPlaying(false);
            }
        };

        audio.addEventListener("timeupdate", handleTimeUpdate);
        return () => audio.removeEventListener("timeupdate", handleTimeUpdate);
    }, [duration, range]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    const trim = async () => {
        if (!file || !audioRef.current) return;

        const startTime = (range[0] / 100) * duration;
        const endTime = (range[1] / 100) * duration;

        // For browser-only trimming, we'll use MediaRecorder with audio element
        // This is a simplified approach - full trimming would require FFmpeg.wasm
        const audioContext = new AudioContext();
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const startSample = Math.floor(startTime * audioBuffer.sampleRate);
        const endSample = Math.floor(endTime * audioBuffer.sampleRate);
        const trimmedLength = endSample - startSample;

        const trimmedBuffer = audioContext.createBuffer(
            audioBuffer.numberOfChannels,
            trimmedLength,
            audioBuffer.sampleRate
        );

        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
            const channelData = audioBuffer.getChannelData(channel);
            const trimmedData = trimmedBuffer.getChannelData(channel);
            for (let i = 0; i < trimmedLength; i++) {
                trimmedData[i] = channelData[startSample + i];
            }
        }

        // Convert to WAV
        const wavBlob = audioBufferToWav(trimmedBuffer);
        const url = URL.createObjectURL(wavBlob);

        const a = document.createElement("a");
        a.href = url;
        a.download = file.name.replace(/\.[^.]+$/, "") + "_trimmed.wav";
        a.click();
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

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/media"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">Trim Audio</h1>
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
                    <audio ref={audioRef} src={audioUrl || ""} onLoadedMetadata={onLoadedMetadata} className="hidden" />

                    <div className="border rounded-xl p-4 mb-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <Music className="h-5 w-5 text-purple-500" />
                                <span className="text-sm font-medium">{file.name}</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => { setFile(null); setAudioUrl(null); }}>Change</Button>
                        </div>

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

                    <Button onClick={trim} className="w-full h-11">
                        <Download className="h-4 w-4 mr-2" />Trim & Download
                    </Button>
                </>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">Processed locally • Output as WAV</p>
        </div>
    );
}
