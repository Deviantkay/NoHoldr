import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Eye, User, Code } from "lucide-react";

const principles = [
    { icon: User, title: "User Control", desc: "You decide. Tools assist, never automate." },
    { icon: Shield, title: "Local Only", desc: "Files stay in your browser. Never uploaded." },
    { icon: Eye, title: "Honest", desc: "No false promises. We reduce risk, not eliminate it." },
    { icon: Code, title: "Open Source", desc: "Audit the code yourself." },
];

export default function AboutPage() {
    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">About NoHoldr</h1>
            </div>

            <p className="text-muted-foreground mb-6">
                Fast file tools that run locally in your browser. No uploads, no accounts, no tracking.
            </p>

            <div className="grid gap-3 mb-6">
                {principles.map(p => (
                    <div key={p.title} className="flex items-start gap-3 p-4 rounded-xl border">
                        <p.icon className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
                        <div>
                            <h3 className="font-medium text-sm">{p.title}</h3>
                            <p className="text-sm text-muted-foreground">{p.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex gap-4 text-sm text-muted-foreground">
                <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
                <Link href="/faq" className="hover:text-foreground">FAQ</Link>
                <Link href="/legal" className="hover:text-foreground">Legal</Link>
            </div>
        </div>
    );
}
