"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    FileText,
    Image,
    Music,
    FolderArchive,
    Database,
    Sparkles,
    Menu,
    X,
    ArrowLeftRight
} from "lucide-react";

const navItems = [
    { name: "PDF", href: "/pdf", icon: FileText },
    { name: "Image", href: "/image", icon: Image },
    { name: "Media", href: "/media", icon: Music },
    { name: "Convert", href: "/convert", icon: ArrowLeftRight },
    { name: "Files", href: "/files", icon: FolderArchive },
    { name: "Data", href: "/data", icon: Database },
    { name: "AI", href: "/ai", icon: Sparkles },
];

export function Header() {
    const [open, setOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="max-w-6xl mx-auto px-4 flex h-12 items-center justify-between">
                {/* Logo - centered on mobile */}
                <Link href="/" className="font-bold text-lg tracking-tight">
                    NoHoldr
                </Link>

                {/* Desktop Nav - centered */}
                <nav className="hidden md:flex items-center gap-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
                        >
                            <item.icon className="h-3.5 w-3.5" />
                            <span>{item.name}</span>
                        </Link>
                    ))}
                </nav>

                {/* Mobile toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden h-9 w-9"
                    onClick={() => setOpen(!open)}
                >
                    {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
            </div>

            {/* Mobile Nav - full width grid */}
            {open && (
                <div className="md:hidden border-t bg-background">
                    <nav className="max-w-6xl mx-auto px-4 py-3 grid grid-cols-3 gap-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className="flex flex-col items-center gap-1 p-3 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted active:bg-muted"
                                onClick={() => setOpen(false)}
                            >
                                <item.icon className="h-5 w-5" />
                                <span className="text-xs font-medium">{item.name}</span>
                            </Link>
                        ))}
                    </nav>
                </div>
            )}
        </header>
    );
}
