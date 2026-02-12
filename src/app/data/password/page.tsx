"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Copy, Check, RefreshCw, Shield, Eye, EyeOff } from "lucide-react";

export default function PasswordGeneratorPage() {
    const [length, setLength] = useState(20);
    const [uppercase, setUppercase] = useState(true);
    const [lowercase, setLowercase] = useState(true);
    const [numbers, setNumbers] = useState(true);
    const [symbols, setSymbols] = useState(true);
    const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
    const [password, setPassword] = useState("");
    const [copied, setCopied] = useState(false);
    const [showPassword, setShowPassword] = useState(true);
    const [history, setHistory] = useState<string[]>([]);

    const generate = useCallback(() => {
        let chars = "";
        if (uppercase) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        if (lowercase) chars += "abcdefghijklmnopqrstuvwxyz";
        if (numbers) chars += "0123456789";
        if (symbols) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";

        if (excludeAmbiguous) {
            chars = chars.replace(/[0OoIl1|]/g, "");
        }

        if (!chars) { setPassword("Enable at least one option"); return; }

        const array = new Uint32Array(length);
        crypto.getRandomValues(array);
        const pwd = Array.from(array, (n) => chars[n % chars.length]).join("");
        setPassword(pwd);
        setHistory((prev) => [pwd, ...prev.slice(0, 9)]);
        setCopied(false);
    }, [length, uppercase, lowercase, numbers, symbols, excludeAmbiguous]);

    const copyPassword = async (text: string) => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    // Strength meter
    const getStrength = () => {
        if (!password || password === "Enable at least one option") return { label: "", color: "", percent: 0 };
        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 16) score++;
        if (password.length >= 24) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        if (score <= 2) return { label: "Weak", color: "bg-red-500", percent: 25 };
        if (score <= 4) return { label: "Fair", color: "bg-yellow-500", percent: 50 };
        if (score <= 5) return { label: "Strong", color: "bg-blue-500", percent: 75 };
        return { label: "Very Strong", color: "bg-green-500", percent: 100 };
    };

    const strength = getStrength();

    // Auto-generate on first render
    useState(() => { generate(); });

    const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
        <label className="flex items-center justify-between py-2 cursor-pointer">
            <span className="text-sm">{label}</span>
            <button
                onClick={() => onChange(!checked)}
                className={`w-9 h-5 rounded-full transition-colors relative ${checked ? "bg-primary" : "bg-muted-foreground/30"}`}
            >
                <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${checked ? "translate-x-4" : ""}`} />
            </button>
        </label>
    );

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/data"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">Password Generator</h1>
            </div>

            {/* Password display */}
            <div className="border rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 font-mono text-lg break-all bg-muted/50 rounded-lg p-3 min-h-[52px] flex items-center">
                        {showPassword ? password : "•".repeat(password.length)}
                    </div>
                    <div className="flex flex-col gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyPassword(password)}>
                            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>

                {/* Strength bar */}
                {strength.label && (
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full ${strength.color} transition-all`} style={{ width: `${strength.percent}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{strength.label}</span>
                    </div>
                )}
            </div>

            {/* Generate button */}
            <Button onClick={generate} className="w-full h-11 mb-4">
                <RefreshCw className="h-4 w-4 mr-2" />Generate Password
            </Button>

            {/* Options */}
            <div className="border rounded-xl p-4 mb-4">
                <h3 className="text-sm font-medium mb-1">Options</h3>

                <div>
                    <label className="text-xs text-muted-foreground">Length: {length}</label>
                    <input
                        type="range"
                        min={4}
                        max={64}
                        value={length}
                        onChange={(e) => setLength(parseInt(e.target.value))}
                        className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>4</span><span>64</span>
                    </div>
                </div>

                <Toggle label="Uppercase (A-Z)" checked={uppercase} onChange={setUppercase} />
                <Toggle label="Lowercase (a-z)" checked={lowercase} onChange={setLowercase} />
                <Toggle label="Numbers (0-9)" checked={numbers} onChange={setNumbers} />
                <Toggle label="Symbols (!@#$...)" checked={symbols} onChange={setSymbols} />
                <Toggle label="Exclude ambiguous (0OoIl1)" checked={excludeAmbiguous} onChange={setExcludeAmbiguous} />
            </div>

            {/* History */}
            {history.length > 1 && (
                <div className="border rounded-xl p-4">
                    <h3 className="text-sm font-medium mb-2">Recent ({history.length})</h3>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                        {history.slice(1).map((pwd, i) => (
                            <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 transition-colors">
                                <span className="font-mono text-xs truncate flex-1 mr-2">{pwd}</span>
                                <button onClick={() => copyPassword(pwd)} className="text-muted-foreground hover:text-foreground">
                                    <Copy className="h-3 w-3" />
                                </button>
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
