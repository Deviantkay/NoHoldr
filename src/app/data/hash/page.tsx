"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Check } from "lucide-react";

export default function HashPage() {
    const [input, setInput] = useState("");
    const [hashes, setHashes] = useState<{ algo: string; hash: string }[]>([]);
    const [copied, setCopied] = useState<string | null>(null);

    const calculate = async () => {
        if (!input) return;
        const encoder = new TextEncoder();
        const data = encoder.encode(input);

        const algos = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];
        const results = await Promise.all(
            algos.map(async (algo) => {
                const hashBuffer = await crypto.subtle.digest(algo, data);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
                return { algo, hash: hashHex };
            })
        );
        setHashes(results);
    };

    const copy = async (hash: string, algo: string) => {
        await navigator.clipboard.writeText(hash);
        setCopied(algo);
        setTimeout(() => setCopied(null), 1500);
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/data"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">Text Hash</h1>
            </div>

            <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">Input Text</label>
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter text to hash..."
                    className="w-full h-32 p-3 rounded-xl border bg-muted/30 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
            </div>

            <Button onClick={calculate} className="mb-4">Calculate Hashes</Button>

            {hashes.length > 0 && (
                <div className="space-y-2">
                    {hashes.map(({ algo, hash }) => (
                        <div key={algo} className="flex items-center gap-2 p-3 rounded-xl border bg-muted/30">
                            <span className="text-xs font-medium w-20">{algo}</span>
                            <code className="flex-1 text-xs font-mono truncate">{hash}</code>
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => copy(hash, algo)}>
                                {copied === algo ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">Processed locally</p>
        </div>
    );
}
