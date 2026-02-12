"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Copy, Check, RefreshCw } from "lucide-react";

const LOREM_WORDS = [
    "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
    "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
    "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud",
    "exercitation", "ullamco", "laboris", "nisi", "aliquip", "ex", "ea", "commodo",
    "consequat", "duis", "aute", "irure", "in", "reprehenderit", "voluptate",
    "velit", "esse", "cillum", "fugiat", "nulla", "pariatur", "excepteur", "sint",
    "occaecat", "cupidatat", "non", "proident", "sunt", "culpa", "qui", "officia",
    "deserunt", "mollit", "anim", "id", "est", "laborum", "at", "vero", "eos",
    "accusamus", "iusto", "odio", "dignissimos", "ducimus", "blanditiis",
    "praesentium", "voluptatum", "deleniti", "atque", "corrupti", "quos", "dolores",
    "quas", "molestias", "excepturi", "obcaecati", "cupiditate", "provident",
    "similique", "optio", "cumque", "nihil", "impedit", "quo", "minus",
    "maxime", "placeat", "facere", "possimus", "omnis", "voluptas", "assumenda",
    "repellendus", "temporibus", "autem", "quibusdam", "officiis", "debitis",
    "aut", "rerum", "necessitatibus", "saepe", "eveniet", "voluptates", "repudiandae",
    "recusandae", "itaque", "earum", "hic", "tenetur", "sapiente", "delectus",
    "reiciendis", "voluptatibus", "maiores", "alias", "perferendis", "doloribus",
    "asperiores", "repellat",
];

function randomWord(): string {
    return LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)];
}

function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function generateSentence(minWords = 6, maxWords = 14): string {
    const count = minWords + Math.floor(Math.random() * (maxWords - minWords + 1));
    const words = Array.from({ length: count }, randomWord);
    words[0] = capitalize(words[0]);
    // Add a comma sometimes in longer sentences
    if (count > 8 && Math.random() > 0.5) {
        const pos = 3 + Math.floor(Math.random() * (count - 5));
        words[pos] = words[pos] + ",";
    }
    return words.join(" ") + ".";
}

function generateParagraph(sentences = 4): string {
    return Array.from({ length: sentences }, () => generateSentence()).join(" ");
}

type OutputType = "paragraphs" | "sentences" | "words";

export default function LoremIpsumPage() {
    const [outputType, setOutputType] = useState<OutputType>("paragraphs");
    const [count, setCount] = useState(3);
    const [startWithLorem, setStartWithLorem] = useState(true);
    const [output, setOutput] = useState("");
    const [copied, setCopied] = useState(false);

    const generate = () => {
        let result = "";

        switch (outputType) {
            case "paragraphs": {
                const paragraphs = Array.from({ length: count }, (_, i) => {
                    const p = generateParagraph(3 + Math.floor(Math.random() * 3));
                    if (i === 0 && startWithLorem) {
                        return "Lorem ipsum dolor sit amet, consectetur adipiscing elit. " + p;
                    }
                    return p;
                });
                result = paragraphs.join("\n\n");
                break;
            }
            case "sentences": {
                const sentences = Array.from({ length: count }, (_, i) => {
                    if (i === 0 && startWithLorem) {
                        return "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";
                    }
                    return generateSentence();
                });
                result = sentences.join(" ");
                break;
            }
            case "words": {
                const words = Array.from({ length: count }, randomWord);
                if (startWithLorem && words.length >= 2) {
                    words[0] = "lorem";
                    words[1] = "ipsum";
                }
                result = words.join(" ");
                break;
            }
        }

        setOutput(result);
        setCopied(false);
    };

    const copy = async () => {
        await navigator.clipboard.writeText(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    // Auto-generate on first render
    useState(() => { generate(); });

    const wordCount = output ? output.split(/\s+/).filter(Boolean).length : 0;
    const charCount = output.length;

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/data"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-lg font-semibold">Lorem Ipsum Generator</h1>
            </div>

            {/* Type selector */}
            <div className="flex gap-1 p-1 bg-muted rounded-lg mb-4">
                {(["paragraphs", "sentences", "words"] as OutputType[]).map((t) => (
                    <button
                        key={t}
                        onClick={() => setOutputType(t)}
                        className={`flex-1 py-2 px-3 text-sm rounded-md transition-colors capitalize ${outputType === t ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {/* Controls */}
            <div className="border rounded-xl p-4 mb-4">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-muted-foreground">Count</label>
                        <Input
                            type="number"
                            min={1}
                            max={outputType === "words" ? 500 : 50}
                            value={count}
                            onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
                        />
                    </div>
                    <div className="flex items-end">
                        <label className="flex items-center gap-2 cursor-pointer pb-2">
                            <input
                                type="checkbox"
                                checked={startWithLorem}
                                onChange={(e) => setStartWithLorem(e.target.checked)}
                                className="rounded"
                            />
                            <span className="text-sm">Start with &quot;Lorem ipsum...&quot;</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Generate */}
            <Button onClick={generate} className="w-full h-11 mb-4">
                <RefreshCw className="h-4 w-4 mr-2" />Generate
            </Button>

            {/* Output */}
            {output && (
                <div className="border rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">{wordCount} words • {charCount} chars</span>
                        <Button variant="ghost" size="sm" onClick={copy}>
                            {copied ? <Check className="h-3 w-3 mr-1 text-green-500" /> : <Copy className="h-3 w-3 mr-1" />}
                            {copied ? "Copied" : "Copy"}
                        </Button>
                    </div>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap max-h-[50vh] overflow-y-auto text-muted-foreground">
                        {output}
                    </div>
                </div>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">Classic placeholder text for design & development</p>
        </div>
    );
}
