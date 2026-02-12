/**
 * PDF utility functions for browser-based processing
 */

import { downloadFile } from "./download-manager";

/**
 * Converts PDF bytes (Uint8Array) to a Blob that's compatible with strict TypeScript
 */
export function pdfBytesToBlob(pdfBytes: Uint8Array): Blob {
    // Ensure we have a plain ArrayBuffer for TypeScript strict mode compatibility
    const arr = new Uint8Array(pdfBytes);
    return new Blob([arr.buffer as ArrayBuffer], { type: "application/pdf" });
}

/**
 * Downloads PDF bytes as a file (uses centralized download manager)
 */
export function downloadPdfBytes(pdfBytes: Uint8Array, filename: string): void {
    const blob = pdfBytesToBlob(pdfBytes);
    downloadFile(blob, filename);
}
