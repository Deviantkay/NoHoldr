"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Download, Copy, QrCode, Link as LinkIcon, Mail, Wifi, Phone, Upload, X, Check } from "lucide-react";
import QRCodeLib from "qrcode";

/* ==================== TYPES ==================== */
type QRType = "url" | "text" | "email" | "phone" | "wifi";
type BodyShape = "square" | "dots" | "rounded" | "diamond" | "star" | "heart";
type EyeFrameShape = "square" | "rounded" | "circle" | "dots";
type EyeBallShape = "square" | "rounded" | "circle" | "diamond";
type ECLevel = "L" | "M" | "Q" | "H";

const presets: { type: QRType; label: string; icon: React.ComponentType<{ className?: string }>; placeholder: string }[] = [
    { type: "url", label: "URL", icon: LinkIcon, placeholder: "https://example.com" },
    { type: "text", label: "Text", icon: QrCode, placeholder: "Your text here..." },
    { type: "email", label: "Email", icon: Mail, placeholder: "email@example.com" },
    { type: "phone", label: "Phone", icon: Phone, placeholder: "+1234567890" },
    { type: "wifi", label: "WiFi", icon: Wifi, placeholder: "Network name" },
];

/* ==================== SHAPE RENDERERS ==================== */
function drawBody(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, shape: BodyShape, color: string) {
    ctx.fillStyle = color;
    const half = s / 2;
    const cx = x + half, cy = y + half;
    const r = half * 0.85;
    switch (shape) {
        case "square":
            ctx.fillRect(x, y, s, s);
            break;
        case "dots":
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
            break;
        case "rounded":
            ctx.beginPath();
            ctx.roundRect(x + s * 0.05, y + s * 0.05, s * 0.9, s * 0.9, s * 0.3);
            ctx.fill();
            break;
        case "diamond":
            ctx.beginPath();
            ctx.moveTo(cx, y + s * 0.08);
            ctx.lineTo(x + s * 0.92, cy);
            ctx.lineTo(cx, y + s * 0.92);
            ctx.lineTo(x + s * 0.08, cy);
            ctx.closePath();
            ctx.fill();
            break;
        case "star": {
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
                const px = cx + r * Math.cos(angle);
                const py = cy + r * Math.sin(angle);
                i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            break;
        }
        case "heart": {
            const size = s * 0.45;
            ctx.beginPath();
            ctx.moveTo(cx, cy + size * 0.7);
            ctx.bezierCurveTo(cx - size * 1.2, cy - size * 0.3, cx - size * 0.5, cy - size * 1.1, cx, cy - size * 0.4);
            ctx.bezierCurveTo(cx + size * 0.5, cy - size * 1.1, cx + size * 1.2, cy - size * 0.3, cx, cy + size * 0.7);
            ctx.fill();
            break;
        }
    }
}

