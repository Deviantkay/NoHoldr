"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Copy, Check, RefreshCw, Shield, Eye, EyeOff } from "lucide-react";

const WORD_LIST = [
    "apple", "brave", "cloud", "dance", "eagle", "flame", "grape", "horse", "ivory", "jolly",
    "karma", "lemon", "magic", "noble", "ocean", "piano", "queen", "river", "stone", "tiger",
    "urban", "vivid", "whale", "xenon", "yacht", "zebra", "amber", "bloom", "cedar", "delta",
    "ember", "frost", "globe", "haven", "irony", "jewel", "knack", "lotus", "maple", "nexus",
    "olive", "pearl", "quilt", "raven", "solar", "torch", "unity", "vapor", "waltz", "oxide",
    "pixel", "quest", "radar", "scout", "trend", "ultra", "Venus", "wager", "youth", "zonal",
    "blaze", "crisp", "drift", "elite", "flint", "grime", "haste", "inlet", "joker", "lunar",
    "marsh", "nifty", "optic", "plume", "ridge", "swift", "tulip", "vigor", "whirl", "azure",
];

type Mode = "random" | "passphrase" | "pin";

export default function PasswordGeneratorPage() {
    const [mode, setMode] = useState<Mode>("random");
    // Random mode
    const [length, setLength] = useState(20);
    const [uppercase, setUppercase] = useState(true);
    const [lowercase, setLowercase] = useState(true);
    const [numbers, setNumbers] = useState(true);
    const [symbols, setSymbols] = useState(true);
    const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
    // Passphrase mode
    const [wordCount, setWordCount] = useState(4);
    const [separator, setSeparator] = useState("-");
    const [capitalizeWords, setCapitalizeWords] = useState(true);
    const [addNumber, setAddNumber] = useState(true);
    // PIN mode
    const [pinLength, setPinLength] = useState(6);
    // Bulk
    const [bulkCount, setBulkCount] = useState(1);
    // State
    const [passwords, setPasswords] = useState<string[]>([]);
    const [copied, setCopied] = useState(false);
    const [showPassword, setShowPassword] = useState(true);
    const [history, setHistory] = useState<string[]>([]);

    const generateOne = useCallback((): string => {
        if (mode === "passphrase") {
            const words = Array.from({ length: wordCount }, () => {
                const arr = new Uint32Array(1);
                crypto.getRandomValues(arr);
                let w = WORD_LIST[arr[0] % WORD_LIST.length];
                if (capitalizeWords) w = w.charAt(0).toUpperCase() + w.slice(1);
                return w;
            });
            let phrase = words.join(separator);
            if (addNumber) {
                const n = new Uint32Array(1);
                crypto.getRandomValues(n);
                phrase += separator + (n[0] % 1000);
            }
            return phrase;
        }

        if (mode === "pin") {
            const array = new Uint32Array(pinLength);
            crypto.getRandomValues(array);
            return Array.from(array, (n) => (n % 10).toString()).join("");
        }

        // Random mode
        let chars = "";
        if (uppercase) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        if (lowercase) chars += "abcdefghijklmnopqrstuvwxyz";
        if (numbers) chars += "0123456789";
        if (symbols) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";
        if (excludeAmbiguous) chars = chars.replace(/[0OoIl1|]/g, "");
        if (!chars) return "Enable at least one option";

        const array = new Uint32Array(length);
        crypto.getRandomValues(array);
        return Array.from(array, (n) => chars[n % chars.length]).join("");
    }, [mode, length, uppercase, lowercase, numbers, symbols, excludeAmbiguous, wordCount, separator, capitalizeWords, addNumber, pinLength]);

    const generate = useCallback(() => {
        const results = Array.from({ length: bulkCount }, () => generateOne());
        setPasswords(results);
        setHistory((prev) => [...results, ...prev].slice(0, 20));
        setCopied(false);
    }, [bulkCount, generateOne]);

    const copyText = async (text: string) => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const copyAll = async () => {
        await navigator.clipboard.writeText(passwords.join("\n"));
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    // Strength meter
    const getStrength = (pwd: string) => {
        if (!pwd || pwd === "Enable at least one option") return { label: "", color: "", percent: 0 };
        let score = 0;
        if (pwd.length >= 8) score++;
        if (pwd.length >= 16) score++;
        if (pwd.length >= 24) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[a-z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;
        if (score <= 2) return { label: "Weak", color: "bg-red-500", percent: 25 };
        if (score <= 4) return { label: "Fair", color: "bg-yellow-500", percent: 50 };
        if (score <= 5) return { label: "Strong", color: "bg-blue-500", percent: 75 };
        return { label: "Very Strong", color: "bg-green-500", percent: 100 };
    };

    // Auto-generate on first render
    useState(() => { generate(); });

    const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
        <label className="flex items-center justify-between py-2 cursor-pointer">
            <span className="text-sm">{label}</span>
            <button onClick={() => onChange(!checked)}
                className={`w-9 h-5 rounded-full transition-colors relative ${checked ? "bg-primary" : "bg-muted-foreground/30"}`}>
                <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${checked ? "translate-x-4" : ""}`} />
            </button>
        </label>
    );

    const currentPassword = passwords[0] || "";
    const strength = getStrength(currentPassword);

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/data"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">Password Generator</h1>
            </div>

            {/* Mode selector */}
            <div className="flex gap-1 p-1 bg-muted rounded-lg mb-4">
                {([
                    { value: "random" as Mode, label: "Random" },
                    { value: "passphrase" as Mode, label: "Passphrase" },
                    { value: "pin" as Mode, label: "PIN" },
                ]).map((m) => (
                    <button key={m.value} onClick={() => setMode(m.value)}
                        className={`flex-1 py-2 px-3 text-sm rounded-md transition-colors ${mode === m.value ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}>
                        {m.label}
                    </button>
                ))}
            </div>

            {/* Password display */}
            <div className="border rounded-xl p-4 mb-4">
                {passwords.length <= 1 ? (
                    <div className="flex items-center gap-2 mb-3">
                        <div className="flex-1 font-mono text-lg break-all bg-muted/50 rounded-lg p-3 min-h-[52px] flex items-center">
                            {showPassword ? currentPassword : "•".repeat(currentPassword.length)}
                        </div>
                        <div className="flex flex-col gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyText(currentPassword)}>
                                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-1.5 mb-3 max-h-48 overflow-y-auto">
                        {passwords.map((pwd, i) => (
                            <div key={i} className="flex items-center gap-2 py-1.5 px-2 rounded bg-muted/40">
                                <span className="text-xs text-muted-foreground w-5">#{i + 1}</span>
                                <span className="font-mono text-xs flex-1 break-all">{showPassword ? pwd : "•".repeat(pwd.length)}</span>
                                <button onClick={() => copyText(pwd)} className="text-muted-foreground hover:text-foreground shrink-0">
                                    <Copy className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {strength.label && passwords.length <= 1 && (
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full ${strength.color} transition-all`} style={{ width: `${strength.percent}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{strength.label}</span>
                    </div>
                )}
            </div>

            {/* Generate + Bulk */}
            <div className="flex gap-2 mb-4">
                <Button onClick={generate} className="flex-1 h-11">
                    <RefreshCw className="h-4 w-4 mr-2" />Generate {bulkCount > 1 ? `(${bulkCount})` : ""}
                </Button>
                {passwords.length > 1 && (
                    <Button variant="outline" className="h-11" onClick={copyAll}>
                        <Copy className="h-4 w-4 mr-1" />All
                    </Button>
                )}
            </div>

            {/* Options */}
            <div className="border rounded-xl p-4 mb-4">
                <h3 className="text-sm font-medium mb-1">Options</h3>

                {mode === "random" && (
                    <>
                        <div>
                            <label className="text-xs text-muted-foreground">Length: {length}</label>
                            <input type="range" min={4} max={128} value={length} onChange={(e) => setLength(parseInt(e.target.value))} className="w-full accent-primary" />
                            <div className="flex justify-between text-xs text-muted-foreground"><span>4</span><span>128</span></div>
                        </div>
                        <Toggle label="Uppercase (A-Z)" checked={uppercase} onChange={setUppercase} />
                        <Toggle label="Lowercase (a-z)" checked={lowercase} onChange={setLowercase} />
                        <Toggle label="Numbers (0-9)" checked={numbers} onChange={setNumbers} />
                        <Toggle label="Symbols (!@#$...)" checked={symbols} onChange={setSymbols} />
                        <Toggle label="Exclude ambiguous (0OoIl1)" checked={excludeAmbiguous} onChange={setExcludeAmbiguous} />
                    </>
                )}

                {mode === "passphrase" && (
                    <>
                        <div>
                            <label className="text-xs text-muted-foreground">Words: {wordCount}</label>
                            <input type="range" min={3} max={10} value={wordCount} onChange={(e) => setWordCount(parseInt(e.target.value))} className="w-full accent-primary" />
                        </div>
                        <div className="mt-2">
                            <label className="text-xs text-muted-foreground">Separator</label>
                            <div className="flex gap-1 mt-1">
                                {["-", ".", "_", " "].map((s) => (
                                    <button key={s} onClick={() => setSeparator(s)}
                                        className={`flex-1 py-1.5 text-xs rounded-md border transition-colors font-mono ${separator === s ? "bg-foreground text-background" : ""}`}>
                                        {s === " " ? "space" : s}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <Toggle label="Capitalize words" checked={capitalizeWords} onChange={setCapitalizeWords} />
                        <Toggle label="Add number" checked={addNumber} onChange={setAddNumber} />
                    </>
                )}

                {mode === "pin" && (
                    <div>
                        <label className="text-xs text-muted-foreground">PIN Length: {pinLength}</label>
                        <input type="range" min={4} max={12} value={pinLength} onChange={(e) => setPinLength(parseInt(e.target.value))} className="w-full accent-primary" />
                    </div>
                )}

                <div className="border-t pt-3 mt-3">
                    <label className="text-xs text-muted-foreground">Bulk generate</label>
                    <div className="flex gap-1 mt-1">
                        {[1, 5, 10, 25].map((n) => (
                            <button key={n} onClick={() => setBulkCount(n)}
                                className={`flex-1 py-1.5 text-xs rounded-md border transition-colors ${bulkCount === n ? "bg-foreground text-background" : ""}`}>
                                {n}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* History */}
            {history.length > passwords.length && (
                <div className="border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium">History ({history.length})</h3>
                        <button onClick={() => setHistory([])} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
                    </div>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                        {history.slice(passwords.length).map((pwd, i) => (
                            <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 transition-colors">
                                <span className="font-mono text-xs truncate flex-1 mr-2">{pwd}</span>
                                <button onClick={() => copyText(pwd)} className="text-muted-foreground hover:text-foreground"><Copy className="h-3 w-3" /></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">
                <Shield className="h-3 w-3 inline mr-1" />Generated locally using crypto API • Never sent anywhere
            </p>
        </div>
    );
}
