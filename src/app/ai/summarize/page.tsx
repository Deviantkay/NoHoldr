"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, FileText, Copy, Check } from "lucide-react";
import { generateWithSystem, hasApiKey, getErrorMessage } from "@/lib/gemini";

export default function SummarizePage() {
    const [input, setInput] = useState("");
    const [summary, setSummary] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const summarize = async () => {
        if (!input.trim() || isLoading) return;
        if (!hasApiKey()) {
            setError("Please configure your API key in the AI hub first.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setSummary("");

        try {
            const systemInstruction = `You are a helpful assistant that summarizes text. 
Provide a clear, concise summary that captures the key points.
Keep the summary brief but comprehensive.
Use bullet points for multiple main ideas if appropriate.`;

            const result = await generateWithSystem(systemInstruction, `Summarize the following text:\n\n${input}`);
            setSummary(result);
        } catch (err) {
            setError(getErrorMessage(err));
        }

        setIsLoading(false);
    };

    const copyToClipboard = async () => {
        await navigator.clipboard.writeText(summary);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/ai"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <div>
                    <h1 className="text-lg font-semibold flex items-center gap-2">
                        <FileText className="h-5 w-5" /> Summarize
                    </h1>
                    <p className="text-xs text-muted-foreground">Condense long text</p>
                </div>
            </div>

            {/* Input */}
            <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">Text to summarize</label>
                <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Paste your text here..."
                    className="min-h-[200px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                    {input.length} characters
                </p>
            </div>

            {/* Error */}
            {error && (
                <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20 p-3 mb-4">
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
            )}

            {/* Action */}
            <Button onClick={summarize} disabled={!input.trim() || isLoading} className="w-full mb-6">
                {isLoading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Summarizing...</>
                ) : (
                    "Summarize"
                )}
            </Button>

            {/* Result */}
            {summary && (
                <div className="rounded-xl border p-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium">Summary</span>
                        <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                            {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                            {copied ? "Copied" : "Copy"}
                        </Button>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <p className="whitespace-pre-wrap text-sm">{summary}</p>
                    </div>
                </div>
            )}

            <p className="text-xs text-muted-foreground text-center mt-8">
                Requests go directly to Google Gemini
            </p>
        </div>
    );
}
