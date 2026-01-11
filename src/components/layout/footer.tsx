import Link from "next/link";

export function Footer() {
    return (
        <footer className="border-t">
            <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                    <span className="font-medium">NoHoldr</span>
                    <span>•</span>
                    <span>by Deviantkay</span>
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
                    <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
                    <Link href="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
                </div>
            </div>
        </footer>
    );
}
