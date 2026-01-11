/**
 * Gemini AI Client - Official @google/genai SDK
 * 
 * PRIVACY NOTICE:
 * - All AI requests are sent directly from your browser to Google Gemini
 * - NoHoldr does NOT proxy, inspect, or store any AI requests
 * - Your API key is stored only in your browser's localStorage
 * - Your content is NOT collected or used by NoHoldr
 */

import { GoogleGenAI } from "@google/genai";

const STORAGE_KEY = "noholdr_gemini_api_key";
const MODEL = "gemini-3-flash-preview";

// API Key Management
export function getApiKey(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEY);
}

export function setApiKey(key: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, key);
}

export function clearApiKey(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
}

export function hasApiKey(): boolean {
    return !!getApiKey();
}

// Create Gemini client
function createClient(): GoogleGenAI | null {
    const apiKey = getApiKey();
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
}

// Generate text content (non-streaming)
export async function generateText(prompt: string): Promise<string> {
    const client = createClient();
    if (!client) throw new Error("API key not configured");

    const response = await client.models.generateContent({
        model: MODEL,
        contents: prompt,
    });

    return response.text || "";
}

// Generate content with system instruction
export async function generateWithSystem(
    systemInstruction: string,
    prompt: string
): Promise<string> {
    const client = createClient();
    if (!client) throw new Error("API key not configured");

    const response = await client.models.generateContent({
        model: MODEL,
        config: {
            systemInstruction: systemInstruction,
        },
        contents: prompt,
    });

    return response.text || "";
}

// Describe image
export async function describeImage(
    imageBase64: string,
    mimeType: string,
    prompt?: string
): Promise<string> {
    const client = createClient();
    if (!client) throw new Error("API key not configured");

    const response = await client.models.generateContent({
        model: MODEL,
        contents: [
            {
                role: "user",
                parts: [
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: imageBase64,
                        },
                    },
                    {
                        text: prompt || "Describe this image in detail.",
                    },
                ],
            },
        ],
    });

    return response.text || "";
}

// Error message extraction
export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        // Handle common Gemini API errors
        if (error.message.includes("API_KEY")) {
            return "Invalid API key. Please check your Gemini API key.";
        }
        if (error.message.includes("QUOTA") || error.message.includes("429")) {
            return "Rate limit exceeded. Please wait and try again.";
        }
        if (error.message.includes("PERMISSION")) {
            return "Permission denied. Your API key may not have access to this model.";
        }
        return error.message;
    }
    return "An unexpected error occurred.";
}
