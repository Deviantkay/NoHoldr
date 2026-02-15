"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, FileText, Download, Copy, Check, Info } from "lucide-react";

const OUTPUT_FORMATS = [
    { value: "txt", label: "Plain Text (.txt)", desc: "Extract text content", ext: "txt" },
    { value: "html", label: "HTML (.html)", desc: "Web page format", ext: "html" },
    { value: "md", label: "Markdown (.md)", desc: "Markdown format", ext: "md" },
    { value: "csv-from-json", label: "CSV (from JSON)", desc: "JSON array → CSV", ext: "csv" },
    { value: "json-from-csv", label: "JSON (from CSV)", desc: "CSV → JSON array", ext: "json" },
    { value: "xml-from-json", label: "XML (from JSON)", desc: "JSON → XML", ext: "xml" },
];

function formatBytes(b: number) { return b < 1024 ? b + " B" : b < 1048576 ? (b / 1024).toFixed(1) + " KB" : (b / 1048576).toFixed(1) + " MB"; }

function csvToJson(csv: string): string {
    const lines = csv.trim().split("\n");
    if (lines.length < 2) return "[]";
    const headers = parseCsvLine(lines[0]);
    const result = lines.slice(1).map(line => {
        const values = parseCsvLine(line);
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => { obj[h.trim()] = (values[i] || "").trim(); });
        return obj;
    });
    return JSON.stringify(result, null, 2);
}

function parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
        if (char === '"') { inQuotes = !inQuotes; }
        else if (char === "," && !inQuotes) { result.push(current); current = ""; }
        else { current += char; }
    }
    result.push(current);
    return result;
}

function jsonToCsv(json: string): string {
    const data = JSON.parse(json);
    if (!Array.isArray(data) || data.length === 0) return "";
    const headers = Object.keys(data[0]);
    const rows = data.map((row: Record<string, unknown>) =>
        headers.map(h => {
            const val = String(row[h] ?? "");
            return val.includes(",") || val.includes('"') || val.includes("\n") ? `"${val.replace(/"/g, '""')}"` : val;
        }).join(",")
    );
    return [headers.join(","), ...rows].join("\n");
}

function jsonToXml(json: string): string {
    const data = JSON.parse(json);
    const toXml = (obj: unknown, tag: string): string => {
        if (obj === null || obj === undefined) return `<${tag}/>`;
        if (Array.isArray(obj)) return obj.map(item => toXml(item, "item")).join("\n");
        if (typeof obj === "object") {
            const entries = Object.entries(obj as Record<string, unknown>)
                .map(([k, v]) => toXml(v, k)).join("\n  ");
            return `<${tag}>\n  ${entries}\n</${tag}>`;
        }
        return `<${tag}>${String(obj).replace(/&/g, "&amp;").replace(/</g, "&lt;")}</${tag}>`;
    };
    return `<?xml version="1.0" encoding="UTF-8"?>\n${toXml(data, "root")}`;
}

