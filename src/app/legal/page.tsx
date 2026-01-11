import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function LegalPage() {
    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">Legal</h1>
            </div>

            <div className="space-y-4 text-sm">
                <section className="p-4 rounded-xl border bg-muted/30">
                    <p className="text-muted-foreground">
                        This software is provided <strong>"AS IS"</strong> without warranty.
                    </p>
                </section>

                <section>
                    <h2 className="font-medium mb-2">Responsibility</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left">
                                    <th className="py-2 font-medium">Action</th>
                                    <th className="py-2 font-medium">Responsible</th>
                                </tr>
                            </thead>
                            <tbody className="text-muted-foreground">
                                <tr className="border-b"><td className="py-2">Using software</td><td>User</td></tr>
                                <tr className="border-b"><td className="py-2">Processing files</td><td>User</td></tr>
                                <tr className="border-b"><td className="py-2">Forking/modifying</td><td>Fork author</td></tr>
                                <tr><td className="py-2">Commercial use</td><td>Commercial entity</td></tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="p-4 rounded-xl border">
                    <h2 className="font-medium mb-1">Contact</h2>
                    <p className="text-muted-foreground">
                        GitHub: <a href="https://github.com/Deviantkay" className="underline hover:text-foreground">Deviantkay</a>
                    </p>
                </section>
            </div>

            <div className="flex gap-4 text-sm text-muted-foreground mt-6">
                <Link href="/about" className="hover:text-foreground">About</Link>
                <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            </div>
        </div>
    );
}
