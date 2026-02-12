import Link from "next/link";
import {
  FileText,
  Image,
  Music,
  FolderArchive,
  Database,
  Sparkles,
  ArrowLeftRight,
} from "lucide-react";

const tools = [
  { name: "PDF", href: "/pdf", icon: FileText, desc: "Merge, split, compress", count: "15" },
  { name: "Image", href: "/image", icon: Image, desc: "Crop, resize, convert", count: "8" },
  { name: "Media", href: "/media", icon: Music, desc: "Audio & video", count: "6" },
  { name: "Convert", href: "/convert", icon: ArrowLeftRight, desc: "Smart format converter", count: "New" },
  { name: "Files", href: "/files", icon: FolderArchive, desc: "ZIP, rename, dedupe", count: "5" },
  { name: "Data", href: "/data", icon: Database, desc: "CSV, JSON, QR, colors", count: "8" },
  { name: "AI", href: "/ai", icon: Sparkles, desc: "Your API key", count: "4" },
];

export default function Home() {
  return (
    <main className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-4xl mx-auto text-center">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">NoHoldr</h1>
        <p className="text-sm text-muted-foreground mb-8">Fast file tools • Local only • No uploads</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {tools.map((tool) => (
            <Link
              key={tool.name}
              href={tool.href}
              className="group relative flex flex-col items-center justify-center p-4 sm:p-6 rounded-xl border bg-card transition-all duration-150 hover:border-foreground/30 hover:shadow-sm active:scale-[0.98]"
            >
              <tool.icon className="h-6 w-6 sm:h-7 sm:w-7 mb-2 text-muted-foreground group-hover:text-foreground transition-colors" />
              <span className="font-medium text-sm sm:text-base">{tool.name}</span>
              <span className="text-xs text-muted-foreground mt-0.5">{tool.desc}</span>
              <span className="absolute top-2 right-2 text-[10px] text-muted-foreground/60">{tool.count}</span>
            </Link>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">Files processed in browser memory • Never uploaded • Never stored</p>
      </div>
    </main>
  );
}
