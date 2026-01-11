import Link from "next/link";
import { LucideIcon } from "lucide-react";
import {
    Merge,
    Split,
    Trash2,
    RotateCw,
    Minimize2,
    FileImage,
    FileText,
    FileSpreadsheet,
    Lock,
    Unlock,
    Stamp,
    Hash,
    Crop,
    Eye,
    Layers,
    GraduationCap,
    ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Tool {
    name: string;
    href: string;
    icon: LucideIcon;
    ready?: boolean;
}

const organizeTools: Tool[] = [
    { name: "Merge", href: "/pdf/merge", icon: Merge, ready: true },
    { name: "Split", href: "/pdf/split", icon: Split, ready: true },
    { name: "Academic Split", href: "/pdf/academic-split", icon: GraduationCap, ready: true },
    { name: "Remove Pages", href: "/pdf/remove-pages", icon: Trash2, ready: true },
    { name: "Rotate", href: "/pdf/rotate", icon: RotateCw, ready: true },
    { name: "Compress", href: "/pdf/compress", icon: Minimize2, ready: true },
];

const convertTools: Tool[] = [
    { name: "To Images", href: "/pdf/to-images", icon: FileImage, ready: true },
    { name: "From Images", href: "/pdf/from-images", icon: FileImage, ready: true },
];

const secureTools: Tool[] = [
    { name: "Watermark", href: "/pdf/watermark", icon: Stamp, ready: true },
    { name: "Page Numbers", href: "/pdf/page-numbers", icon: Hash, ready: true },
    { name: "Protect", href: "/pdf/protect", icon: Lock, ready: true },
    { name: "Unlock", href: "/pdf/unlock", icon: Unlock, ready: true },
    { name: "View Metadata", href: "/pdf/metadata", icon: Eye, ready: true },
];

function ToolSection({ title, tools }: { title: string; tools: Tool[] }) {
    return (
        <section className="mb-8">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">{title}</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {tools.map((tool) => (
                    <Link
                        key={tool.name}
                        href={tool.href}
                        className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-lg border bg-card transition-all duration-150 ${tool.ready ? "hover:border-foreground/30 hover:shadow-sm active:scale-[0.98]" : "opacity-40 pointer-events-none"}`}
                    >
                        <tool.icon className="h-5 w-5 mb-1.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-center leading-tight">{tool.name}</span>
                    </Link>
                ))}
            </div>
        </section>
    );
}

export default function PDFToolsPage() {
    return (
        <div className="max-w-5xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
                    <Link href="/"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <div>
                    <h1 className="text-xl font-semibold">PDF Tools</h1>
                    <p className="text-xs text-muted-foreground">Local processing only</p>
                </div>
            </div>

            <ToolSection title="ORGANIZE" tools={organizeTools} />
            <ToolSection title="CONVERT" tools={convertTools} />
            <ToolSection title="EDIT & SECURE" tools={secureTools} />
        </div>
    );
}