function textToHtml(text: string, fileName: string): string {
    const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const paragraphs = escaped.split(/\n\n+/).map(p => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("\n");
    return `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>${fileName}</title>\n  <style>body{font-family:system-ui,sans-serif;max-width:800px;margin:2rem auto;padding:0 1rem;line-height:1.6;color:#333}p{margin:0 0 1rem}</style>\n</head>\n<body>\n${paragraphs}\n</body>\n</html>`;
}

function textToMarkdown(text: string): string {
    // Simple: keep text as-is, wrap paragraphs
    return text.split(/\n\n+/).join("\n\n");
}

export default function DocumentConverterPage() {
    const [file, setFile] = useState<File | null>(null);
    const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
    const [convertedSize, setConvertedSize] = useState(0);
    const [convertedName, setConvertedName] = useState("");
    const [preview, setPreview] = useState("");
    const [isDragging, setIsDragging] = useState(false);
    const [targetFormat, setTargetFormat] = useState("txt");
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);

    const handleFile = useCallback((f: File) => {
        setFile(f); setConvertedUrl(null); setError(""); setPreview("");
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault(); setIsDragging(false);
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    }, [handleFile]);

    const convert = async () => {
        if (!file) return;
        setError("");

        try {
            const text = await file.text();
            let output = "";
            const fmt = OUTPUT_FORMATS.find(f => f.value === targetFormat)!;

            switch (targetFormat) {
                case "txt":
                    output = text;
                    break;
                case "html":
                    output = textToHtml(text, file.name);
                    break;
                case "md":
                    output = textToMarkdown(text);
                    break;
                case "csv-from-json":
                    output = jsonToCsv(text);
                    break;
                case "json-from-csv":
                    output = csvToJson(text);
                    break;
                case "xml-from-json":
                    output = jsonToXml(text);
                    break;
            }

            const blob = new Blob([output], { type: "text/plain" });
            const name = file.name.replace(/\.[^.]+$/, "." + fmt.ext);
            setConvertedUrl(URL.createObjectURL(blob));
            setConvertedSize(blob.size);
            setConvertedName(name);
            setPreview(output.substring(0, 500));
        } catch (e) {
            setError((e as Error).message || "Conversion failed");
        }
    };

    const download = () => {
        if (!convertedUrl) return;
        const a = document.createElement("a"); a.href = convertedUrl; a.download = convertedName; a.click();
    };

    const copyOutput = async () => {
        if (!preview) return;
        const text = await (await fetch(convertedUrl!)).text();
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    // Determine compatible formats based on file type
    const getCompatible = () => {
        if (!file) return OUTPUT_FORMATS;
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (ext === "json") return OUTPUT_FORMATS.filter(f => ["txt", "csv-from-json", "xml-from-json", "html", "md"].includes(f.value));
        if (ext === "csv") return OUTPUT_FORMATS.filter(f => ["txt", "json-from-csv", "html", "md"].includes(f.value));
        return OUTPUT_FORMATS.filter(f => ["txt", "html", "md"].includes(f.value));
    };

    const compatible = getCompatible();

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6 border-b pb-4">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/convert"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <div>
                    <h1 className="text-xl font-semibold">Document Converter</h1>
                    <p className="text-sm text-muted-foreground">TXT • HTML • Markdown • CSV ↔ JSON • XML</p>
                </div>
            </div>

            {/* Upload */}
            <div
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors mb-4 ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onDrop={handleDrop}
                onClick={() => document.getElementById("doc-up")?.click()}
            >
                <input type="file" accept=".txt,.csv,.json,.xml,.md,.html,.htm,.tsv,.log" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" id="doc-up" />
                <FileText className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                <p className="text-sm"><span className="font-medium">Drop document</span> or click</p>
                <p className="text-xs text-muted-foreground mt-1">TXT, CSV, JSON, XML, MD, HTML, LOG</p>
            </div>

            {file && (
                <>
                    {/* File info */}
                    <div className="border rounded-xl p-4 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                <FileText className="h-5 w-5 text-purple-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{file.name}</p>
                                <p className="text-xs text-muted-foreground">{formatBytes(file.size)}{convertedSize ? ` → ${formatBytes(convertedSize)}` : ""}</p>
                            </div>
                        </div>
                    </div>

                    {/* Settings */}
                    <div className="border rounded-xl p-4 mb-4">
                        <label className="text-xs text-muted-foreground mb-1 block">Convert to</label>
                        <Select value={targetFormat} onValueChange={setTargetFormat}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {compatible.map(f => (
                                    <SelectItem key={f.value} value={f.value}>
                                        <span className="font-medium">{f.label}</span>
                                        <span className="text-xs text-muted-foreground ml-2">{f.desc}</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {error && <p className="text-sm text-destructive text-center mb-4">{error}</p>}

                    <Button onClick={convert} className="w-full mb-4">
                        Convert to {OUTPUT_FORMATS.find(f => f.value === targetFormat)?.label}
                    </Button>

                    {/* Preview */}
                    {preview && (
                        <div className="border rounded-xl p-4 mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-muted-foreground">Preview</span>
                                <button onClick={copyOutput} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                                    {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />} Copy all
                                </button>
                            </div>
                            <pre className="text-xs font-mono bg-muted/30 rounded-lg p-3 max-h-48 overflow-auto whitespace-pre-wrap">{preview}{preview.length >= 500 ? "\n..." : ""}</pre>
                        </div>
                    )}

                    {convertedUrl && (
                        <Button variant="outline" onClick={download} className="w-full">
                            <Download className="h-4 w-4 mr-2" />Download {convertedName}
                        </Button>
                    )}

                    <div className="flex items-start gap-2 mt-4 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <span>For PDF/DOCX conversion, use the PDF tools section. This converter handles text-based formats (TXT, CSV, JSON, XML, MD, HTML).</span>
                    </div>
                </>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">All processing in browser • Nothing uploaded</p>
        </div>
    );
}