function drawEyeFrame(ctx: CanvasRenderingContext2D, x: number, y: number, cellSize: number, shape: EyeFrameShape, color: string) {
    const s = cellSize * 7;
    const inner = cellSize;
    ctx.strokeStyle = color;
    ctx.lineWidth = cellSize;
    const offset = cellSize / 2;

    switch (shape) {
        case "square":
            ctx.strokeRect(x + offset, y + offset, s - cellSize, s - cellSize);
            break;
        case "rounded":
            ctx.beginPath();
            ctx.roundRect(x + offset, y + offset, s - cellSize, s - cellSize, cellSize * 1.5);
            ctx.stroke();
            break;
        case "circle":
            ctx.beginPath();
            ctx.arc(x + s / 2, y + s / 2, s / 2 - offset, 0, Math.PI * 2);
            ctx.stroke();
            break;
        case "dots":
            // Draw individual dot frame
            for (let r = 0; r < 7; r++) {
                for (let c = 0; c < 7; c++) {
                    if (r === 0 || r === 6 || c === 0 || c === 6) {
                        ctx.fillStyle = color;
                        ctx.beginPath();
                        ctx.arc(x + c * cellSize + cellSize / 2, y + r * cellSize + cellSize / 2, cellSize * 0.4, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }
            break;
    }
}

function drawEyeBall(ctx: CanvasRenderingContext2D, x: number, y: number, cellSize: number, shape: EyeBallShape, color: string) {
    const s = cellSize * 3;
    const cx = x + s / 2, cy = y + s / 2;
    ctx.fillStyle = color;

    switch (shape) {
        case "square":
            ctx.fillRect(x, y, s, s);
            break;
        case "rounded":
            ctx.beginPath();
            ctx.roundRect(x, y, s, s, cellSize);
            ctx.fill();
            break;
        case "circle":
            ctx.beginPath();
            ctx.arc(cx, cy, s / 2, 0, Math.PI * 2);
            ctx.fill();
            break;
        case "diamond":
            ctx.beginPath();
            ctx.moveTo(cx, y);
            ctx.lineTo(x + s, cy);
            ctx.lineTo(cx, y + s);
            ctx.lineTo(x, cy);
            ctx.closePath();
            ctx.fill();
            break;
    }
}

/* ==================== COMPONENT ==================== */
export default function QRCodePage() {
    const [type, setType] = useState<QRType>("url");
    const [input, setInput] = useState("");
    const [wifiPassword, setWifiPassword] = useState("");
    const [wifiSecurity, setWifiSecurity] = useState<"WPA" | "WEP" | "nopass">("WPA");
    // Appearance
    const [resolution, setResolution] = useState(1024);
    const [fgColor, setFgColor] = useState("#000000");
    const [bgColor, setBgColor] = useState("#ffffff");
    const [transparent, setTransparent] = useState(false);
    const [ecLevel, setEcLevel] = useState<ECLevel>("H");
    // Shapes
    const [bodyShape, setBodyShape] = useState<BodyShape>("square");
    const [eyeFrameShape, setEyeFrameShape] = useState<EyeFrameShape>("square");
    const [eyeBallShape, setEyeBallShape] = useState<EyeBallShape>("square");
    // Logo
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
    const [logoSize, setLogoSize] = useState(22);
    const [logoShape, setLogoShape] = useState<"square" | "circle">("square");
    // State
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [generated, setGenerated] = useState(false);
    const [copied, setCopied] = useState(false);
    const [activeSection, setActiveSection] = useState<string | null>("content");

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

        try {
            // Generate QR matrix using qrcode lib
            const qrData = QRCodeLib.create(payload, { errorCorrectionLevel: ecLevel });
            const modules = qrData.modules;
            const moduleCount = modules.size;
            const margin = 4;
            const totalModules = moduleCount + margin * 2;
            const cellSize = resolution / totalModules;

            canvas.width = resolution;
            canvas.height = resolution;
            const ctx = canvas.getContext("2d")!;

            // Background
            if (transparent) {
                ctx.clearRect(0, 0, resolution, resolution);
            } else {
                ctx.fillStyle = bgColor;
                ctx.fillRect(0, 0, resolution, resolution);
            }

            // Identify finder pattern positions (3 eyes)
            const eyePositions = [
                { row: 0, col: 0 },                          // top-left
                { row: 0, col: moduleCount - 7 },             // top-right
                { row: moduleCount - 7, col: 0 },             // bottom-left
            ];

            const isInEye = (r: number, c: number) => {
                for (const ep of eyePositions) {
                    if (r >= ep.row && r < ep.row + 7 && c >= ep.col && c < ep.col + 7) return true;
                }
                return false;
            };

            // Draw data modules (skip eye areas)
            for (let row = 0; row < moduleCount; row++) {
                for (let col = 0; col < moduleCount; col++) {
                    if (isInEye(row, col)) continue;
                    if (modules.get(row, col)) {
                        const x = (col + margin) * cellSize;
                        const y = (row + margin) * cellSize;
                        drawBody(ctx, x, y, cellSize, bodyShape, fgColor);
                    }
                }
            }

            // Draw eyes (frame + ball)
            for (const ep of eyePositions) {
                const ex = (ep.col + margin) * cellSize;
                const ey = (ep.row + margin) * cellSize;

                // Clear eye area background
                if (!transparent) {
                    ctx.fillStyle = bgColor;
                    ctx.fillRect(ex, ey, cellSize * 7, cellSize * 7);
                } else {
                    ctx.clearRect(ex, ey, cellSize * 7, cellSize * 7);
                }

                // Draw frame
                drawEyeFrame(ctx, ex, ey, cellSize, eyeFrameShape, fgColor);

                // Draw ball (inner 3x3 at offset 2,2)
                const bx = ex + cellSize * 2;
                const by = ey + cellSize * 2;
                drawEyeBall(ctx, bx, by, cellSize, eyeBallShape, fgColor);
            }

            // Draw logo
            if (logoDataUrl) {
                const img = new window.Image();
                img.onload = () => {
                    const logoDim = (resolution * logoSize) / 100;
                    const padding = logoDim * 0.12;
                    const cx = (resolution - logoDim) / 2;
                    const cy = (resolution - logoDim) / 2;

                    if (logoShape === "circle") {
                        ctx.fillStyle = transparent ? "rgba(255,255,255,0.95)" : bgColor;
                        ctx.beginPath();
                        ctx.arc(resolution / 2, resolution / 2, (logoDim + padding * 2) / 2, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(resolution / 2, resolution / 2, logoDim / 2, 0, Math.PI * 2);
                        ctx.clip();
                        ctx.drawImage(img, cx, cy, logoDim, logoDim);
                        ctx.restore();
                    } else {
                        const r = logoDim * 0.08;
                        ctx.fillStyle = transparent ? "rgba(255,255,255,0.95)" : bgColor;
                        ctx.beginPath();
                        ctx.roundRect(cx - padding, cy - padding, logoDim + padding * 2, logoDim + padding * 2, r + padding * 0.5);
                        ctx.fill();
                        ctx.save();
                        ctx.beginPath();
                        ctx.roundRect(cx, cy, logoDim, logoDim, r);
                        ctx.clip();
                        ctx.drawImage(img, cx, cy, logoDim, logoDim);
                        ctx.restore();
                    }
                };
                img.src = logoDataUrl;
            }

            setGenerated(true);
        } catch (err) {
            console.error("QR generation failed:", err);
        }
    }, [buildPayload, resolution, fgColor, bgColor, transparent, ecLevel, bodyShape, eyeFrameShape, eyeBallShape, logoDataUrl, logoSize, logoShape]);

    useEffect(() => {
        if (input.trim()) {
            const timer = setTimeout(generateQR, 200);
            return () => clearTimeout(timer);
        } else { setGenerated(false); }
    }, [input, type, wifiPassword, wifiSecurity, resolution, fgColor, bgColor, transparent, ecLevel, bodyShape, eyeFrameShape, eyeBallShape, logoDataUrl, logoSize, logoShape, generateQR]);

    // Logo upload
    const handleLogoUpload = (f: File) => {
        if (!f.type.startsWith("image/")) return;
        setLogoFile(f);
        const reader = new FileReader();
        reader.onload = () => setLogoDataUrl(reader.result as string);
        reader.readAsDataURL(f);
    };

    // Downloads
    const downloadQR = (format: "png" | "jpeg" | "webp") => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const mimeType = `image/${format}`;
        canvas.toBlob((blob) => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `qrcode_${resolution}px.${format}`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 3000);
        }, mimeType, 1.0);
    };

    const downloadSVG = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        // Convert canvas to SVG by embedding as image
        const dataUrl = canvas.toDataURL("image/png");
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${resolution}" height="${resolution}"><image href="${dataUrl}" width="${resolution}" height="${resolution}"/></svg>`;
        const blob = new Blob([svg], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "qrcode.svg";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 3000);
    };

    const copyQR = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        try {
            const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), "image/png"));
            await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch { /* */ }
    };

    /* === SHAPE SELECTOR COMPONENT === */
    const ShapeGrid = <T extends string>({ options, value, onChange, renderPreview }: {
        options: T[]; value: T; onChange: (v: T) => void;
        renderPreview: (shape: T, active: boolean) => React.ReactNode;
    }) => (
        <div className="flex flex-wrap gap-1.5">
            {options.map((opt) => (
                <button key={opt} onClick={() => onChange(opt)}
                    className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all ${value === opt ? "border-primary bg-primary/10 scale-105" : "border-muted hover:border-muted-foreground/30"}`}>
                    {renderPreview(opt, value === opt)}
                </button>
            ))}
        </div>
    );

    /* === Mini shape preview renderers === */
    const BodyPreview = ({ shape }: { shape: BodyShape }) => {
        const s = 5;
        switch (shape) {
            case "square": return <div className="w-5 h-5 grid grid-cols-3 gap-[1px]">{[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className={`${[0, 1, 2, 4, 6, 7, 8].includes(i) ? "bg-foreground" : ""} rounded-[0.5px]`} />)}</div>;
            case "dots": return <div className="w-5 h-5 grid grid-cols-3 gap-[1px]">{[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className={`${[0, 1, 2, 4, 6, 7, 8].includes(i) ? "bg-foreground rounded-full" : ""}`} />)}</div>;
            case "rounded": return <div className="w-5 h-5 grid grid-cols-3 gap-[1px]">{[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className={`${[0, 1, 2, 4, 6, 7, 8].includes(i) ? "bg-foreground rounded-[2px]" : ""}`} />)}</div>;
            case "diamond": return <div className="w-4 h-4 bg-foreground rotate-45" />;
            case "star": return <span className="text-[10px]">★</span>;
            case "heart": return <span className="text-[10px]">♥</span>;
        }
    };

    const EyeFramePreview = ({ shape }: { shape: EyeFrameShape }) => {
        switch (shape) {
            case "square": return <div className="w-5 h-5 border-2 border-foreground" />;
            case "rounded": return <div className="w-5 h-5 border-2 border-foreground rounded-md" />;
            case "circle": return <div className="w-5 h-5 border-2 border-foreground rounded-full" />;
            case "dots": return <div className="w-5 h-5 border-2 border-dotted border-foreground rounded-sm" />;
        }
    };

    const EyeBallPreview = ({ shape }: { shape: EyeBallShape }) => {
        switch (shape) {
            case "square": return <div className="w-3 h-3 bg-foreground" />;
            case "rounded": return <div className="w-3 h-3 bg-foreground rounded-sm" />;
            case "circle": return <div className="w-3 h-3 bg-foreground rounded-full" />;
            case "diamond": return <div className="w-2.5 h-2.5 bg-foreground rotate-45" />;
        }
    };

    const Section = ({ id, title, icon, children }: { id: string; title: string; icon: string; children: React.ReactNode }) => (
        <div className="border rounded-xl overflow-hidden mb-3">
            <button onClick={() => setActiveSection(activeSection === id ? null : id)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                    <span className="text-base">{icon}</span>
                    <span className="text-sm font-medium">{title}</span>
                </div>
                <span className={`text-muted-foreground text-xs transition-transform ${activeSection === id ? "rotate-180" : ""}`}>▼</span>
            </button>
            {activeSection === id && <div className="px-4 pb-4 border-t pt-4">{children}</div>}
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/data"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">QR Code Generator</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                {/* LEFT: Controls */}
                <div>
                    {/* Content */}
                    <Section id="content" title="Enter Content" icon="⚡">
                        <div className="flex gap-1 p-1 bg-muted rounded-lg mb-3 flex-wrap">
                            {presets.map((p) => (
                                <button key={p.type} onClick={() => { setType(p.type); setInput(""); }}
                                    className={`flex-1 py-1.5 px-2 text-xs rounded-md transition-colors flex items-center justify-center gap-1 min-w-[50px] ${type === p.type ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}>
                                    <p.icon className="h-3 w-3" />{p.label}
                                </button>
                            ))}
                        </div>
                        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder={presets.find((p) => p.type === type)?.placeholder} />
                        {type === "wifi" && (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <div>
                                    <label className="text-xs text-muted-foreground">Password</label>
                                    <Input value={wifiPassword} onChange={(e) => setWifiPassword(e.target.value)} placeholder="WiFi password" />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground">Security</label>
                                    <select value={wifiSecurity} onChange={(e) => setWifiSecurity(e.target.value as typeof wifiSecurity)}
                                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                                        <option value="WPA">WPA/WPA2</option><option value="WEP">WEP</option><option value="nopass">None</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </Section>

                    {/* Colors */}
                    <Section id="colors" title="Set Colors" icon="🎨">
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Foreground</label>
                                <div className="flex items-center gap-2">
                                    <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="h-9 w-12 rounded cursor-pointer border" />
                                    <Input value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="font-mono text-xs" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Background</label>
                                <div className="flex items-center gap-2">
                                    <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-9 w-12 rounded cursor-pointer border" disabled={transparent} />
                                    <Input value={transparent ? "transparent" : bgColor} onChange={(e) => setBgColor(e.target.value)} className="font-mono text-xs" disabled={transparent} />
                                </div>
                            </div>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={transparent} onChange={(e) => setTransparent(e.target.checked)} className="rounded" />
                            <span className="text-sm">Transparent background</span>
                        </label>
                    </Section>

                    {/* Logo */}
                    <Section id="logo" title="Add Logo Image" icon="🖼️">
                        {!logoFile ? (
                            <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/40 transition-colors"
                                onClick={() => document.getElementById("logo-input")?.click()}>
                                <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])} className="hidden" id="logo-input" />
                                <Upload className="h-5 w-5 mx-auto mb-1 text-muted-foreground" /><p className="text-xs text-muted-foreground">Upload logo (optional)</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    {logoDataUrl && <img src={logoDataUrl} alt="Logo" className="h-10 w-10 object-cover rounded border" />}
                                    <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{logoFile.name}</p></div>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setLogoFile(null); setLogoDataUrl(null); }}><X className="h-3.5 w-3.5" /></Button>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-muted-foreground">Size ({logoSize}%)</label>
                                        <input type="range" min={10} max={35} value={logoSize} onChange={(e) => setLogoSize(parseInt(e.target.value))} className="w-full accent-primary" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground">Shape</label>
                                        <div className="flex gap-1 mt-1">
                                            <button onClick={() => setLogoShape("square")} className={`flex-1 py-1 text-xs rounded-md border ${logoShape === "square" ? "bg-foreground text-background" : ""}`}>Square</button>
                                            <button onClick={() => setLogoShape("circle")} className={`flex-1 py-1 text-xs rounded-md border ${logoShape === "circle" ? "bg-foreground text-background" : ""}`}>Circle</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Section>

                    {/* Design */}
                    <Section id="design" title="Customize Design" icon="🎯">
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-muted-foreground mb-2 block font-medium">Body Shape</label>
                                <ShapeGrid<BodyShape>
                                    options={["square", "dots", "rounded", "diamond", "star", "heart"]}
                                    value={bodyShape} onChange={setBodyShape}
                                    renderPreview={(s) => <BodyPreview shape={s} />}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground mb-2 block font-medium">Eye Frame Shape</label>
                                <ShapeGrid<EyeFrameShape>
                                    options={["square", "rounded", "circle", "dots"]}
                                    value={eyeFrameShape} onChange={setEyeFrameShape}
                                    renderPreview={(s) => <EyeFramePreview shape={s} />}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground mb-2 block font-medium">Eye Ball Shape</label>
                                <ShapeGrid<EyeBallShape>
                                    options={["square", "rounded", "circle", "diamond"]}
                                    value={eyeBallShape} onChange={setEyeBallShape}
                                    renderPreview={(s) => <EyeBallPreview shape={s} />}
                                />
                            </div>
                        </div>
                    </Section>

                    {/* Quality */}
                    <Section id="quality" title="Quality & Size" icon="📐">
                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                    <span>Low Quality</span>
                                    <span className="font-mono font-medium text-foreground">{resolution} × {resolution} px</span>
                                    <span>High Quality</span>
                                </div>
                                <input type="range" min={256} max={2048} step={128} value={resolution} onChange={(e) => setResolution(parseInt(e.target.value))} className="w-full accent-primary" />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Error Correction</label>
                                <div className="flex gap-1">
                                    {(["L", "M", "Q", "H"] as ECLevel[]).map((level) => (
                                        <button key={level} onClick={() => setEcLevel(level)}
                                            className={`flex-1 py-1.5 text-xs rounded-md border transition-colors ${ecLevel === level ? "bg-foreground text-background" : "text-muted-foreground"}`}>
                                            {level} {level === "L" ? "(7%)" : level === "M" ? "(15%)" : level === "Q" ? "(25%)" : "(30%)"}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Higher = more scannable with logos, larger QR</p>
                            </div>
                        </div>
                    </Section>
                </div>

                {/* RIGHT: Preview + Download */}
                <div className="lg:sticky lg:top-6 lg:self-start">
                    <div className={`border rounded-xl p-6 mb-4 flex flex-col items-center ${transparent ? "bg-[repeating-conic-gradient(#e5e7eb_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]" : ""}`}>
                        <canvas ref={canvasRef} className="rounded-lg max-w-full" style={{ width: 280, height: 280, imageRendering: resolution > 512 ? "auto" : "pixelated" }} />
                        {!generated && <p className="text-sm text-muted-foreground mt-3">Enter content to generate</p>}
                    </div>

                    {generated && (
                        <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                                <Button onClick={() => downloadQR("png")} className="h-10">
                                    <Download className="h-4 w-4 mr-1.5" />PNG
                                </Button>
                                <Button onClick={() => downloadQR("webp")} variant="outline" className="h-10">
                                    <Download className="h-4 w-4 mr-1.5" />WebP
                                </Button>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <Button onClick={() => downloadQR("jpeg")} variant="outline" size="sm">JPEG</Button>
                                <Button onClick={downloadSVG} variant="outline" size="sm">SVG</Button>
                                <Button onClick={copyQR} variant="outline" size="sm">
                                    {copied ? <Check className="h-3 w-3 mr-1 text-green-500" /> : <Copy className="h-3 w-3 mr-1" />}Copy
                                </Button>
                            </div>
                        </div>
                    )}

                    <p className="text-xs text-muted-foreground text-center mt-4">100% local • No data sent</p>
                </div>
            </div>
        </div>
    );
}
