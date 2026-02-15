"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Check, Upload, Hash } from "lucide-react";

type HashAlgo = "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";
const ALGOS: HashAlgo[] = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];

function toHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function md5(str: string): string {
    // Minimal MD5 implementation for completeness
    function md5cycle(x: number[], k: number[]) {
        let a = x[0], b = x[1], c = x[2], d = x[3];
        const f = (b: number, c: number, d: number) => (b & c) | (~b & d);
        const g = (b: number, c: number, d: number) => (d & b) | (~d & c);
        const h = (b: number, c: number, d: number) => b ^ c ^ d;
        const ii = (b: number, c: number, d: number) => c ^ (b | ~d);
        const rl = (v: number, s: number) => (v << s) | (v >>> (32 - s));
        const cmn = (q: number, a: number, b: number, x: number, s: number, t: number) => {
            a = (a + q + x + t) | 0;
            return ((rl(a, s) + b) | 0);
        };
        const ff = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => cmn(f(b, c, d), a, b, x, s, t);
        const gg = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => cmn(g(b, c, d), a, b, x, s, t);
        const hh = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => cmn(h(b, c, d), a, b, x, s, t);
        const iii = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => cmn(ii(b, c, d), a, b, x, s, t);

        a = ff(a, b, c, d, k[0], 7, -680876936); d = ff(d, a, b, c, k[1], 12, -389564586); c = ff(c, d, a, b, k[2], 17, 606105819); b = ff(b, c, d, a, k[3], 22, -1044525330);
        a = ff(a, b, c, d, k[4], 7, -176418897); d = ff(d, a, b, c, k[5], 12, 1200080426); c = ff(c, d, a, b, k[6], 17, -1473231341); b = ff(b, c, d, a, k[7], 22, -45705983);
        a = ff(a, b, c, d, k[8], 7, 1770035416); d = ff(d, a, b, c, k[9], 12, -1958414417); c = ff(c, d, a, b, k[10], 17, -42063); b = ff(b, c, d, a, k[11], 22, -1990404162);
        a = ff(a, b, c, d, k[12], 7, 1804603682); d = ff(d, a, b, c, k[13], 12, -40341101); c = ff(c, d, a, b, k[14], 17, -1502002290); b = ff(b, c, d, a, k[15], 22, 1236535329);
        a = gg(a, b, c, d, k[1], 5, -165796510); d = gg(d, a, b, c, k[6], 9, -1069501632); c = gg(c, d, a, b, k[11], 14, 643717713); b = gg(b, c, d, a, k[0], 20, -373897302);
        a = gg(a, b, c, d, k[5], 5, -701558691); d = gg(d, a, b, c, k[10], 9, 38016083); c = gg(c, d, a, b, k[15], 14, -660478335); b = gg(b, c, d, a, k[4], 20, -405537848);
        a = gg(a, b, c, d, k[9], 5, 568446438); d = gg(d, a, b, c, k[14], 9, -1019803690); c = gg(c, d, a, b, k[3], 14, -187363961); b = gg(b, c, d, a, k[8], 20, 1163531501);
        a = gg(a, b, c, d, k[13], 5, -1444681467); d = gg(d, a, b, c, k[2], 9, -51403784); c = gg(c, d, a, b, k[7], 14, 1735328473); b = gg(b, c, d, a, k[12], 20, -1926607734);
        a = hh(a, b, c, d, k[5], 4, -378558); d = hh(d, a, b, c, k[8], 11, -2022574463); c = hh(c, d, a, b, k[11], 16, 1839030562); b = hh(b, c, d, a, k[14], 23, -35309556);
        a = hh(a, b, c, d, k[1], 4, -1530992060); d = hh(d, a, b, c, k[4], 11, 1272893353); c = hh(c, d, a, b, k[7], 16, -155497632); b = hh(b, c, d, a, k[10], 23, -1094730640);
        a = hh(a, b, c, d, k[13], 4, 681279174); d = hh(d, a, b, c, k[0], 11, -358537222); c = hh(c, d, a, b, k[3], 16, -722521979); b = hh(b, c, d, a, k[6], 23, 76029189);
        a = hh(a, b, c, d, k[9], 4, -640364487); d = hh(d, a, b, c, k[12], 11, -421815835); c = hh(c, d, a, b, k[15], 16, 530742520); b = hh(b, c, d, a, k[2], 23, -995338651);
        a = iii(a, b, c, d, k[0], 6, -198630844); d = iii(d, a, b, c, k[7], 10, 1126891415); c = iii(c, d, a, b, k[14], 15, -1416354905); b = iii(b, c, d, a, k[5], 21, -57434055);
        a = iii(a, b, c, d, k[12], 6, 1700485571); d = iii(d, a, b, c, k[3], 10, -1894986606); c = iii(c, d, a, b, k[10], 15, -1051523); b = iii(b, c, d, a, k[1], 21, -2054922799);
        a = iii(a, b, c, d, k[8], 6, 1873313359); d = iii(d, a, b, c, k[15], 10, -30611744); c = iii(c, d, a, b, k[6], 15, -1560198380); b = iii(b, c, d, a, k[13], 21, 1309151649);
        a = iii(a, b, c, d, k[4], 6, -145523070); d = iii(d, a, b, c, k[11], 10, -1120210379); c = iii(c, d, a, b, k[2], 15, 718787259); b = iii(b, c, d, a, k[9], 21, -343485551);
        x[0] = (a + x[0]) | 0; x[1] = (b + x[1]) | 0; x[2] = (c + x[2]) | 0; x[3] = (d + x[3]) | 0;
    }

    function md5blk(s: string) {
        const md5blks: number[] = [];
        for (let i = 0; i < 64; i += 4)
            md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
        return md5blks;
    }

    let n = str.length;
    let state = [1732584193, -271733879, -1732584194, 271733878];
    let i;
    for (i = 64; i <= n; i += 64) md5cycle(state, md5blk(str.substring(i - 64, i)));
    str = str.substring(i - 64);
    const tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (i = 0; i < str.length; i++) tail[i >> 2] |= str.charCodeAt(i) << ((i % 4) << 3);
    tail[i >> 2] |= 0x80 << ((i % 4) << 3);
    if (i > 55) { md5cycle(state, tail); for (i = 0; i < 16; i++) tail[i] = 0; }
    tail[14] = n * 8;
    md5cycle(state, tail);

    const hex = "0123456789abcdef";
    let s = "";
    for (i = 0; i < 4; i++)
        for (let j = 0; j < 4; j++)
            s += hex.charAt((state[i] >> (j * 8 + 4)) & 0xf) + hex.charAt((state[i] >> (j * 8)) & 0xf);
    return s;
}

