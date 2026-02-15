"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Check, Upload, ArrowRightLeft } from "lucide-react";

export default function Base64Page() {
    const [mode, setMode] = useState<"text" | "file">("text");
    const [direction, setDirection] = useState<"encode" | "decode">("encode");
    const [input, setInput] = useState("");
    const [output, setOutput] = useState("");
    const [fileName, setFileName] = useState("");
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState("");

    const handleTextConvert = useCallback(() => {
        setError("");
        try {
            if (direction === "encode") {
                setOutput(btoa(unescape(encodeURIComponent(input))));
            } else {
                setOutput(decodeURIComponent(escape(atob(input.trim()))));
            }
        } catch {
            setError("Invalid input for " + direction + "ing");
            setOutput("");
        }
    }, [input, direction]);

    const handleFileEncode = (file: File) => {
        setFileName(file.name);
        setError("");
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(",")[1] || result;
            setOutput(base64);
            setInput(`data:${file.type};base64,...`);
        };
        reader.readAsDataURL(file);
    };

    const handleFileDecode = () => {
        setError("");
        try {
            const binary = atob(input.trim());
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            const blob = new Blob([bytes]);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "decoded_file";
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            setError("Invalid base64 data");
        }
    };

    const copy = async (text: string) => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/data"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">Base64 Encoder / Decoder</h1>
            </div>

            <div className="flex gap-1 p-1 bg-muted rounded-lg mb-4">
                {(["text", "file"] as const).map(m => (
                    <button key={m} onClick={() => { setMode(m); setOutput(""); setError(""); }}
                        className={`flex-1 py-2 px-3 text-sm rounded-md transition-colors capitalize ${mode === m ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}>
                        {m}
                    </button>
                ))}
            </div>

            <div className="flex gap-1 p-1 bg-muted rounded-lg mb-4">
                <button onClick={() => { setDirection("encode"); setOutput(""); }}
                    className={`flex-1 py-2 px-3 text-sm rounded-md transition-colors ${direction === "encode" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}>
                    Encode →
                </button>
                <button onClick={() => { setDirection("decode"); setOutput(""); }}
                    className={`flex-1 py-2 px-3 text-sm rounded-md transition-colors ${direction === "decode" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}>
                    ← Decode
                </button>
            </div>

            {mode === "text" ? (
                <>
                    <div className="border rounded-xl p-4 mb-4">
                        <label className="text-xs text-muted-foreground mb-1 block">Input</label>
                        <textarea value={input} onChange={(e) => setInput(e.target.value)}
                            rows={5} className="w-full bg-transparent resize-none outline-none font-mono text-sm" placeholder={direction === "encode" ? "Text to encode..." : "Base64 to decode..."} />
                    </div>
                    <Button onClick={handleTextConvert} className="w-full mb-4">
                        <ArrowRightLeft className="h-4 w-4 mr-2" />{direction === "encode" ? "Encode" : "Decode"}
                    </Button>
                    {output && (
                        <div className="border rounded-xl p-4">
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-xs text-muted-foreground">Output ({output.length} chars)</label>
                                <button onClick={() => copy(output)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                                    {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />} Copy
                                </button>
                            </div>
                            <div className="font-mono text-sm break-all max-h-48 overflow-y-auto bg-muted/30 rounded-lg p-3">{output}</div>
                        </div>
                    )}
                </>
            ) : (
                <>
                    {direction === "encode" ? (
                        <div className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-primary/40 transition-colors mb-4"
                            onClick={() => document.getElementById("b64-file")?.click()}>
                            <input type="file" onChange={(e) => e.target.files?.[0] && handleFileEncode(e.target.files[0])} className="hidden" id="b64-file" />
                            <Upload className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                            <p className="text-sm">{fileName || "Choose file to encode"}</p>
                        </div>
                    ) : (
                        <div className="border rounded-xl p-4 mb-4">
                            <label className="text-xs text-muted-foreground mb-1 block">Paste base64</label>
                            <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={5}
                                className="w-full bg-transparent resize-none outline-none font-mono text-sm" placeholder="Paste base64 data..." />
                            <Button onClick={handleFileDecode} className="w-full mt-2">Download decoded file</Button>
                        </div>
                    )}
                    {output && direction === "encode" && (
                        <div className="border rounded-xl p-4">
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-xs text-muted-foreground">Base64 ({output.length} chars)</label>
                                <button onClick={() => copy(output)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                                    {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />} Copy
                                </button>
                            </div>
                            <div className="font-mono text-xs break-all max-h-48 overflow-y-auto bg-muted/30 rounded-lg p-3">{output}</div>
                        </div>
                    )}
                </>
            )}

            {error && <p className="text-sm text-destructive mt-3 text-center">{error}</p>}
            <p className="text-xs text-muted-foreground text-center mt-6">100% local • No data sent</p>
        </div>
    );
}
