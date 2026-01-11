"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Check } from "lucide-react";

export default function Base64Page() {
    const [input, setInput] = useState("");
    const [output, setOutput] = useState("");
    const [copied, setCopied] = useState(false);

    const encode = () => {
        try {
            setOutput(btoa(unescape(encodeURIComponent(input))));
        } catch {
            setOutput("Error encoding");
        }
    };

    const decode = () => {
        try {
            setOutput(decodeURIComponent(escape(atob(input))));
        } catch {
            setOutput("Error decoding - invalid Base64");
        }
    };

    const copy = async () => {
        await navigator.clipboard.writeText(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/data"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">Base64</h1>
            </div>

            <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">Input</label>
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter text or Base64..."
                    className="w-full h-32 p-3 rounded-xl border bg-muted/30 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
            </div>

            <div className="flex gap-2 mb-4">
                <Button onClick={encode}>Encode</Button>
                <Button variant="outline" onClick={decode}>Decode</Button>
            </div>

            {output && (
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">Output</label>
                        <Button variant="ghost" size="sm" onClick={copy} className="h-7">
                            {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                            {copied ? "Copied" : "Copy"}
                        </Button>
                    </div>
                    <div className="p-3 rounded-xl border bg-muted/30 font-mono text-sm break-all">{output}</div>
                </div>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">Processed locally</p>
        </div>
    );
}
