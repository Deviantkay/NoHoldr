import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { ArrowLeft, FileJson, FileSpreadsheet, Hash, Code, FileText, Binary } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Tool { name: string; href: string; icon: LucideIcon; ready?: boolean; }

const dataTools: Tool[] = [
    { name: "JSON Format", href: "/data/json", icon: FileJson, ready: true },
    { name: "CSV Viewer", href: "/data/csv", icon: FileSpreadsheet, ready: true },
    { name: "Text Hash", href: "/data/hash", icon: Hash, ready: true },
    { name: "Base64", href: "/data/base64", icon: Binary, ready: true },
    { name: "URL Encode", href: "/data/url-encode", icon: Code, ready: true },
    { name: "Text Diff", href: "/data/diff", icon: FileText, ready: true },
];

function ToolSection({ title, tools }: { title: string; tools: Tool[] }) {
    return (
        <section className="mb-8">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">{title}</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {tools.map((tool) => (
                    <Link key={tool.name} href={tool.href} className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-lg border bg-card transition-all duration-150 ${tool.ready ? "hover:border-foreground/30 hover:shadow-sm active:scale-[0.98]" : "opacity-40 pointer-events-none"}`}>
                        <tool.icon className="h-5 w-5 mb-1.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-center leading-tight">{tool.name}</span>
                    </Link>
                ))}
            </div>
        </section>
    );
}

export default function DataToolsPage() {
    return (
        <div className="max-w-5xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
                    <Link href="/"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <div>
                    <h1 className="text-xl font-semibold">Data Tools</h1>
                    <p className="text-xs text-muted-foreground">Text, JSON, CSV utilities</p>
                </div>
            </div>
            <ToolSection title="DATA UTILITIES" tools={dataTools} />
        </div>
    );
}
