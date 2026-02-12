"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Copy, Check, Pipette, Plus, Trash2 } from "lucide-react";

interface ColorInfo {
    hex: string;
    rgb: { r: number; g: number; b: number };
    hsl: { h: number; s: number; l: number };
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const h = hex.replace("#", "");
    return {
        r: parseInt(h.substring(0, 2), 16),
        g: parseInt(h.substring(2, 4), 16),
        b: parseInt(h.substring(4, 6), 16),
    };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h = 0;
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function buildColorInfo(hex: string): ColorInfo {
    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    return { hex: hex.toUpperCase(), rgb, hsl };
}

function contrastText(hex: string): string {
    const { r, g, b } = hexToRgb(hex);
    return (r * 299 + g * 587 + b * 114) / 1000 > 128 ? "#000000" : "#FFFFFF";
}

export default function ColorPickerPage() {
    const [color, setColor] = useState("#6366F1");
    const [saved, setSaved] = useState<string[]>([]);
    const [copied, setCopied] = useState<string | null>(null);
    const [eyedropperSupported] = useState(() => typeof window !== "undefined" && "EyeDropper" in window);
    const pickerRef = useRef<HTMLInputElement>(null);

    const info = buildColorInfo(color);

    const copyValue = async (value: string) => {
        await navigator.clipboard.writeText(value);
        setCopied(value);
        setTimeout(() => setCopied(null), 1500);
    };

    const pickFromScreen = async () => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const eyeDropper = new (window as any).EyeDropper();
            const result = await eyeDropper.open();
            setColor(result.sRGBHex);
        } catch { /* cancelled */ }
    };

    const addToSaved = () => {
        if (!saved.includes(color)) {
            setSaved([...saved, color]);
        }
    };

    const removeFromSaved = (hex: string) => {
        setSaved(saved.filter(c => c !== hex));
    };

    // Generate complementary, analogous, triadic
    const generatePalette = useCallback((hex: string) => {
        const { h, s, l } = buildColorInfo(hex).hsl;
        const hslToHex = (h: number, s: number, l: number) => {
            h = ((h % 360) + 360) % 360;
            const hue = h / 360, sat = s / 100, lig = l / 100;
            const hue2rgb = (p: number, q: number, t: number) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };
            const q = lig < 0.5 ? lig * (1 + sat) : lig + sat - lig * sat;
            const p = 2 * lig - q;
            const r = Math.round(hue2rgb(p, q, hue + 1 / 3) * 255);
            const g = Math.round(hue2rgb(p, q, hue) * 255);
            const b = Math.round(hue2rgb(p, q, hue - 1 / 3) * 255);
            return `#${[r, g, b].map(x => x.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
        };

        return {
            complementary: [hex, hslToHex(h + 180, s, l)],
            analogous: [hslToHex(h - 30, s, l), hex, hslToHex(h + 30, s, l)],
            triadic: [hex, hslToHex(h + 120, s, l), hslToHex(h + 240, s, l)],
            shades: Array.from({ length: 5 }, (_, i) => hslToHex(h, s, Math.max(10, l - 20 + i * 15))),
        };
    }, []);

    const palette = generatePalette(color);

    const CopyBtn = ({ value, label }: { value: string; label: string }) => (
        <button
            onClick={() => copyValue(value)}
            className="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-muted/70 transition-colors text-sm"
        >
            <span className="text-muted-foreground">{label}</span>
            <span className="flex items-center gap-1.5 font-mono text-xs">
                {value}
                {copied === value ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
            </span>
        </button>
    );

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/data"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">Color Picker</h1>
            </div>

            {/* Color preview */}
            <div
                className="h-32 rounded-xl mb-4 flex items-end p-4 cursor-pointer transition-shadow hover:shadow-lg"
                style={{ backgroundColor: color }}
                onClick={() => pickerRef.current?.click()}
            >
                <span className="text-lg font-bold font-mono" style={{ color: contrastText(color) }}>{info.hex}</span>
                <input ref={pickerRef} type="color" value={color} onChange={(e) => setColor(e.target.value)} className="sr-only" />
            </div>

            {/* Controls */}
            <div className="flex gap-2 mb-4">
                <Input
                    value={color}
                    onChange={(e) => {
                        const v = e.target.value;
                        if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setColor(v);
                    }}
                    className="font-mono"
                    maxLength={7}
                />
                {eyedropperSupported && (
                    <Button variant="outline" onClick={pickFromScreen}>
                        <Pipette className="h-4 w-4" />
                    </Button>
                )}
                <Button variant="outline" onClick={addToSaved}>
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            {/* Color values */}
            <div className="border rounded-xl overflow-hidden mb-4">
                <CopyBtn value={info.hex} label="HEX" />
                <CopyBtn value={`rgb(${info.rgb.r}, ${info.rgb.g}, ${info.rgb.b})`} label="RGB" />
                <CopyBtn value={`hsl(${info.hsl.h}, ${info.hsl.s}%, ${info.hsl.l}%)`} label="HSL" />
                <CopyBtn value={`${info.rgb.r}, ${info.rgb.g}, ${info.rgb.b}`} label="Tailwind" />
            </div>

            {/* Palettes */}
            <div className="border rounded-xl p-4 mb-4 space-y-3">
                <h3 className="text-sm font-medium">Palettes</h3>

                <div>
                    <p className="text-xs text-muted-foreground mb-1">Complementary</p>
                    <div className="flex rounded-lg overflow-hidden h-10">
                        {palette.complementary.map((c, i) => (
                            <div key={i} className="flex-1 cursor-pointer hover:scale-y-110 transition-transform" style={{ backgroundColor: c }} onClick={() => setColor(c)} title={c} />
                        ))}
                    </div>
                </div>

                <div>
                    <p className="text-xs text-muted-foreground mb-1">Analogous</p>
                    <div className="flex rounded-lg overflow-hidden h-10">
                        {palette.analogous.map((c, i) => (
                            <div key={i} className="flex-1 cursor-pointer hover:scale-y-110 transition-transform" style={{ backgroundColor: c }} onClick={() => setColor(c)} title={c} />
                        ))}
                    </div>
                </div>

                <div>
                    <p className="text-xs text-muted-foreground mb-1">Triadic</p>
                    <div className="flex rounded-lg overflow-hidden h-10">
                        {palette.triadic.map((c, i) => (
                            <div key={i} className="flex-1 cursor-pointer hover:scale-y-110 transition-transform" style={{ backgroundColor: c }} onClick={() => setColor(c)} title={c} />
                        ))}
                    </div>
                </div>

                <div>
                    <p className="text-xs text-muted-foreground mb-1">Shades</p>
                    <div className="flex rounded-lg overflow-hidden h-10">
                        {palette.shades.map((c, i) => (
                            <div key={i} className="flex-1 cursor-pointer hover:scale-y-110 transition-transform" style={{ backgroundColor: c }} onClick={() => setColor(c)} title={c} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Saved colors */}
            {saved.length > 0 && (
                <div className="border rounded-xl p-4 mb-4">
                    <h3 className="text-sm font-medium mb-2">Saved ({saved.length})</h3>
                    <div className="flex flex-wrap gap-2">
                        {saved.map((c) => (
                            <div key={c} className="group relative">
                                <div
                                    className="h-10 w-10 rounded-lg cursor-pointer border transition-transform hover:scale-110"
                                    style={{ backgroundColor: c }}
                                    onClick={() => setColor(c)}
                                    title={c}
                                />
                                <button
                                    onClick={() => removeFromSaved(c)}
                                    className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="h-2.5 w-2.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">Click the color preview to open picker</p>
        </div>
    );
}
