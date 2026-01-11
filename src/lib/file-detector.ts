/**
 * File Type Detection Utility
 * Classifies files into categories based on MIME type and extension
 */

export type FileCategory =
    | "image"
    | "pdf"
    | "document"
    | "audio"
    | "video"
    | "data"
    | "archive"
    | "unsupported";

export interface DetectedFile {
    file: File;
    category: FileCategory;
    mimeType: string;
    extension: string;
    displayType: string;
}

const MIME_CATEGORIES: Record<string, FileCategory> = {
    // Images
    "image/jpeg": "image",
    "image/png": "image",
    "image/gif": "image",
    "image/webp": "image",
    "image/svg+xml": "image",
    "image/bmp": "image",
    "image/tiff": "image",

    // PDF
    "application/pdf": "pdf",

    // Documents
    "application/msword": "document",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "document",
    "application/vnd.oasis.opendocument.text": "document",
    "application/rtf": "document",

    // Audio
    "audio/mpeg": "audio",
    "audio/mp3": "audio",
    "audio/wav": "audio",
    "audio/ogg": "audio",
    "audio/webm": "audio",
    "audio/aac": "audio",
    "audio/flac": "audio",
    "audio/m4a": "audio",
    "audio/x-m4a": "audio",

    // Video
    "video/mp4": "video",
    "video/webm": "video",
    "video/ogg": "video",
    "video/quicktime": "video",
    "video/x-msvideo": "video",
    "video/x-matroska": "video",

    // Data
    "application/json": "data",
    "text/csv": "data",
    "text/plain": "data",
    "application/vnd.ms-excel": "data",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "data",

    // Archives
    "application/zip": "archive",
    "application/x-zip-compressed": "archive",
    "application/x-rar-compressed": "archive",
    "application/x-7z-compressed": "archive",
    "application/gzip": "archive",
    "application/x-tar": "archive",
};

const EXTENSION_CATEGORIES: Record<string, FileCategory> = {
    // Images
    jpg: "image", jpeg: "image", png: "image", gif: "image",
    webp: "image", svg: "image", bmp: "image", tiff: "image", ico: "image",

    // PDF
    pdf: "pdf",

    // Documents
    doc: "document", docx: "document", odt: "document", rtf: "document",

    // Audio
    mp3: "audio", wav: "audio", ogg: "audio", m4a: "audio",
    aac: "audio", flac: "audio", wma: "audio",

    // Video
    mp4: "video", webm: "video", mov: "video", avi: "video",
    mkv: "video", wmv: "video", flv: "video",

    // Data
    json: "data", csv: "data", txt: "data", xml: "data",
    xls: "data", xlsx: "data",

    // Archives
    zip: "archive", rar: "archive", "7z": "archive",
    gz: "archive", tar: "archive",
};

const CATEGORY_DISPLAY: Record<FileCategory, string> = {
    image: "Image",
    pdf: "PDF",
    document: "Document",
    audio: "Audio",
    video: "Video",
    data: "Data",
    archive: "Archive",
    unsupported: "Unsupported",
};

export function detectFileType(file: File): DetectedFile {
    const mimeType = file.type || "";
    const extension = file.name.split(".").pop()?.toLowerCase() || "";

    // Try MIME type first
    let category = MIME_CATEGORIES[mimeType];

    // Fall back to extension
    if (!category && extension) {
        category = EXTENSION_CATEGORIES[extension];
    }

    // Default to unsupported
    if (!category) {
        category = "unsupported";
    }

    return {
        file,
        category,
        mimeType,
        extension,
        displayType: CATEGORY_DISPLAY[category],
    };
}

export function detectFileTypes(files: File[]): DetectedFile[] {
    return files.map(detectFileType);
}

export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
