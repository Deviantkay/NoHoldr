"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    ArrowLeft, Sparkles, MessageSquare, FileText, Image, Wand2,
    Key, Shield, ExternalLink, Check, X, AlertTriangle
} from "lucide-react";
import { getApiKey, setApiKey, clearApiKey, hasApiKey } from "@/lib/gemini";

const tools = [
    {
        name: "Chat",
        description: "Conversational AI assistant",
        href: "/ai/chat",
        icon: MessageSquare,
    },
    {
        name: "Summarize",
        description: "Condense long text",
        href: "/ai/summarize",
        icon: FileText,
    },
    {
        name: "Describe Image",
        description: "AI image analysis",
        href: "/ai/describe-image",
        icon: Image,
    },
    {
        name: "Generate Metadata",
        description: "Titles, descriptions, keywords",
        href: "/ai/generate-metadata",
        icon: Wand2,
    },
];

export default function AIHubPage() {
    const [apiKey, setApiKeyState] = useState("");
    const [hasKey, setHasKey] = useState(false);
    const [showKey, setShowKey] = useState(false);

    useEffect(() => {
        setHasKey(hasApiKey());
    }, []);

    const handleSaveKey = () => {
        if (apiKey.trim()) {
            setApiKey(apiKey.trim());
            setHasKey(true);
            setApiKeyState("");
        }
    };

    const handleClearKey = () => {
        clearApiKey();
        setHasKey(false);
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <div>
                    <h1 className="text-xl font-semibold flex items-center gap-2">
                        <Sparkles className="h-5 w-5" /> AI Tools
                    </h1>
                    <p className="text-xs text-muted-foreground">Powered by Google Gemini</p>
                </div>
            </div>

            {/* Privacy Notice */}
            <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20 p-4 mb-6">
                <div className="flex gap-3">
                    <Shield className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <div className="text-sm">
                        <p className="font-medium text-green-900 dark:text-green-100 mb-1">Privacy First</p>
                        <ul className="text-green-700 dark:text-green-300 space-y-1 text-xs">
                            <li>• All AI requests go directly from your browser to Google Gemini</li>
                            <li>• NoHoldr does NOT proxy, inspect, or store your content</li>
                            <li>• Your API key is stored only in your browser&apos;s localStorage</li>
                            <li>• Your content is NOT used to train any AI models by NoHoldr</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* API Key Section */}
            <div className="rounded-xl border p-4 mb-6">
                <div className="flex items-center gap-2 mb-3">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Gemini API Key</span>
                    {hasKey && <Check className="h-4 w-4 text-green-500 ml-auto" />}
                </div>

                {!hasKey ? (
                    <div className="space-y-3">
                        <Input
                            type={showKey ? "text" : "password"}
                            placeholder="Enter your Gemini API key"
                            value={apiKey}
                            onChange={(e) => setApiKeyState(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <Button onClick={handleSaveKey} disabled={!apiKey.trim()} className="flex-1">
                                Save Key
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setShowKey(!showKey)}>
                                {showKey ? "Hide" : "Show"}
                            </Button>
                        </div>
                        <a
                            href="https://aistudio.google.com/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                            Get your free API key from Google AI Studio <ExternalLink className="h-3 w-3" />
                        </a>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">API key configured</span>
                        <Button variant="ghost" size="sm" onClick={handleClearKey} className="ml-auto">
                            <X className="h-4 w-4 mr-1" /> Remove
                        </Button>
                    </div>
                )}
            </div>

            {/* Tools Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                {tools.map((tool) => (
                    <Link
                        key={tool.name}
                        href={hasKey ? tool.href : "#"}
                        onClick={(e) => !hasKey && e.preventDefault()}
                        className={`flex items-center gap-3 p-4 rounded-xl border bg-card transition-all ${hasKey
                                ? "hover:border-foreground/30 hover:shadow-sm"
                                : "opacity-50 cursor-not-allowed"
                            }`}
                    >
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <tool.icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="font-medium text-sm">{tool.name}</p>
                            <p className="text-xs text-muted-foreground">{tool.description}</p>
                        </div>
                    </Link>
                ))}
            </div>

            {!hasKey && (
                <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-4">
                    <div className="flex gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                            Add your Gemini API key above to enable AI features.
                        </p>
                    </div>
                </div>
            )}

            <p className="text-xs text-muted-foreground text-center mt-8">
                AI features are opt-in • All requests go directly to Google
            </p>
        </div>
    );
}
