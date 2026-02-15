"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRightLeft, Copy, Check } from "lucide-react";

type Category = "length" | "weight" | "temperature" | "area" | "volume" | "speed" | "time" | "data";

interface UnitDef { name: string; symbol: string; factor: number; offset?: number; }

const UNITS: Record<Category, UnitDef[]> = {
    length: [
        { name: "Millimeter", symbol: "mm", factor: 0.001 },
        { name: "Centimeter", symbol: "cm", factor: 0.01 },
        { name: "Meter", symbol: "m", factor: 1 },
        { name: "Kilometer", symbol: "km", factor: 1000 },
        { name: "Inch", symbol: "in", factor: 0.0254 },
        { name: "Foot", symbol: "ft", factor: 0.3048 },
        { name: "Yard", symbol: "yd", factor: 0.9144 },
        { name: "Mile", symbol: "mi", factor: 1609.344 },
        { name: "Nautical Mile", symbol: "nmi", factor: 1852 },
    ],
    weight: [
        { name: "Milligram", symbol: "mg", factor: 0.000001 },
        { name: "Gram", symbol: "g", factor: 0.001 },
        { name: "Kilogram", symbol: "kg", factor: 1 },
        { name: "Metric Ton", symbol: "t", factor: 1000 },
        { name: "Ounce", symbol: "oz", factor: 0.0283495 },
        { name: "Pound", symbol: "lb", factor: 0.453592 },
        { name: "Stone", symbol: "st", factor: 6.35029 },
    ],
    temperature: [
        { name: "Celsius", symbol: "°C", factor: 1, offset: 0 },
        { name: "Fahrenheit", symbol: "°F", factor: 1, offset: 0 },
        { name: "Kelvin", symbol: "K", factor: 1, offset: 0 },
    ],
    area: [
        { name: "Sq Millimeter", symbol: "mm²", factor: 0.000001 },
        { name: "Sq Centimeter", symbol: "cm²", factor: 0.0001 },
        { name: "Sq Meter", symbol: "m²", factor: 1 },
        { name: "Sq Kilometer", symbol: "km²", factor: 1000000 },
        { name: "Hectare", symbol: "ha", factor: 10000 },
        { name: "Acre", symbol: "ac", factor: 4046.86 },
        { name: "Sq Foot", symbol: "ft²", factor: 0.092903 },
        { name: "Sq Inch", symbol: "in²", factor: 0.00064516 },
    ],
    volume: [
        { name: "Milliliter", symbol: "mL", factor: 0.001 },
        { name: "Liter", symbol: "L", factor: 1 },
        { name: "Cubic Meter", symbol: "m³", factor: 1000 },
        { name: "Gallon (US)", symbol: "gal", factor: 3.78541 },
        { name: "Quart (US)", symbol: "qt", factor: 0.946353 },
        { name: "Pint (US)", symbol: "pt", factor: 0.473176 },
        { name: "Cup (US)", symbol: "cup", factor: 0.236588 },
        { name: "Fl Ounce (US)", symbol: "fl oz", factor: 0.0295735 },
        { name: "Tablespoon", symbol: "tbsp", factor: 0.0147868 },
    ],
    speed: [
        { name: "Meters/sec", symbol: "m/s", factor: 1 },
        { name: "Km/hour", symbol: "km/h", factor: 0.277778 },
        { name: "Miles/hour", symbol: "mph", factor: 0.44704 },
        { name: "Knots", symbol: "kn", factor: 0.514444 },
        { name: "Feet/sec", symbol: "ft/s", factor: 0.3048 },
    ],
    time: [
        { name: "Millisecond", symbol: "ms", factor: 0.001 },
        { name: "Second", symbol: "s", factor: 1 },
        { name: "Minute", symbol: "min", factor: 60 },
        { name: "Hour", symbol: "hr", factor: 3600 },
        { name: "Day", symbol: "d", factor: 86400 },
        { name: "Week", symbol: "wk", factor: 604800 },
        { name: "Month (30d)", symbol: "mo", factor: 2592000 },
        { name: "Year (365d)", symbol: "yr", factor: 31536000 },
    ],
    data: [
        { name: "Bit", symbol: "b", factor: 1 },
        { name: "Byte", symbol: "B", factor: 8 },
        { name: "Kilobyte", symbol: "KB", factor: 8000 },
        { name: "Megabyte", symbol: "MB", factor: 8000000 },
        { name: "Gigabyte", symbol: "GB", factor: 8000000000 },
        { name: "Terabyte", symbol: "TB", factor: 8000000000000 },
        { name: "Kibibyte", symbol: "KiB", factor: 8192 },
        { name: "Mebibyte", symbol: "MiB", factor: 8388608 },
        { name: "Gibibyte", symbol: "GiB", factor: 8589934592 },
    ],
};

