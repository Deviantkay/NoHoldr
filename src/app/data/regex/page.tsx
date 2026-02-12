"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Copy, Check } from "lucide-react";

interface MatchResult { match: string; index: number; groups: string[]; }

export default function RegexTesterPage() {
    const [pattern, setPattern] = useState("(\\w+)@(\\w+\\.\\w+)");
    const [flags, setFlags] = useState("gi");
    const [testString, setTestString] = useState("Contact us at hello@example.com or support@noholdr.com for help.");
    const [matches, setMatches] = useState<MatchResult[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [highlightedHtml, setHighlightedHtml] = useState("");

    const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const runRegex = useCallback(() => {
        if (!pattern.trim()) { setMatches([]); setError(null); setHighlightedHtml(escapeHtml(testString)); return; }
        try {
            const regex = new RegExp(pattern, flags);
            setError(null);
            const results: MatchResult[] = [];
            if (flags.includes("g")) {
                let match;
                while ((match = regex.exec(testString)) !== null) {
                    results.push({ match: match[0], index: match.index, groups: match.slice(1) });
                    if (match[0].length === 0) regex.lastIndex++;
                }
            } else {
                const match = regex.exec(testString);
                if (match) results.push({ match: match[0], index: match.index, groups: match.slice(1) });
            }
            setMatches(results);
            if (results.length > 0) {
                let html = ""; let lastIndex = 0;
                const colors = ["bg-yellow-200 dark:bg-yellow-800/60", "bg-blue-200 dark:bg-blue-800/60", "bg-green-200 dark:bg-green-800/60", "bg-pink-200 dark:bg-pink-800/60"];
                for (let i = 0; i < results.length; i++) {
                    const r = results[i];
                    html += escapeHtml(testString.slice(lastIndex, r.index));
                    html += `<mark class="${colors[i % colors.length]} px-0.5 rounded">${escapeHtml(r.match)}</mark>`;
                    lastIndex = r.index + r.match.length;
                }
                html += escapeHtml(testString.slice(lastIndex));
                setHighlightedHtml(html);
            } else { setHighlightedHtml(escapeHtml(testString)); }
        } catch (err) { setError((err as Error).message); setMatches([]); setHighlightedHtml(escapeHtml(testString)); }
    }, [pattern, flags, testString]);

    useEffect(() => { const t = setTimeout(runRegex, 150); return () => clearTimeout(t); }, [runRegex]);

    const copyPattern = async () => { await navigator.clipboard.writeText(`/${pattern}/${flags}`); setCopied(true); setTimeout(() => setCopied(false), 1500); };

    const flagOptions = [
        { flag: "g", label: "Global", desc: "Find all matches" },
        { flag: "i", label: "Case Insensitive", desc: "Ignore case" },
        { flag: "m", label: "Multiline", desc: "^ and $ match line starts/ends" },
        { flag: "s", label: "Dot All", desc: ". matches newlines" },
    ];

    const commonPatterns = [
        { label: "Email", pattern: "[\\w.-]+@[\\w.-]+\\.\\w+" },
        { label: "URL", pattern: "https?://[\\w./\\-?=&#]+" },
        { label: "Phone", pattern: "\\+?\\d[\\d-.\\s()]{6,}" },
        { label: "IP Address", pattern: "\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}" },
        { label: "Date", pattern: "\\d{4}-\\d{2}-\\d{2}" },
        { label: "Hex Color", pattern: "#[0-9a-fA-F]{3,8}" },
    ];

    return (
        <div className="max-w-3xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/data"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">Regex Tester</h1>
            </div>

            <div className="border rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-muted-foreground font-mono text-lg">/</span>
                    <Input value={pattern} onChange={(e) => setPattern(e.target.value)} className="font-mono flex-1" placeholder="pattern" />
                    <span className="text-muted-foreground font-mono text-lg">/</span>
                    <Input value={flags} onChange={(e) => setFlags(e.target.value)} className="font-mono w-16" placeholder="gi" />
                    <Button variant="ghost" size="icon" onClick={copyPattern}>
                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {flagOptions.map((f) => (
                        <button key={f.flag} onClick={() => setFlags(flags.includes(f.flag) ? flags.replace(f.flag, "") : flags + f.flag)}
                            className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${flags.includes(f.flag) ? "bg-primary/10 border-primary/30 text-primary font-medium" : "text-muted-foreground"}`} title={f.desc}>
                            {f.label}
                        </button>
                    ))}
                </div>
                {error && <p className="text-xs text-destructive mt-2">{error}</p>}
            </div>

            <div className="border rounded-xl p-4 mb-4">
                <label className="text-sm font-medium mb-2 block">Test String</label>
                <textarea value={testString} onChange={(e) => setTestString(e.target.value)}
                    className="w-full h-24 p-3 text-sm font-mono bg-muted/30 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-primary/30" placeholder="Enter text to test..." />
            </div>

            <div className="border rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Result</label>
                    <span className="text-xs text-muted-foreground">{matches.length} match{matches.length !== 1 ? "es" : ""}</span>
                </div>
                <div className="p-3 text-sm font-mono bg-muted/30 rounded-lg whitespace-pre-wrap break-all leading-relaxed" dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
            </div>

            {matches.length > 0 && (
                <div className="border rounded-xl p-4 mb-4">
                    <h3 className="text-sm font-medium mb-2">Match Details</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {matches.map((m, i) => (
                            <div key={i} className="flex items-start gap-3 py-2 px-3 rounded-lg bg-muted/40 text-sm">
                                <span className="text-xs text-muted-foreground shrink-0 pt-0.5">#{i + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-mono text-xs break-all">&ldquo;{m.match}&rdquo; <span className="text-muted-foreground">at {m.index}</span></p>
                                    {m.groups.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {m.groups.map((g, j) => <span key={j} className="text-xs px-1.5 py-0.5 rounded bg-primary/10 font-mono">${j + 1}: {g}</span>)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="border rounded-xl p-4">
                <h3 className="text-sm font-medium mb-2">Common Patterns</h3>
                <div className="flex flex-wrap gap-1.5">
                    {commonPatterns.map((cp) => (
                        <button key={cp.label} onClick={() => setPattern(cp.pattern)} className="px-2.5 py-1.5 text-xs rounded-md border hover:bg-muted/50 transition-colors">{cp.label}</button>
                    ))}
                </div>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-6">JavaScript regex engine • Tested locally</p>
        </div>
    );
}
