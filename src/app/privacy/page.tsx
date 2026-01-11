import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">Privacy</h1>
            </div>

            <div className="space-y-4 text-sm">
                <section className="p-4 rounded-xl border bg-muted/30 font-mono text-xs">
                    Your File → Browser Memory → Processing → Download<br />
                    <span className="text-muted-foreground">↳ No server, no storage, no tracking</span>
                </section>

                <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl border">
                        <h3 className="font-medium mb-2 text-green-600">We Do</h3>
                        <ul className="space-y-1 text-muted-foreground text-xs">
                            <li>✓ Process locally</li>
                            <li>✓ Use browser memory only</li>
                            <li>✓ Clear on page close</li>
                        </ul>
                    </div>
                    <div className="p-4 rounded-xl border">
                        <h3 className="font-medium mb-2 text-red-600">We Don{"'"}t</h3>
                        <ul className="space-y-1 text-muted-foreground text-xs">
                            <li>✗ Upload files</li>
                            <li>✗ Store anything</li>
                            <li>✗ Track users</li>
                        </ul>
                    </div>
                </div>

                <section className="p-4 rounded-xl border border-amber-200 dark:border-amber-800">
                    <h2 className="font-medium mb-1">Limitations</h2>
                    <p className="text-muted-foreground text-xs">
                        Browser extensions, OS caching, and memory persistence may affect data. We reduce risk but can{"'"}t guarantee absolute security.
                    </p>
                </section>
            </div>

            <div className="flex gap-4 text-sm text-muted-foreground mt-6">
                <Link href="/about" className="hover:text-foreground">About</Link>
                <Link href="/faq" className="hover:text-foreground">FAQ</Link>
            </div>
        </div>
    );
}
