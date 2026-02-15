"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, Music, Download, Play, Info } from "lucide-react";

const OUTPUT_FORMATS = [
    { value: "wav", label: "WAV", desc: "Uncompressed, lossless", mime: "audio/wav" },
    { value: "ogg", label: "OGG", desc: "Open format, good quality", mime: "audio/ogg" },
    { value: "webm-audio", label: "WebM Audio", desc: "Opus codec, compact", mime: "audio/webm" },
    { value: "mp3", label: "MP3 (WAV fallback)", desc: "Browser can't encode — outputs WAV", mime: "audio/wav" },
];

const SAMPLE_RATES = [8000, 16000, 22050, 44100, 48000];
const BIT_DEPTHS = [8, 16, 24, 32];

function formatBytes(b: number) { return b < 1024 ? b + " B" : b < 1048576 ? (b / 1024).toFixed(1) + " KB" : (b / 1048576).toFixed(1) + " MB"; }
function formatDuration(s: number) { const m = Math.floor(s / 60); return `${m}:${Math.floor(s % 60).toString().padStart(2, "0")}`; }

export default function AudioConverterPage() {
    const [file, setFile] = useState<File | null>(null);
    const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
    const [convertedSize, setConvertedSize] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [targetFormat, setTargetFormat] = useState("wav");
    const [sampleRate, setSampleRate] = useState(44100);
    const [bitDepth, setBitDepth] = useState(16);
    const [duration, setDuration] = useState(0);
    const [channels, setChannels] = useState<"stereo" | "mono">("stereo");
    const [normalize, setNormalize] = useState(false);
    const [error, setError] = useState("");

    const handleFile = useCallback((f: File) => {
        if (!f.type.startsWith("audio/") && !/\.(mp3|wav|ogg|m4a|aac|flac|wma|opus)$/i.test(f.name)) return;
        setFile(f); setConvertedUrl(null); setError("");
        // Get duration
        const audio = new Audio();
        audio.onloadedmetadata = () => setDuration(audio.duration);
        audio.src = URL.createObjectURL(f);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault(); setIsDragging(false);
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    }, [handleFile]);

    const audioBufferToWav = (buffer: AudioBuffer, bits: number): ArrayBuffer => {
        const numCh = buffer.numberOfChannels;
        const sr = buffer.sampleRate;
        const bps = bits / 8;
        const blockAlign = numCh * bps;
        const dataSize = buffer.length * blockAlign;
        const ab = new ArrayBuffer(44 + dataSize);
        const v = new DataView(ab);
        const ws = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
        ws(0, "RIFF"); v.setUint32(4, 36 + dataSize, true); ws(8, "WAVE"); ws(12, "fmt ");
        v.setUint32(16, 16, true); v.setUint16(20, bits === 32 ? 3 : 1, true); // PCM or Float
        v.setUint16(22, numCh, true); v.setUint32(24, sr, true);
        v.setUint32(28, sr * blockAlign, true); v.setUint16(32, blockAlign, true); v.setUint16(34, bits, true);
        ws(36, "data"); v.setUint32(40, dataSize, true);

        const chs: Float32Array[] = [];
        for (let c = 0; c < numCh; c++) chs.push(buffer.getChannelData(c));

        let off = 44;
        for (let i = 0; i < buffer.length; i++) {
            for (let c = 0; c < numCh; c++) {
                const s = Math.max(-1, Math.min(1, chs[c][i]));
                if (bits === 8) { v.setUint8(off, Math.round((s + 1) * 127.5)); off += 1; }
                else if (bits === 16) { v.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true); off += 2; }
                else if (bits === 24) { const val = s < 0 ? s * 0x800000 : s * 0x7FFFFF; v.setUint8(off, val & 0xFF); v.setUint8(off + 1, (val >> 8) & 0xFF); v.setUint8(off + 2, (val >> 16) & 0xFF); off += 3; }
                else { v.setFloat32(off, s, true); off += 4; }
            }
        }
        return ab;
    };

    const convertAudio = async () => {
        if (!file) return;
        setIsProcessing(true); setProgress(10); setError("");

        try {
            const actx = new OfflineAudioContext(
                channels === "mono" ? 1 : 2,
                Math.ceil(duration * sampleRate) || sampleRate * 10,
                sampleRate
            );

            const arrayBuffer = await file.arrayBuffer();
            setProgress(30);

            const decoded = await actx.decodeAudioData(arrayBuffer);
            setProgress(50);

            const source = actx.createBufferSource();
            source.buffer = decoded;

            if (normalize) {
                // Find peak for normalization
                let peak = 0;
                for (let c = 0; c < decoded.numberOfChannels; c++) {
                    const data = decoded.getChannelData(c);
                    for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i]));
                }
                if (peak > 0 && peak < 1) {
                    const gain = actx.createGain();
                    gain.gain.value = 1 / peak;
                    source.connect(gain);
                    gain.connect(actx.destination);
                } else {
                    source.connect(actx.destination);
                }
            } else {
                source.connect(actx.destination);
            }

            source.start();
            const rendered = await actx.startRendering();
            setProgress(70);

            let blob: Blob;
            const fmt = OUTPUT_FORMATS.find(f => f.value === targetFormat)!;

            if (targetFormat === "ogg" || targetFormat === "webm-audio") {
                // Use MediaRecorder for OGG/WebM
                const actx2 = new AudioContext({ sampleRate });
                const bufSrc = actx2.createBufferSource();
                bufSrc.buffer = rendered;
                const dest = actx2.createMediaStreamDestination();
                bufSrc.connect(dest);

                const mimeType = targetFormat === "ogg" ? "audio/ogg;codecs=opus" : "audio/webm;codecs=opus";
                const mr = new MediaRecorder(dest.stream, { mimeType });
                const chunks: Blob[] = [];
                mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

                const done = new Promise<void>(res => { mr.onstop = () => res(); });
                mr.start();
                bufSrc.start();
                bufSrc.onended = () => { setTimeout(() => mr.stop(), 100); };
                await done;
                actx2.close();

                blob = new Blob(chunks, { type: fmt.mime });
            } else {
                // WAV output
                const wavBuf = audioBufferToWav(rendered, bitDepth);
                blob = new Blob([wavBuf], { type: "audio/wav" });
            }

            setProgress(90);
            setConvertedUrl(URL.createObjectURL(blob));
            setConvertedSize(blob.size);
            setProgress(100);
        } catch (e) {
            setError((e as Error).message || "Conversion failed");
        }
        setIsProcessing(false);
    };

    const download = () => {
        if (!convertedUrl || !file) return;
        const ext = targetFormat === "webm-audio" ? "webm" : targetFormat === "mp3" ? "wav" : targetFormat;
        const a = document.createElement("a"); a.href = convertedUrl;
        a.download = file.name.replace(/\.[^.]+$/, "." + ext); a.click();
    };

    const showBitDepth = targetFormat === "wav" || targetFormat === "mp3";

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6 border-b pb-4">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/convert"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <div>
                    <h1 className="text-xl font-semibold">Audio Converter</h1>
                    <p className="text-sm text-muted-foreground">WAV • OGG • WebM Audio</p>
                </div>
            </div>

            {/* Upload */}
            <div
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors mb-4 ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onDrop={handleDrop}
                onClick={() => document.getElementById("audio-up")?.click()}
            >
                <input type="file" accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.wma,.opus" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" id="audio-up" />
                <Music className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                <p className="text-sm"><span className="font-medium">Drop audio file</span> or click</p>
                <p className="text-xs text-muted-foreground mt-1">MP3, WAV, OGG, M4A, AAC, FLAC, OPUS</p>
            </div>

            {file && (
                <>
                    {/* File info */}
                    <div className="border rounded-xl p-4 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                <Music className="h-5 w-5 text-purple-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{file.name}</p>
                                <p className="text-xs text-muted-foreground">{formatBytes(file.size)} • {duration > 0 ? formatDuration(duration) : "..."}</p>
                            </div>
                            {convertedSize > 0 && (
                                <span className="text-xs text-muted-foreground">→ {formatBytes(convertedSize)}</span>
                            )}
                        </div>
                    </div>

                    {/* Settings */}
                    <div className="border rounded-xl p-4 mb-4 space-y-3">
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Output format</label>
                            <Select value={targetFormat} onValueChange={setTargetFormat}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {OUTPUT_FORMATS.map(f => (
                                        <SelectItem key={f.value} value={f.value}>
                                            <span className="font-medium">{f.label}</span>
                                            <span className="text-xs text-muted-foreground ml-2">{f.desc}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Sample rate</label>
                                <select value={sampleRate} onChange={e => setSampleRate(+e.target.value)}
                                    className="w-full h-9 rounded-md border bg-background px-2 text-sm">
                                    {SAMPLE_RATES.map(sr => <option key={sr} value={sr}>{(sr / 1000).toFixed(sr % 1000 ? 2 : 0)} kHz</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Channels</label>
                                <select value={channels} onChange={e => setChannels(e.target.value as "stereo" | "mono")}
                                    className="w-full h-9 rounded-md border bg-background px-2 text-sm">
                                    <option value="stereo">Stereo</option>
                                    <option value="mono">Mono</option>
                                </select>
                            </div>
                        </div>

                        {showBitDepth && (
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Bit depth</label>
                                <div className="flex gap-1">
                                    {BIT_DEPTHS.map(bd => (
                                        <button key={bd} onClick={() => setBitDepth(bd)}
                                            className={`flex-1 py-1.5 text-xs rounded-md border transition-colors ${bitDepth === bd ? "bg-foreground text-background" : ""}`}>
                                            {bd}-bit
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input type="checkbox" checked={normalize} onChange={e => setNormalize(e.target.checked)} className="rounded" />
                            Normalize volume
                        </label>
                    </div>

                    {isProcessing && <Progress value={progress} className="h-2 mb-4" />}
                    {error && <p className="text-sm text-destructive text-center mb-4">{error}</p>}

                    <div className="flex gap-2">
                        <Button onClick={convertAudio} disabled={isProcessing} className="flex-1">
                            {isProcessing ? "Converting..." : `Convert to ${OUTPUT_FORMATS.find(f => f.value === targetFormat)?.label}`}
                        </Button>
                        {convertedUrl && (
                            <Button variant="outline" onClick={download}>
                                <Download className="h-4 w-4 mr-2" />Download
                            </Button>
                        )}
                    </div>

                    {targetFormat === "mp3" && (
                        <div className="flex items-start gap-2 mt-3 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                            <span>Browsers cannot encode MP3 natively. Output will be WAV format. Use FFmpeg or Audacity for true MP3 encoding.</span>
                        </div>
                    )}
                </>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">Processed locally in your browser</p>
        </div>
    );
}
