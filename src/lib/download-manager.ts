/**
 * Centralized Download Manager for NoHoldr
 * Supports individual, batch, and ZIP bundle downloads
 * Handles Blob URL lifecycle and memory cleanup
 */

import JSZip from "jszip";

interface DownloadableFile {
    name: string;
    blob: Blob;
}

// Track all created object URLs for cleanup
const activeUrls = new Set<string>();

/**
 * Download a single file
 */
export function downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    activeUrls.add(url);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Revoke after a delay to ensure download starts
    setTimeout(() => {
        URL.revokeObjectURL(url);
        activeUrls.delete(url);
    }, 5000);
}

/**
 * Download multiple files sequentially (individual downloads)
 * Uses a delay between downloads to avoid browser popup blocking
 */
export async function downloadMultipleFiles(files: DownloadableFile[]): Promise<void> {
    for (let i = 0; i < files.length; i++) {
        downloadFile(files[i].blob, files[i].name);
        if (i < files.length - 1) {
            await new Promise((r) => setTimeout(r, 300));
        }
    }
}

/**
 * Bundle files into a ZIP and download
 */
export async function downloadAsZip(
    files: DownloadableFile[],
    zipName: string
): Promise<void> {
    const zip = new JSZip();
    for (const file of files) {
        zip.file(file.name, file.blob);
    }
    const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
    });
    downloadFile(zipBlob, zipName.endsWith(".zip") ? zipName : `${zipName}.zip`);
}

/**
 * Revoke all tracked object URLs — call on component unmount or file reset
 */
export function revokeAllObjectUrls(): void {
    activeUrls.forEach((url) => {
        URL.revokeObjectURL(url);
    });
    activeUrls.clear();
}

/**
 * Format file size for display
 */
export function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