const CATEGORIES: { value: Category; label: string; icon: string }[] = [
    { value: "length", label: "Length", icon: "📏" },
    { value: "weight", label: "Weight", icon: "⚖️" },
    { value: "temperature", label: "Temperature", icon: "🌡️" },
    { value: "area", label: "Area", icon: "📐" },
    { value: "volume", label: "Volume", icon: "🧪" },
    { value: "speed", label: "Speed", icon: "🏎️" },
    { value: "time", label: "Time", icon: "⏱️" },
    { value: "data", label: "Data", icon: "💾" },
];

function convertTemp(value: number, from: string, to: string): number {
    // Convert to Celsius first
    let celsius = value;
    if (from === "°F") celsius = (value - 32) * 5 / 9;
    else if (from === "K") celsius = value - 273.15;
    // Convert from Celsius to target
    if (to === "°F") return celsius * 9 / 5 + 32;
    if (to === "K") return celsius + 273.15;
    return celsius;
}

function formatNum(n: number): string {
    if (Math.abs(n) < 0.0001 && n !== 0) return n.toExponential(6);
    if (Math.abs(n) >= 1e12) return n.toExponential(6);
    return parseFloat(n.toPrecision(10)).toString();
}

export default function UnitConverterPage() {
    const [category, setCategory] = useState<Category>("length");
    const [fromIdx, setFromIdx] = useState(2); // meter / kg / etc
    const [toIdx, setToIdx] = useState(4); // inch / oz / etc
    const [value, setValue] = useState("1");
    const [copied, setCopied] = useState(false);

    const units = UNITS[category];
    const from = units[fromIdx] || units[0];
    const to = units[toIdx] || units[1];

    const result = useMemo(() => {
        const v = parseFloat(value);
        if (isNaN(v)) return "";
        if (category === "temperature") return formatNum(convertTemp(v, from.symbol, to.symbol));
        const base = v * from.factor;
        return formatNum(base / to.factor);
    }, [value, from, to, category]);

    const swap = () => { setFromIdx(toIdx); setToIdx(fromIdx); };

    const copyResult = async () => {
        if (!result) return;
        await navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    // All units results
    const allResults = useMemo(() => {
        const v = parseFloat(value);
        if (isNaN(v)) return [];
        if (category === "temperature") {
            return units.filter(u => u.symbol !== from.symbol).map(u => ({
                name: u.name, symbol: u.symbol, value: formatNum(convertTemp(v, from.symbol, u.symbol)),
            }));
        }
        const base = v * from.factor;
        return units.filter(u => u.symbol !== from.symbol).map(u => ({
            name: u.name, symbol: u.symbol, value: formatNum(base / u.factor),
        }));
    }, [value, from, units, category]);

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/data"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">Unit Converter</h1>
            </div>

            {/* Category selector */}
            <div className="flex flex-wrap gap-1.5 mb-5">
                {CATEGORIES.map(c => (
                    <button key={c.value} onClick={() => { setCategory(c.value); setFromIdx(0); setToIdx(1); }}
                        className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${category === c.value ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}>
                        {c.icon} {c.label}
                    </button>
                ))}
            </div>

            {/* Converter */}
            <div className="border rounded-xl p-4 mb-4">
                <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-end">
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">From</label>
                        <select value={fromIdx} onChange={(e) => setFromIdx(parseInt(e.target.value))}
                            className="w-full h-9 rounded-md border bg-background px-2 text-sm mb-2">
                            {units.map((u, i) => <option key={i} value={i}>{u.name} ({u.symbol})</option>)}
                        </select>
                        <Input value={value} onChange={(e) => setValue(e.target.value)} type="number" className="font-mono" />
                    </div>
                    <button onClick={swap} className="mb-2 p-2 rounded-lg hover:bg-muted transition-colors">
                        <ArrowRightLeft className="h-4 w-4" />
                    </button>
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">To</label>
                        <select value={toIdx} onChange={(e) => setToIdx(parseInt(e.target.value))}
                            className="w-full h-9 rounded-md border bg-background px-2 text-sm mb-2">
                            {units.map((u, i) => <option key={i} value={i}>{u.name} ({u.symbol})</option>)}
                        </select>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-9 rounded-md border bg-muted/30 px-3 flex items-center font-mono text-sm">{result || "—"}</div>
                            <button onClick={copyResult} className="p-2 rounded-md hover:bg-muted shrink-0">
                                {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* All units */}
            {allResults.length > 0 && (
                <div className="border rounded-xl overflow-hidden">
                    <div className="px-4 py-2 bg-muted/30 border-b">
                        <span className="text-xs font-medium text-muted-foreground">{value} {from.symbol} =</span>
                    </div>
                    {allResults.map(r => (
                        <div key={r.symbol} className="flex items-center justify-between px-4 py-2.5 border-b last:border-0 hover:bg-muted/20 transition-colors">
                            <span className="text-sm">{r.name} <span className="text-muted-foreground">({r.symbol})</span></span>
                            <span className="font-mono text-sm">{r.value}</span>
                        </div>
                    ))}
                </div>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">100% local • No data sent</p>
        </div>
    );
}
