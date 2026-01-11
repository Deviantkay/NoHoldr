import Link from "next/link";
import { LucideIcon } from "lucide-react";
import {
    ArrowLeft,
    Minimize2,
    Maximize2,
    Crop,
    RotateCw,
    FileImage,
    Eye,
    Pen,
    Trash2,
    Layers,
    Droplet,
    Stamp
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Tool {
    name: string;
    href: string;
    icon: LucideIcon;
    ready?: boolean;
}

const editTools: Tool[] = [
    { name: "Compress", href: "/image/compress", icon: Minimize2, ready: true },
    { name: "Resize", href: "/image/resize", icon: Maximize2, ready: true },
    { name: "Crop", href: "/image/crop", icon: Crop, ready: true },
    { name: "Rotate", href: "/image/rotate", icon: RotateCw, ready: true },
    { name: "Watermark", href: "/image/watermark", icon: Stamp, ready: true },
];

const convertTools: Tool[] = [
    { name: "Convert", href: "/image/convert", icon: FileImage, ready: true },
];

const metadataTools: Tool[] = [
    { name: "View EXIF", href: "/image/metadata", icon: Eye, ready: true },
    { name: "Remove EXIF", href: "/image/remove-metadata", icon: Trash2, ready: true },
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

export default function ImageToolsPage() {
    return (
        <div className="max-w-5xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
                    <Link href="/"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <div>
                    <h1 className="text-xl font-semibold">Image Tools</h1>
                    <p className="text-xs text-muted-foreground">Local processing only</p>
                </div>
            </div>

            <ToolSection title="EDIT" tools={editTools} />
            <ToolSection title="CONVERT" tools={convertTools} />
            <ToolSection title="METADATA" tools={metadataTools} />
        </div>
    );
}
