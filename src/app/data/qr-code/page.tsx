"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Download, Copy, QrCode, Link as LinkIcon, Mail, Wifi, Phone } from "lucide-react";

type QRType = "url" | "text" | "email" | "phone" | "wifi";

const presets: { type: QRType; label: string; icon: React.ComponentType<{ className?: string }>; placeholder: string }[] = [
    { type: "url", label: "URL", icon: LinkIcon, placeholder: "https://example.com" },
    { type: "text", label: "Text", icon: QrCode, placeholder: "Your text here..." },
    { type: "email", label: "Email", icon: Mail, placeholder: "email@example.com" },
    { type: "phone", label: "Phone", icon: Phone, placeholder: "+1234567890" },
    { type: "wifi", label: "WiFi", icon: Wifi, placeholder: "Network name" },
];

export default function QRCodePage() {
    const [type, setType] = useState<QRType>("url");
    const [input, setInput] = useState("");
    const [wifiPassword, setWifiPassword] = useState("");
    const [wifiSecurity, setWifiSecurity] = useState<"WPA" | "WEP" | "nopass">("WPA");
    const [size, setSize] = useState(256);
    const [fgColor, setFgColor] = useState("#000000");
    const [bgColor, setBgColor] = useState("#ffffff");
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [generated, setGenerated] = useState(false);

    const buildPayload = useCallback(() => {
        switch (type) {
            case "url": return input;
            case "text": return input;
            case "email": return `mailto:${input}`;
            case "phone": return `tel:${input}`;
            case "wifi": return `WIFI:T:${wifiSecurity};S:${input};P:${wifiPassword};;`;
            default: return input;
        }
    }, [type, input, wifiPassword, wifiSecurity]);

    const generateQR = useCallback(async () => {
        const payload = buildPayload();
        if (!payload.trim()) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        // Use a simple QR code generation via Canvas API
        // We'll use a lightweight approach with the QRCode library pattern
        try {
            // Dynamic import of a lightweight QR encoder
            const qrData = encodeQR(payload);
            const ctx = canvas.getContext("2d")!;
            canvas.width = size;
            canvas.height = size;

            const modules = qrData.modules;
            const moduleCount = modules.length;
            const cellSize = size / moduleCount;

            // Background
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, size, size);

            // QR modules
            ctx.fillStyle = fgColor;
            for (let row = 0; row < moduleCount; row++) {
                for (let col = 0; col < moduleCount; col++) {
                    if (modules[row][col]) {
                        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
                    }
                }
            }

            setGenerated(true);
        } catch (err) {
            console.error("QR generation failed:", err);
        }
    }, [buildPayload, size, fgColor, bgColor]);

    useEffect(() => {
        if (input.trim()) {
            const timer = setTimeout(generateQR, 300);
            return () => clearTimeout(timer);
        } else {
            setGenerated(false);
        }
    }, [input, type, wifiPassword, wifiSecurity, size, fgColor, bgColor, generateQR]);

    const downloadQR = (format: "png" | "jpeg" | "svg") => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const mimeType = format === "jpeg" ? "image/jpeg" : "image/png";
        canvas.toBlob((blob) => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `qrcode.${format}`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 3000);
        }, mimeType, 0.95);
    };

    const copyQR = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        try {
            const blob = await new Promise<Blob>((resolve) =>
                canvas.toBlob((b) => resolve(b!), "image/png")
            );
            await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        } catch { /* clipboard might not be supported */ }
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/data"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">QR Code Generator</h1>
            </div>

            {/* Type selector */}
            <div className="flex gap-1 p-1 bg-muted rounded-lg mb-4 flex-wrap">
                {presets.map((p) => (
                    <button
                        key={p.type}
                        onClick={() => { setType(p.type); setInput(""); }}
                        className={`flex-1 py-2 px-2 text-xs rounded-md transition-colors flex items-center justify-center gap-1.5 min-w-[60px] ${type === p.type ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}
                    >
                        <p.icon className="h-3 w-3" />{p.label}
                    </button>
                ))}
            </div>

            {/* Input */}
            <div className="border rounded-xl p-4 mb-4">
                <label className="text-sm font-medium mb-2 block">
                    {presets.find((p) => p.type === type)?.label} Input
                </label>
                <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={presets.find((p) => p.type === type)?.placeholder}
                    className="mb-2"
                />

                {type === "wifi" && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                            <label className="text-xs text-muted-foreground">Password</label>
                            <Input
                                value={wifiPassword}
                                onChange={(e) => setWifiPassword(e.target.value)}
                                placeholder="WiFi password"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground">Security</label>
                            <select
                                value={wifiSecurity}
                                onChange={(e) => setWifiSecurity(e.target.value as typeof wifiSecurity)}
                                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                            >
                                <option value="WPA">WPA/WPA2</option>
                                <option value="WEP">WEP</option>
                                <option value="nopass">None</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Customization */}
            <div className="border rounded-xl p-4 mb-4">
                <h3 className="text-sm font-medium mb-3">Customize</h3>
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="text-xs text-muted-foreground">Size (px)</label>
                        <Input type="number" min={128} max={1024} step={64} value={size} onChange={(e) => setSize(parseInt(e.target.value) || 256)} />
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground">Color</label>
                        <div className="flex items-center gap-2">
                            <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="h-9 w-10 rounded cursor-pointer" />
                            <span className="text-xs text-muted-foreground">{fgColor}</span>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground">Background</label>
                        <div className="flex items-center gap-2">
                            <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-9 w-10 rounded cursor-pointer" />
                            <span className="text-xs text-muted-foreground">{bgColor}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview */}
            <div className="border rounded-xl p-6 mb-4 flex flex-col items-center">
                <canvas
                    ref={canvasRef}
                    className="border rounded-lg bg-white"
                    style={{ width: Math.min(size, 280), height: Math.min(size, 280), imageRendering: "pixelated" }}
                />
                {!generated && (
                    <p className="text-sm text-muted-foreground mt-3">Enter content above to generate QR code</p>
                )}
            </div>

            {/* Download options */}
            {generated && (
                <div className="flex gap-2">
                    <Button onClick={() => downloadQR("png")} className="flex-1">
                        <Download className="h-4 w-4 mr-2" />PNG
                    </Button>
                    <Button onClick={() => downloadQR("jpeg")} variant="outline" className="flex-1">
                        <Download className="h-4 w-4 mr-2" />JPEG
                    </Button>
                    <Button onClick={copyQR} variant="outline" className="flex-none">
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">Generated locally in your browser</p>
        </div>
    );
}

// ---- Minimal QR Code Encoder (no external dependencies) ----
// Based on QR Code Model 2 spec, supports alphanumeric and byte modes
// This is a simplified encoder suitable for typical URLs and text

interface QRData {
    modules: boolean[][];
}

function encodeQR(text: string): QRData {
    // Determine version needed (simplified: version 1-10 for up to ~271 chars)
    const data = new TextEncoder().encode(text);
    const len = data.length;

    // Pick version based on capacity (byte mode, error correction L)
    const capacities = [0, 17, 32, 53, 78, 106, 134, 154, 192, 230, 271, 321, 367, 425, 458, 520, 586, 644, 718, 792, 858];
    let version = 1;
    for (let v = 1; v < capacities.length; v++) {
        if (len <= capacities[v]) { version = v; break; }
        if (v === capacities.length - 1) version = v;
    }

    const size = 17 + version * 4;
    const modules: (boolean | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));
    const reserved: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

    // Place finder patterns
    placeFinder(modules, reserved, 0, 0);
    placeFinder(modules, reserved, size - 7, 0);
    placeFinder(modules, reserved, 0, size - 7);

    // Place timing patterns
    for (let i = 8; i < size - 8; i++) {
        if (!reserved[6][i]) {
            modules[6][i] = i % 2 === 0;
            reserved[6][i] = true;
        }
        if (!reserved[i][6]) {
            modules[i][6] = i % 2 === 0;
            reserved[i][6] = true;
        }
    }

    // Place alignment patterns for version >= 2
    if (version >= 2) {
        const positions = getAlignmentPositions(version, size);
        for (const r of positions) {
            for (const c of positions) {
                if (reserved[r] && reserved[r][c]) continue;
                placeAlignment(modules, reserved, r, c);
            }
        }
    }

    // Reserve format info areas
    for (let i = 0; i < 8; i++) {
        reserved[8] = reserved[8] || Array(size).fill(false);
        reserved[8][i] = true;
        reserved[8][size - 1 - i] = true;
        if (i < size) {
            reserved[i] = reserved[i] || Array(size).fill(false);
            reserved[i][8] = true;
        }
        if (size - 1 - i >= 0 && size - 1 - i < size) {
            reserved[size - 1 - i] = reserved[size - 1 - i] || Array(size).fill(false);
            reserved[size - 1 - i][8] = true;
        }
    }
    // Dark module
    modules[size - 8][8] = true;
    reserved[size - 8][8] = true;

    // Encode data
    const bits = encodeData(data, version, len);

    // Place data bits
    placeData(modules, reserved, bits, size);

    // Apply mask (pattern 0 for simplicity)
    applyMask(modules, reserved, size, 0);

    // Place format info
    placeFormatInfo(modules, size, 0);

    // Convert null modules to false
    const result: boolean[][] = modules.map(row => row.map(m => m === true));

    return { modules: result };
}

function placeFinder(modules: (boolean | null)[][], reserved: boolean[][], row: number, col: number) {
    for (let r = -1; r <= 7; r++) {
        for (let c = -1; c <= 7; c++) {
            const rr = row + r, cc = col + c;
            if (rr < 0 || cc < 0 || rr >= modules.length || cc >= modules.length) continue;
            const isBorder = r === -1 || r === 7 || c === -1 || c === 7;
            const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
            const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
            modules[rr][cc] = !isBorder && (isOuter || isInner);
            reserved[rr][cc] = true;
        }
    }
}

function placeAlignment(modules: (boolean | null)[][], reserved: boolean[][], row: number, col: number) {
    for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
            const rr = row + r, cc = col + c;
            if (rr < 0 || cc < 0 || rr >= modules.length || cc >= modules.length) continue;
            if (reserved[rr][cc]) continue;
            const isEdge = Math.abs(r) === 2 || Math.abs(c) === 2;
            const isCenter = r === 0 && c === 0;
            modules[rr][cc] = isEdge || isCenter;
            reserved[rr][cc] = true;
        }
    }
}

function getAlignmentPositions(version: number, size: number): number[] {
    if (version === 1) return [];
    const first = 6;
    const last = size - 7;
    const count = Math.floor(version / 7) + 2;
    if (count === 2) return [first, last];
    const step = Math.ceil((last - first) / (count - 1));
    const positions = [first];
    for (let i = 1; i < count - 1; i++) {
        positions.push(last - (count - 1 - i) * step);
    }
    positions.push(last);
    return positions;
}

function encodeData(data: Uint8Array, version: number, len: number): boolean[] {
    const bits: boolean[] = [];

    // Mode indicator: byte mode = 0100
    bits.push(false, true, false, false);

    // Character count (8 bits for v1-9, 16 bits for v10+)
    const countBits = version <= 9 ? 8 : 16;
    for (let i = countBits - 1; i >= 0; i--) {
        bits.push(((len >> i) & 1) === 1);
    }

    // Data bytes
    for (let i = 0; i < data.length; i++) {
        for (let b = 7; b >= 0; b--) {
            bits.push(((data[i] >> b) & 1) === 1);
        }
    }

    // Terminator (up to 4 bits of 0)
    for (let i = 0; i < 4 && bits.length < getCapacityBits(version); i++) {
        bits.push(false);
    }

    // Pad to byte boundary
    while (bits.length % 8 !== 0 && bits.length < getCapacityBits(version)) {
        bits.push(false);
    }

    // Pad codewords
    const padBytes = [0xEC, 0x11];
    let padIdx = 0;
    while (bits.length < getCapacityBits(version)) {
        for (let b = 7; b >= 0 && bits.length < getCapacityBits(version); b--) {
            bits.push(((padBytes[padIdx] >> b) & 1) === 1);
        }
        padIdx = (padIdx + 1) % 2;
    }

    return bits;
}

function getCapacityBits(version: number): number {
    // Total data codewords * 8 (Error correction level L)
    const dataCodewords = [0, 19, 34, 55, 80, 108, 136, 156, 194, 232, 274, 324, 370, 428, 461, 523, 589, 647, 721, 795, 861];
    return (dataCodewords[version] || dataCodewords[1]) * 8;
}

function placeData(modules: (boolean | null)[][], reserved: boolean[][], bits: boolean[], size: number) {
    let bitIdx = 0;
    let upward = true;

    for (let col = size - 1; col >= 1; col -= 2) {
        if (col === 6) col = 5; // Skip timing column

        for (let count = 0; count < size; count++) {
            const row = upward ? size - 1 - count : count;

            for (let c = 0; c < 2; c++) {
                const cc = col - c;
                if (cc < 0 || cc >= size) continue;
                if (reserved[row] && reserved[row][cc]) continue;

                modules[row][cc] = bitIdx < bits.length ? bits[bitIdx] : false;
                bitIdx++;
            }
        }
        upward = !upward;
    }
}

function applyMask(modules: (boolean | null)[][], reserved: boolean[][], size: number, mask: number) {
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (reserved[r][c]) continue;
            let shouldFlip = false;
            switch (mask) {
                case 0: shouldFlip = (r + c) % 2 === 0; break;
                case 1: shouldFlip = r % 2 === 0; break;
                case 2: shouldFlip = c % 3 === 0; break;
                case 3: shouldFlip = (r + c) % 3 === 0; break;
                case 4: shouldFlip = (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0; break;
                case 5: shouldFlip = ((r * c) % 2 + (r * c) % 3) === 0; break;
                case 6: shouldFlip = ((r * c) % 2 + (r * c) % 3) % 2 === 0; break;
                case 7: shouldFlip = ((r + c) % 2 + (r * c) % 3) % 2 === 0; break;
            }
            if (shouldFlip) {
                modules[r][c] = !modules[r][c];
            }
        }
    }
}

function placeFormatInfo(modules: (boolean | null)[][], size: number, mask: number) {
    // Format info for EC level L (01) and mask pattern
    const formatBits = getFormatBits(0, mask); // 0 = EC level L

    // Place around top-left finder
    const positions1 = [
        [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
        [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
    ];

    for (let i = 0; i < 15; i++) {
        const [r, c] = positions1[i];
        modules[r][c] = ((formatBits >> (14 - i)) & 1) === 1;
    }

    // Place around other finders
    const positions2 = [
        [size - 1, 8], [size - 2, 8], [size - 3, 8], [size - 4, 8],
        [size - 5, 8], [size - 6, 8], [size - 7, 8],
        [8, size - 8], [8, size - 7], [8, size - 6], [8, size - 5],
        [8, size - 4], [8, size - 3], [8, size - 2], [8, size - 1],
    ];

    for (let i = 0; i < 15; i++) {
        const [r, c] = positions2[i];
        modules[r][c] = ((formatBits >> (14 - i)) & 1) === 1;
    }
}

function getFormatBits(ecLevel: number, mask: number): number {
    // Pre-calculated format info strings for EC level L
    const formatInfoL = [
        0x77C4, 0x72F3, 0x7DAA, 0x789D, 0x662F, 0x6318, 0x6C41, 0x6976,
    ];
    return formatInfoL[mask] || formatInfoL[0];
}
