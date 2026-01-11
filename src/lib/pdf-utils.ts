/**
 * PDF utility functions for browser-based processing
 */

/**
 * Converts PDF bytes (Uint8Array) to a Blob that's compatible with strict TypeScript
 */
export function pdfBytesToBlob(pdfBytes: Uint8Array): Blob {
    // Use slice to create a proper ArrayBuffer, then cast to satisfy TypeScript
    // The buffer.slice creates a new ArrayBuffer which is always compatible with Blob
    const arrayBuffer = pdfBytes.buffer.slice(
        pdfBytes.byteOffset,
        pdfBytes.byteOffset + pdfBytes.byteLength
    ) as ArrayBuffer;
    return new Blob([arrayBuffer], { type: "application/pdf" });
}

/**
 * Downloads PDF bytes as a file
 */
export function downloadPdfBytes(pdfBytes: Uint8Array, filename: string): void {
    const blob = pdfBytesToBlob(pdfBytes);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