export default function HashGeneratorPage() {
    const [mode, setMode] = useState<"text" | "file">("text");
    const [input, setInput] = useState("");
    const [fileName, setFileName] = useState("");
    const [results, setResults] = useState<{ algo: string; hash: string }[]>([]);
    const [copied, setCopied] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    // Verify mode
    const [verifyHash, setVerifyHash] = useState("");

    const hashText = useCallback(async (text: string) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const hashes: { algo: string; hash: string }[] = [
            { algo: "MD5", hash: md5(text) },
        ];
        for (const algo of ALGOS) {
            const buffer = await crypto.subtle.digest(algo, data);
            hashes.push({ algo, hash: toHex(buffer) });
        }
        setResults(hashes);
    }, []);

    const hashFile = useCallback(async (file: File) => {
        setLoading(true);
        setFileName(file.name);
        const data = new Uint8Array(await file.arrayBuffer());
        const hashes: { algo: string; hash: string }[] = [];
        // MD5 from string
        let s = "";
        for (let i = 0; i < data.length; i++) s += String.fromCharCode(data[i]);
        hashes.push({ algo: "MD5", hash: md5(s) });
        for (const algo of ALGOS) {
            const buffer = await crypto.subtle.digest(algo, data);
            hashes.push({ algo, hash: toHex(buffer) });
        }
        setResults(hashes);
        setLoading(false);
    }, []);

    const copy = async (text: string, algo: string) => {
        await navigator.clipboard.writeText(text);
        setCopied(algo);
        setTimeout(() => setCopied(null), 1500);
    };

    const verifyMatch = verifyHash.trim() ? results.find(r => r.hash.toLowerCase() === verifyHash.trim().toLowerCase()) : null;

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/data"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">Hash Generator</h1>
            </div>

            <div className="flex gap-1 p-1 bg-muted rounded-lg mb-4">
                {(["text", "file"] as const).map(m => (
                    <button key={m} onClick={() => { setMode(m); setResults([]); }}
                        className={`flex-1 py-2 px-3 text-sm rounded-md transition-colors capitalize ${mode === m ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}>
                        {m}
                    </button>
                ))}
            </div>

            {mode === "text" ? (
                <>
                    <div className="border rounded-xl p-4 mb-4">
                        <textarea value={input} onChange={(e) => setInput(e.target.value)}
                            rows={4} className="w-full bg-transparent resize-none outline-none font-mono text-sm" placeholder="Enter text to hash..." />
                    </div>
                    <Button onClick={() => hashText(input)} disabled={!input.trim()} className="w-full mb-4">
                        <Hash className="h-4 w-4 mr-2" />Generate Hashes
                    </Button>
                </>
            ) : (
                <div className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-primary/40 transition-colors mb-4"
                    onClick={() => document.getElementById("hash-file")?.click()}>
                    <input type="file" onChange={(e) => e.target.files?.[0] && hashFile(e.target.files[0])} className="hidden" id="hash-file" />
                    <Upload className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-sm">{loading ? "Computing..." : fileName || "Choose file to hash"}</p>
                </div>
            )}

            {results.length > 0 && (
                <>
                    <div className="border rounded-xl overflow-hidden mb-4">
                        {results.map((r) => (
                            <div key={r.algo} className="flex items-center gap-3 px-4 py-3 border-b last:border-0 hover:bg-muted/30 transition-colors">
                                <span className="text-xs font-medium text-muted-foreground w-16 shrink-0">{r.algo}</span>
                                <span className="font-mono text-xs break-all flex-1">{r.hash}</span>
                                <button onClick={() => copy(r.hash, r.algo)} className="shrink-0 text-muted-foreground hover:text-foreground">
                                    {copied === r.algo ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Verify */}
                    <div className="border rounded-xl p-4">
                        <label className="text-xs text-muted-foreground mb-1 block">Verify hash</label>
                        <input value={verifyHash} onChange={(e) => setVerifyHash(e.target.value)}
                            className="w-full bg-muted/30 rounded-lg px-3 py-2 font-mono text-xs outline-none" placeholder="Paste expected hash to verify..." />
                        {verifyHash.trim() && (
                            <p className={`text-sm mt-2 font-medium ${verifyMatch ? "text-green-500" : "text-destructive"}`}>
                                {verifyMatch ? `✓ Match — ${verifyMatch.algo}` : "✗ No match found"}
                            </p>
                        )}
                    </div>
                </>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">100% local • No data sent</p>
        </div>
    );
}
