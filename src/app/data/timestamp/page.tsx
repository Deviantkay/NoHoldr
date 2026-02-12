"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Copy, Check, ArrowRightLeft, Clock } from "lucide-react";

export default function TimestampPage() {
    const [epoch, setEpoch] = useState("");
    const [dateStr, setDateStr] = useState("");
    const [now, setNow] = useState(Date.now());
    const [copied, setCopied] = useState<string | null>(null);

    // Live clock
    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    const currentDate = new Date(now);

    const epochToDate = (val: string) => {
        const num = parseInt(val);
        if (isNaN(num)) return null;
        // Auto-detect seconds vs milliseconds
        const ms = num < 1e12 ? num * 1000 : num;
        return new Date(ms);
    };

    const dateToEpoch = (val: string) => {
        const d = new Date(val);
        if (isNaN(d.getTime())) return null;
        return d;
    };

    const parsedFromEpoch = epoch ? epochToDate(epoch) : null;
    const parsedFromDate = dateStr ? dateToEpoch(dateStr) : null;

    const formatFull = (d: Date) => ({
        utc: d.toUTCString(),
        iso: d.toISOString(),
        local: d.toLocaleString(),
        relative: getRelative(d),
        unix: Math.floor(d.getTime() / 1000),
        unixMs: d.getTime(),
    });

    const getRelative = (d: Date): string => {
        const diff = Date.now() - d.getTime();
        const abs = Math.abs(diff);
        const suffix = diff > 0 ? "ago" : "from now";

        if (abs < 60000) return `${Math.floor(abs / 1000)} seconds ${suffix}`;
        if (abs < 3600000) return `${Math.floor(abs / 60000)} minutes ${suffix}`;
        if (abs < 86400000) return `${Math.floor(abs / 3600000)} hours ${suffix}`;
        if (abs < 2592000000) return `${Math.floor(abs / 86400000)} days ${suffix}`;
        if (abs < 31536000000) return `${Math.floor(abs / 2592000000)} months ${suffix}`;
        return `${Math.floor(abs / 31536000000)} years ${suffix}`;
    };

    const copyValue = async (value: string) => {
        await navigator.clipboard.writeText(value);
        setCopied(value);
        setTimeout(() => setCopied(null), 1500);
    };

    const CopyRow = ({ label, value }: { label: string; value: string }) => (
        <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
            <span className="text-xs text-muted-foreground">{label}</span>
            <button onClick={() => copyValue(value)} className="flex items-center gap-1.5 font-mono text-xs">
                {value}
                {copied === value ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
            </button>
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/data"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">Timestamp Converter</h1>
            </div>

            {/* Live clock */}
            <div className="border rounded-xl p-4 mb-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-primary animate-pulse" />
                    <span className="text-sm font-medium">Current Time</span>
                </div>
                <p className="font-mono text-2xl font-bold">{Math.floor(now / 1000)}</p>
                <p className="text-xs text-muted-foreground mt-1">{currentDate.toISOString()}</p>
                <Button variant="ghost" size="sm" className="mt-2" onClick={() => copyValue(Math.floor(now / 1000).toString())}>
                    <Copy className="h-3 w-3 mr-1" />Copy Unix
                </Button>
            </div>

            {/* Epoch → Date */}
            <div className="border rounded-xl p-4 mb-4">
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <ArrowRightLeft className="h-4 w-4" />Epoch → Human Date
                </h3>
                <Input
                    value={epoch}
                    onChange={(e) => setEpoch(e.target.value)}
                    placeholder="e.g. 1700000000 or 1700000000000"
                    className="font-mono mb-3"
                />

                {parsedFromEpoch && !isNaN(parsedFromEpoch.getTime()) && (
                    <div className="border rounded-lg overflow-hidden">
                        {(() => {
                            const f = formatFull(parsedFromEpoch);
                            return (
                                <>
                                    <CopyRow label="UTC" value={f.utc} />
                                    <CopyRow label="ISO 8601" value={f.iso} />
                                    <CopyRow label="Local" value={f.local} />
                                    <CopyRow label="Relative" value={f.relative} />
                                </>
                            );
                        })()}
                    </div>
                )}
            </div>

            {/* Date → Epoch */}
            <div className="border rounded-xl p-4 mb-4">
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <ArrowRightLeft className="h-4 w-4" />Human Date → Epoch
                </h3>
                <Input
                    type="datetime-local"
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    className="mb-3"
                />

                {parsedFromDate && !isNaN(parsedFromDate.getTime()) && (
                    <div className="border rounded-lg overflow-hidden">
                        {(() => {
                            const f = formatFull(parsedFromDate);
                            return (
                                <>
                                    <CopyRow label="Unix (seconds)" value={f.unix.toString()} />
                                    <CopyRow label="Unix (ms)" value={f.unixMs.toString()} />
                                    <CopyRow label="ISO 8601" value={f.iso} />
                                    <CopyRow label="Relative" value={f.relative} />
                                </>
                            );
                        })()}
                    </div>
                )}
            </div>

            {/* Common timestamps */}
            <div className="border rounded-xl p-4">
                <h3 className="text-sm font-medium mb-2">Quick Reference</h3>
                <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                        <span>Start of today</span>
                        <button onClick={() => setEpoch(Math.floor(new Date().setHours(0, 0, 0, 0) / 1000).toString())} className="font-mono hover:text-foreground">
                            {Math.floor(new Date().setHours(0, 0, 0, 0) / 1000)}
                        </button>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                        <span>1 hour ago</span>
                        <button onClick={() => setEpoch((Math.floor(Date.now() / 1000) - 3600).toString())} className="font-mono hover:text-foreground">
                            {Math.floor(Date.now() / 1000) - 3600}
                        </button>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                        <span>24 hours ago</span>
                        <button onClick={() => setEpoch((Math.floor(Date.now() / 1000) - 86400).toString())} className="font-mono hover:text-foreground">
                            {Math.floor(Date.now() / 1000) - 86400}
                        </button>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                        <span>Unix epoch (Y2K38)</span>
                        <button onClick={() => setEpoch("2147483647")} className="font-mono hover:text-foreground">
                            2147483647
                        </button>
                    </div>
                </div>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-6">All conversions happen locally</p>
        </div>
    );
}
