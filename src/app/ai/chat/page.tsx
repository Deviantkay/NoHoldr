"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Loader2, User, Bot, Trash2 } from "lucide-react";
import { generateText, hasApiKey, getErrorMessage } from "@/lib/gemini";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;
        if (!hasApiKey()) {
            setError("Please configure your API key in the AI hub first.");
            return;
        }

        const userMessage: Message = { role: "user", content: input.trim() };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);
        setError(null);

        try {
            // Build context from previous messages
            const context = messages.map(m => `${m.role}: ${m.content}`).join("\n");
            const fullPrompt = context ? `${context}\nuser: ${userMessage.content}\nassistant:` : userMessage.content;

            const response = await generateText(fullPrompt);
            setMessages(prev => [...prev, { role: "assistant", content: response }]);
        } catch (err) {
            setError(getErrorMessage(err));
        }

        setIsLoading(false);
    };

    const clearChat = () => {
        setMessages([]);
        setError(null);
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col h-[calc(100vh-8rem)]">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/ai"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-lg font-semibold">AI Chat</h1>
                    <p className="text-xs text-muted-foreground">Powered by Gemini</p>
                </div>
                {messages.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearChat}>
                        <Trash2 className="h-4 w-4 mr-1" /> Clear
                    </Button>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto rounded-xl border bg-muted/30 p-4 mb-4">
                {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                        Start a conversation...
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                                {msg.role === "assistant" && (
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                        <Bot className="h-4 w-4 text-primary" />
                                    </div>
                                )}
                                <div className={`max-w-[80%] rounded-xl p-3 ${msg.role === "user"
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-background border"
                                    }`}>
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                </div>
                                {msg.role === "user" && (
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                        <User className="h-4 w-4" />
                                    </div>
                                )}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Loader2 className="h-4 w-4 text-primary animate-spin" />
                                </div>
                                <div className="bg-background border rounded-xl p-3">
                                    <p className="text-sm text-muted-foreground">Thinking...</p>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20 p-3 mb-4">
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
            )}

            {/* Input */}
            <div className="flex gap-2">
                <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="min-h-[60px] resize-none"
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                        }
                    }}
                />
                <Button onClick={sendMessage} disabled={!input.trim() || isLoading} className="h-auto">
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-4">
                Requests go directly to Google Gemini
            </p>
        </div>
    );
}
