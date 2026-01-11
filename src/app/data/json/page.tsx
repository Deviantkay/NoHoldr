"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Check } from "lucide-react";

export default function JSONFormatPage() {
    const [input, setInput] = useState("");
    const [output, setOutput] = useState("");
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);

    const format = () => {
        try {
            const parsed = JSON.parse(input);
            setOutput(JSON.stringify(parsed, null, 2));
            setError("");
        } catch (e) {
            setError("Invalid JSON");
            setOutput("");
        }
    };

    const minify = () => {
        try {
            const parsed = JSON.parse(input);
            setOutput(JSON.stringify(parsed));
            setError("");
        } catch (e) {
            setError("Invalid JSON");
            setOutput("");
        }
    };

    const copy = async () => {
        await navigator.clipboard.writeText(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/data"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">JSON Format</h1>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="text-sm font-medium mb-2 block">Input</label>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder='{"key": "value"}'
                        className="w-full h-64 p-3 rounded-xl border bg-muted/30 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>
                <div>
                    <label className="text-sm font-medium mb-2 block">Output</label>
                    <textarea
                        value={output}
                        readOnly
                        placeholder="Formatted JSON will appear here"
                        className="w-full h-64 p-3 rounded-xl border bg-muted/30 font-mono text-sm resize-none"
                    />
                </div>
            </div>

            {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

            <div className="flex flex-wrap gap-2">
                <Button onClick={format}>Format (Pretty)</Button>
                <Button variant="outline" onClick={minify}>Minify</Button>
                {output && (
                    <Button variant="outline" onClick={copy}>
                        {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                        {copied ? "Copied" : "Copy"}
                    </Button>
                )}
            </div>

            <p className="text-xs text-muted-foreground text-center mt-6">Processed locally</p>
        </div>
    );
}
