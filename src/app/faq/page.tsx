import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const faqs = [
    { q: "Are files uploaded?", a: "No. All processing happens in your browser." },
    { q: "Are files stored?", a: "No. Files only exist in browser memory." },
    { q: "Is it 100% safe?", a: "No absolute guarantees. Browsers have inherent risks." },
    { q: "Can I use offline?", a: "Yes, after initial load. AI features need network." },
    { q: "Can I fork this?", a: "Yes. MIT license with attribution." },
];

export default function FAQPage() {
    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">FAQ</h1>
            </div>

            <div className="space-y-3 mb-6">
                {faqs.map((f, i) => (
                    <div key={i} className="p-4 rounded-xl border">
                        <h3 className="font-medium text-sm mb-1">{f.q}</h3>
                        <p className="text-sm text-muted-foreground">{f.a}</p>
                    </div>
                ))}
            </div>

            <a
                href="https://github.com/Deviantkay/NoHoldr/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground"
            >
                More questions? Open a GitHub issue →
            </a>
        </div>
    );
}
