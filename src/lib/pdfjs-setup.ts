/**
 * PDF.js Worker Setup
 * Configures pdfjs-dist with a locally bundled worker to avoid CDN dependency
 */

import * as pdfjsLib from "pdfjs-dist";

// Use locally bundled worker instead of CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

export { pdfjsLib };

/**
 * Load a PDF document from a File object
 */
export async function loadPdfDocument(file: File) {
    const arrayBuffer = await file.arrayBuffer();
    return pdfjsLib.getDocument({ data: arrayBuffer }).promise;
}

/**
 * Render a single PDF page to a canvas and return as Blob
 */
export async function renderPageToBlob(
    pdfDoc: Awaited<ReturnType<typeof pdfjsLib.getDocument>["promise"]>,
    pageNumber: number,
    options: {
        scale?: number;
        format?: string;
        quality?: number;
    } = {}
): Promise<Blob> {
    const { scale = 2, format = "image/jpeg", quality = 0.85 } = options;
    const page = await pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;

    // White background for JPEG (no transparency)
    if (format === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await page.render({ canvasContext: ctx, viewport } as any).promise;

    return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error("Failed to render page"))),
            format,
            quality
        );
    });
}
