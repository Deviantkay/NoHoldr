"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Upload, FileText, Download, Pen, Type, Eraser } from "lucide-react";
import { PDFDocument, rgb } from "pdf-lib";
import { downloadFile, formatBytes } from "@/lib/download-manager";

type SignMode = "draw" | "type";

export default function SignPDFPage() {
    const [file, setFile] = useState<File | null>(null);
    const [pageCount, setPageCount] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [mode, setMode] = useState<SignMode>("draw");
    const [typedName, setTypedName] = useState("");
    const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
    const [pageNum, setPageNum] = useState(1);
    const [posX, setPosX] = useState(50);
    const [posY, setPosY] = useState(90);
    const [sigWidth, setSigWidth] = useState(200);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawing = useRef(false);

    const handleFile = useCallback(async (f: File) => {
        if (f.type !== "application/pdf") return;
        try {
            const pdf = await PDFDocument.load(await f.arrayBuffer());
            setFile(f);
            setPageCount(pdf.getPageCount());
        } catch { /* ignore */ }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    }, [handleFile]);

    // Canvas drawing setup
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || mode !== "draw") return;
        const ctx = canvas.getContext("2d")!;
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "#1a1a2e";
    }, [mode]);

    const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        if ("touches" in e) {
            return {
                x: (e.touches[0].clientX - rect.left) * scaleX,
                y: (e.touches[0].clientY - rect.top) * scaleY,
            };
        }
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    };

    const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        isDrawing.current = true;
        const { x, y } = getCanvasPoint(e);
        const ctx = canvasRef.current!.getContext("2d")!;
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        if (!isDrawing.current) return;
        const { x, y } = getCanvasPoint(e);
        const ctx = canvasRef.current!.getContext("2d")!;
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const endDraw = () => {
        isDrawing.current = false;
        // Save signature
        if (canvasRef.current) {
            setSignatureDataUrl(canvasRef.current.toDataURL("image/png"));
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext("2d")!;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        setSignatureDataUrl(null);
    };

    // Generate signature from typed text
    const generateTypedSig = () => {
        if (!typedName.trim()) return;
        const canvas = document.createElement("canvas");
        canvas.width = 400;
        canvas.height = 120;
        const ctx = canvas.getContext("2d")!;
        ctx.font = "italic 48px 'Georgia', 'Times New Roman', serif";
        ctx.fillStyle = "#1a1a2e";
        ctx.textBaseline = "middle";
        ctx.fillText(typedName, 10, 60);
        setSignatureDataUrl(canvas.toDataURL("image/png"));
    };

    useEffect(() => {
        if (mode === "type") {
            generateTypedSig();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [typedName, mode]);

    const hasSignature = signatureDataUrl !== null;

    const applySignature = async () => {
        if (!file || !signatureDataUrl) return;
        setIsProcessing(true);
        setProgress(20);

        try {
            const pdf = await PDFDocument.load(await file.arrayBuffer());
            setProgress(40);

            // Embed signature image
            const sigBytes = await fetch(signatureDataUrl).then((r) => r.arrayBuffer());
            const sigImage = await pdf.embedPng(new Uint8Array(sigBytes));
            setProgress(60);

            // Place on selected page
            const page = pdf.getPage(pageNum - 1);
            const { width: pageWidth, height: pageHeight } = page.getSize();

            const aspect = sigImage.width / sigImage.height;
            const drawWidth = sigWidth;
            const drawHeight = drawWidth / aspect;

            // Position: percentages to PDF coordinates (origin bottom-left)
            const x = (posX / 100) * pageWidth;
            const y = pageHeight - ((posY / 100) * pageHeight) - drawHeight;

            page.drawImage(sigImage, {
                x,
                y,
                width: drawWidth,
                height: drawHeight,
            });

            setProgress(80);

            const bytes = await pdf.save();
            const blob = new Blob([new Uint8Array(bytes).buffer as ArrayBuffer], { type: "application/pdf" });
            downloadFile(blob, file.name.replace(/\.pdf$/i, "_signed.pdf"));

            setProgress(100);
            setTimeout(() => {
                setIsProcessing(false);
                setProgress(0);
            }, 800);
        } catch (err) {
            console.error("Sign failed:", err);
            setIsProcessing(false);
            setProgress(0);
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/pdf"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">Sign PDF</h1>
            </div>

            {!file ? (
                <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById("pdf-input")?.click()}
                >
                    <input type="file" accept="application/pdf" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" id="pdf-input" />
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm"><span className="font-medium">Drop PDF</span> <span className="text-muted-foreground">or tap</span></p>
                </div>
            ) : (
                <>
                    {/* File info */}
                    <div className="border rounded-xl p-4 mb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-red-500" />
                                <div>
                                    <span className="text-sm font-medium">{file.name}</span>
                                    <p className="text-xs text-muted-foreground">{pageCount} pages • {formatBytes(file.size)}</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => { setFile(null); setSignatureDataUrl(null); }}>Change</Button>
                        </div>
                    </div>

                    {/* Signature mode tabs */}
                    <div className="flex gap-1 p-1 bg-muted rounded-lg mb-4">
                        <button
                            onClick={() => { setMode("draw"); setSignatureDataUrl(null); }}
                            className={`flex-1 py-2 px-3 text-sm rounded-md transition-colors flex items-center justify-center gap-2 ${mode === "draw" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}
                        >
                            <Pen className="h-3.5 w-3.5" />Draw
                        </button>
                        <button
                            onClick={() => { setMode("type"); clearCanvas(); }}
                            className={`flex-1 py-2 px-3 text-sm rounded-md transition-colors flex items-center justify-center gap-2 ${mode === "type" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}
                        >
                            <Type className="h-3.5 w-3.5" />Type
                        </button>
                    </div>

                    {/* Signature input */}
                    <div className="border rounded-xl p-4 mb-4">
                        {mode === "draw" ? (
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium">Draw your signature</label>
                                    <Button variant="ghost" size="sm" onClick={clearCanvas}>
                                        <Eraser className="h-3 w-3 mr-1" />Clear
                                    </Button>
                                </div>
                                <canvas
                                    ref={canvasRef}
                                    width={500}
                                    height={150}
                                    className="w-full border rounded-lg cursor-crosshair bg-white touch-none"
                                    style={{ height: 120 }}
                                    onMouseDown={startDraw}
                                    onMouseMove={draw}
                                    onMouseUp={endDraw}
                                    onMouseLeave={endDraw}
                                    onTouchStart={startDraw}
                                    onTouchMove={draw}
                                    onTouchEnd={endDraw}
                                />
                            </div>
                        ) : (
                            <div>
                                <label className="text-sm font-medium mb-2 block">Type your name</label>
                                <Input
                                    value={typedName}
                                    onChange={(e) => setTypedName(e.target.value)}
                                    placeholder="Your name"
                                    className="mb-3"
                                />
                                {signatureDataUrl && (
                                    <div className="border rounded-lg p-3 bg-white">
                                        <img src={signatureDataUrl} alt="Typed signature preview" className="h-12 object-contain" />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Placement options */}
                    <div className="border rounded-xl p-4 mb-4 space-y-3">
                        <h3 className="text-sm font-medium">Placement</h3>

                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="text-xs text-muted-foreground">Page</label>
                                <Input type="number" min={1} max={pageCount} value={pageNum} onChange={(e) => setPageNum(parseInt(e.target.value) || 1)} />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground">X position (%)</label>
                                <Input type="number" min={0} max={100} value={posX} onChange={(e) => setPosX(parseInt(e.target.value) || 0)} />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground">Y position (%)</label>
                                <Input type="number" min={0} max={100} value={posY} onChange={(e) => setPosY(parseInt(e.target.value) || 0)} />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-muted-foreground">Signature width (pts)</label>
                            <Input type="number" min={50} max={500} value={sigWidth} onChange={(e) => setSigWidth(parseInt(e.target.value) || 200)} className="w-32" />
                        </div>

                        <p className="text-xs text-muted-foreground">Default: bottom-center of the last page</p>
                    </div>

                    {/* Progress */}
                    {isProcessing && (
                        <div className="mb-4">
                            <Progress value={progress} className="h-1.5" />
                        </div>
                    )}

                    {/* Action */}
                    <Button onClick={applySignature} disabled={isProcessing || !hasSignature} className="w-full h-11">
                        <Pen className="h-4 w-4 mr-2" />
                        {hasSignature ? "Sign & Download" : "Draw or type a signature first"}
                    </Button>
                </>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">Signature embedded locally • PDF never uploaded</p>
        </div>
    );
}
