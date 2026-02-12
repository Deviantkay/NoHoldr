"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Check, Eye } from "lucide-react";

export default function MarkdownPreviewPage() {
    const [markdown, setMarkdown] = useState(`# Hello World

Welcome to the **Markdown Preview** tool.

## Features
- Real-time preview
- Supports **bold**, *italic*, ~~strikethrough~~
- Code blocks, lists, links, and more

### Code Example
\`\`\`javascript
function greet(name) {
    return \`Hello, \${name}!\`;
}
\`\`\`

> This is a blockquote.

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Row 1    | Data     | Value    |
| Row 2    | Data     | Value    |

[Visit NoHoldr](https://noholdr.com)

---

1. First item
2. Second item
3. Third item
`);
    const [copied, setCopied] = useState(false);
    const [view, setView] = useState<"split" | "edit" | "preview">("split");

    const copy = async () => {
        await navigator.clipboard.writeText(markdown);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    // Simple markdown to HTML converter (no dependencies)
    const toHtml = (md: string): string => {
        let html = md;

        // Code blocks (fenced)
        html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) =>
            `<pre class="md-pre"><code class="md-code">${escapeHtml(code.trim())}</code></pre>`
        );

        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>');

        // Tables
        html = html.replace(/^(\|.+\|)\n(\|[-: |]+\|)\n((?:\|.+\|\n?)+)/gm, (_m, header, _sep, body) => {
            const headers = header.split("|").filter(Boolean).map((h: string) => `<th class="md-th">${h.trim()}</th>`).join("");
            const rows = body.trim().split("\n").map((row: string) => {
                const cells = row.split("|").filter(Boolean).map((c: string) => `<td class="md-td">${c.trim()}</td>`).join("");
                return `<tr>${cells}</tr>`;
            }).join("");
            return `<table class="md-table"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
        });

        // Headings
        html = html.replace(/^#{6}\s+(.+)$/gm, '<h6 class="md-h6">$1</h6>');
        html = html.replace(/^#{5}\s+(.+)$/gm, '<h5 class="md-h5">$1</h5>');
        html = html.replace(/^#{4}\s+(.+)$/gm, '<h4 class="md-h4">$1</h4>');
        html = html.replace(/^###\s+(.+)$/gm, '<h3 class="md-h3">$1</h3>');
        html = html.replace(/^##\s+(.+)$/gm, '<h2 class="md-h2">$1</h2>');
        html = html.replace(/^#\s+(.+)$/gm, '<h1 class="md-h1">$1</h1>');

        // Horizontal rule
        html = html.replace(/^---+$/gm, '<hr class="md-hr" />');

        // Blockquote
        html = html.replace(/^>\s+(.+)$/gm, '<blockquote class="md-bq">$1</blockquote>');

        // Bold + Italic
        html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
        html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="md-link" target="_blank" rel="noopener">$1</a>');

        // Images
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="md-img" />');

        // Unordered lists
        html = html.replace(/^[-*]\s+(.+)$/gm, '<li class="md-li">$1</li>');
        html = html.replace(/((?:<li class="md-li">.*<\/li>\n?)+)/g, '<ul class="md-ul">$1</ul>');

        // Ordered lists
        html = html.replace(/^\d+\.\s+(.+)$/gm, '<li class="md-oli">$1</li>');
        html = html.replace(/((?:<li class="md-oli">.*<\/li>\n?)+)/g, '<ol class="md-ol">$1</ol>');

        // Paragraphs (remaining text blocks)
        html = html.replace(/\n\n/g, '</p><p class="md-p">');
        html = '<p class="md-p">' + html + '</p>';

        // Clean up empty paragraphs
        html = html.replace(/<p class="md-p">\s*<\/p>/g, '');
        html = html.replace(/<p class="md-p">\s*(<h[1-6]|<pre|<table|<ul|<ol|<hr|<blockquote)/g, '$1');
        html = html.replace(/(<\/h[1-6]>|<\/pre>|<\/table>|<\/ul>|<\/ol>|<hr \/>|<\/blockquote>)\s*<\/p>/g, '$1');

        return html;
    };

    const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const previewStyles = `
        .md-h1 { font-size: 1.75em; font-weight: 700; margin: 0.5em 0 0.3em; border-bottom: 1px solid var(--border-color, #e5e7eb); padding-bottom: 0.2em; }
        .md-h2 { font-size: 1.4em; font-weight: 600; margin: 0.5em 0 0.3em; border-bottom: 1px solid var(--border-color, #e5e7eb); padding-bottom: 0.2em; }
        .md-h3 { font-size: 1.15em; font-weight: 600; margin: 0.5em 0 0.3em; }
        .md-h4, .md-h5, .md-h6 { font-size: 1em; font-weight: 600; margin: 0.5em 0 0.3em; }
        .md-p { margin: 0.6em 0; line-height: 1.7; }
        .md-pre { background: #1e1e2e; color: #cdd6f4; padding: 12px 16px; border-radius: 8px; overflow-x: auto; margin: 0.8em 0; font-size: 0.85em; }
        .md-code { font-family: 'Fira Code', 'Consolas', monospace; }
        .md-inline-code { background: rgba(100,100,100,0.15); padding: 2px 6px; border-radius: 4px; font-size: 0.9em; font-family: 'Fira Code', 'Consolas', monospace; }
        .md-bq { border-left: 3px solid #6366f1; padding: 8px 16px; margin: 0.8em 0; color: #666; background: rgba(99,102,241,0.05); border-radius: 0 6px 6px 0; }
        .md-ul, .md-ol { padding-left: 1.5em; margin: 0.6em 0; }
        .md-li, .md-oli { margin: 0.2em 0; }
        .md-link { color: #6366f1; text-decoration: underline; }
        .md-hr { border: none; border-top: 1px solid #e5e7eb; margin: 1.2em 0; }
        .md-table { border-collapse: collapse; width: 100%; margin: 0.8em 0; }
        .md-th { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; font-weight: 600; background: rgba(0,0,0,0.03); }
        .md-td { border: 1px solid #e5e7eb; padding: 8px 12px; }
        .md-img { max-width: 100%; border-radius: 8px; margin: 0.5em 0; }
    `;

    const lines = markdown.split("\n").length;
    const words = markdown.split(/\s+/).filter(Boolean).length;

    return (
        <div className="max-w-5xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link href="/data"><ArrowLeft className="h-4 w-4" /></Link>
                    </Button>
                    <h1 className="text-lg font-semibold">Markdown Preview</h1>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{words} words • {lines} lines</span>
                    <Button variant="ghost" size="sm" onClick={copy}>
                        {copied ? <Check className="h-3 w-3 mr-1 text-green-500" /> : <Copy className="h-3 w-3 mr-1" />}
                        {copied ? "Copied" : "Copy"}
                    </Button>
                </div>
            </div>

            {/* View toggle */}
            <div className="flex gap-1 p-1 bg-muted rounded-lg mb-4">
                {(["split", "edit", "preview"] as const).map((v) => (
                    <button
                        key={v}
                        onClick={() => setView(v)}
                        className={`flex-1 py-2 px-3 text-sm rounded-md transition-colors capitalize ${view === v ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}
                    >
                        {v === "split" ? "Split" : v === "edit" ? "Edit" : "Preview"}
                    </button>
                ))}
            </div>

            {/* Editor + Preview */}
            <div className={`gap-4 ${view === "split" ? "grid grid-cols-2" : ""}`}>
                {(view === "split" || view === "edit") && (
                    <div className="border rounded-xl overflow-hidden">
                        <textarea
                            value={markdown}
                            onChange={(e) => setMarkdown(e.target.value)}
                            className="w-full h-[65vh] p-4 text-sm font-mono bg-background resize-none focus:outline-none"
                            placeholder="Type your markdown here..."
                            spellCheck={false}
                        />
                    </div>
                )}

                {(view === "split" || view === "preview") && (
                    <div className="border rounded-xl overflow-hidden">
                        <style dangerouslySetInnerHTML={{ __html: previewStyles }} />
                        <div
                            className="p-4 h-[65vh] overflow-y-auto text-sm"
                            dangerouslySetInnerHTML={{ __html: toHtml(markdown) }}
                        />
                    </div>
                )}
            </div>

            <p className="text-xs text-muted-foreground text-center mt-6">Rendered locally • No data sent anywhere</p>
        </div>
    );
}
