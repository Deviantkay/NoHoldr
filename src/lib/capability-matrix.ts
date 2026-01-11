/**
 * Capability Matrix
 * Defines available tools and conversions per file category
 */

import { FileCategory } from "./file-detector";
import {
    Crop, Maximize, FileDown, Minimize2, RotateCw, Droplets, Info, Trash2,
    Scissors, Merge, FileText, Hash, BookOpen, Lock, Unlock, Image,
    Music, Video, FileArchive, Database, ArrowRightLeft, Wand2
} from "lucide-react";

export interface Tool {
    id: string;
    name: string;
    description: string;
    icon: typeof Crop;
    href: string;
    category: "edit" | "convert" | "info" | "other";
}

export interface ToolAvailability {
    tool: Tool;
    available: boolean;
    reason?: string;
}

// All available tools
const TOOLS: Record<string, Tool> = {
    // Image tools
    imageCrop: { id: "imageCrop", name: "Crop", description: "Crop image", icon: Crop, href: "/image/crop", category: "edit" },
    imageResize: { id: "imageResize", name: "Resize", description: "Change dimensions", icon: Maximize, href: "/image/resize", category: "edit" },
    imageCompress: { id: "imageCompress", name: "Compress", description: "Reduce file size", icon: Minimize2, href: "/image/compress", category: "edit" },
    imageRotate: { id: "imageRotate", name: "Rotate", description: "Rotate or flip", icon: RotateCw, href: "/image/rotate", category: "edit" },
    imageWatermark: { id: "imageWatermark", name: "Watermark", description: "Add text overlay", icon: Droplets, href: "/image/watermark", category: "edit" },
    imageConvert: { id: "imageConvert", name: "Convert Format", description: "PNG, JPEG, WebP", icon: ArrowRightLeft, href: "/convert/image", category: "convert" },
    imageToPdf: { id: "imageToPdf", name: "Image to PDF", description: "Create PDF from images", icon: FileText, href: "/pdf/from-images", category: "convert" },
    imageMetadata: { id: "imageMetadata", name: "View Metadata", description: "See image info", icon: Info, href: "/image/metadata", category: "info" },
    imageRemoveMeta: { id: "imageRemoveMeta", name: "Remove Metadata", description: "Strip EXIF data", icon: Trash2, href: "/image/remove-metadata", category: "edit" },

    // PDF tools
    pdfMerge: { id: "pdfMerge", name: "Merge", description: "Combine PDFs", icon: Merge, href: "/pdf/merge", category: "edit" },
    pdfSplit: { id: "pdfSplit", name: "Split", description: "Extract pages", icon: Scissors, href: "/pdf/split", category: "edit" },
    pdfCompress: { id: "pdfCompress", name: "Compress", description: "Reduce size", icon: Minimize2, href: "/pdf/compress", category: "edit" },
    pdfRotate: { id: "pdfRotate", name: "Rotate", description: "Rotate pages", icon: RotateCw, href: "/pdf/rotate", category: "edit" },
    pdfWatermark: { id: "pdfWatermark", name: "Watermark", description: "Add text overlay", icon: Droplets, href: "/pdf/watermark", category: "edit" },
    pdfPageNumbers: { id: "pdfPageNumbers", name: "Page Numbers", description: "Add numbering", icon: Hash, href: "/pdf/page-numbers", category: "edit" },
    pdfRemovePages: { id: "pdfRemovePages", name: "Remove Pages", description: "Delete specific pages", icon: Trash2, href: "/pdf/remove-pages", category: "edit" },
    pdfToImages: { id: "pdfToImages", name: "PDF to Images", description: "Export as images", icon: Image, href: "/pdf/to-images", category: "convert" },
    pdfMetadata: { id: "pdfMetadata", name: "View Metadata", description: "See PDF info", icon: Info, href: "/pdf/metadata", category: "info" },
    pdfAcademicSplit: { id: "pdfAcademicSplit", name: "Academic Split", description: "Split by sections", icon: BookOpen, href: "/pdf/academic-split", category: "edit" },

    // Audio tools
    audioConvert: { id: "audioConvert", name: "Convert (WAV)", description: "Browser-supported only", icon: ArrowRightLeft, href: "/convert/audio", category: "convert" },
    audioTrim: { id: "audioTrim", name: "Trim", description: "Cut audio", icon: Scissors, href: "/media/audio-trim", category: "edit" },

    // Video tools
    videoConvert: { id: "videoConvert", name: "Convert (WebM)", description: "Browser-supported only", icon: ArrowRightLeft, href: "/convert/video", category: "convert" },
    videoTrim: { id: "videoTrim", name: "Trim", description: "Cut video", icon: Scissors, href: "/media/video-trim", category: "edit" },
    videoCompress: { id: "videoCompress", name: "Compress", description: "Reduce size", icon: Minimize2, href: "/media/video-compress", category: "edit" },
    videoExtractAudio: { id: "videoExtractAudio", name: "Extract Audio", description: "Get audio track", icon: Music, href: "/media/extract-audio", category: "convert" },

    // Archive tools
    archiveUnzip: { id: "archiveUnzip", name: "Unzip", description: "Extract files", icon: FileArchive, href: "/files/unzip", category: "edit" },
    archiveZip: { id: "archiveZip", name: "Create ZIP", description: "Compress files", icon: FileArchive, href: "/files/zip", category: "edit" },

    // Data tools
    dataJson: { id: "dataJson", name: "JSON Format", description: "Format & validate", icon: Database, href: "/data/json", category: "edit" },
    dataCsv: { id: "dataCsv", name: "CSV Edit", description: "View & edit CSV", icon: Database, href: "/data/csv", category: "edit" },
    dataBase64: { id: "dataBase64", name: "Base64", description: "Encode/decode", icon: ArrowRightLeft, href: "/data/base64", category: "convert" },

    // AI tools
    aiDescribe: { id: "aiDescribe", name: "AI Describe", description: "Describe image", icon: Wand2, href: "/ai/describe-image", category: "other" },
    aiMetadata: { id: "aiMetadata", name: "AI Metadata", description: "Generate metadata", icon: Wand2, href: "/ai/generate-metadata", category: "other" },
};

// Category-based tool availability
const CATEGORY_TOOLS: Record<FileCategory, string[]> = {
    image: [
        "imageCrop", "imageResize", "imageCompress", "imageRotate",
        "imageWatermark", "imageConvert", "imageToPdf", "imageMetadata",
        "imageRemoveMeta", "aiDescribe", "aiMetadata"
    ],
    pdf: [
        "pdfMerge", "pdfSplit", "pdfCompress", "pdfRotate", "pdfWatermark",
        "pdfPageNumbers", "pdfRemovePages", "pdfToImages", "pdfMetadata",
        "pdfAcademicSplit"
    ],
    document: [
        // Document → PDF is allowed but requires server-side
    ],
    audio: [
        "audioConvert", "audioTrim"
    ],
    video: [
        "videoConvert", "videoTrim", "videoCompress", "videoExtractAudio"
    ],
    archive: [
        "archiveUnzip"
    ],
    data: [
        "dataJson", "dataCsv", "dataBase64"
    ],
    unsupported: [],
};

// Locked tools with reasons
const LOCKED_TOOLS: Record<FileCategory, { toolId: string; reason: string }[]> = {
    image: [
        { toolId: "pdfMerge", reason: "Requires PDF files" },
        { toolId: "pdfSplit", reason: "Requires PDF file" },
        { toolId: "audioConvert", reason: "Requires audio file" },
        { toolId: "videoConvert", reason: "Requires video file" },
    ],
    pdf: [
        { toolId: "imageCrop", reason: "Requires image file" },
        { toolId: "imageResize", reason: "Requires image file" },
        { toolId: "audioConvert", reason: "Requires audio file" },
    ],
    document: [
        { toolId: "imageToPdf", reason: "Use PDF export instead" },
    ],
    audio: [
        { toolId: "imageCrop", reason: "Requires image file" },
        { toolId: "pdfMerge", reason: "Requires PDF files" },
        { toolId: "videoConvert", reason: "Requires video file" },
    ],
    video: [
        { toolId: "imageCrop", reason: "Requires image file" },
        { toolId: "pdfMerge", reason: "Requires PDF files" },
        { toolId: "audioConvert", reason: "Use Extract Audio instead" },
    ],
    archive: [
        { toolId: "imageCrop", reason: "Requires image file" },
    ],
    data: [
        { toolId: "imageCrop", reason: "Requires image file" },
    ],
    unsupported: [],
};

export function getAvailableTools(category: FileCategory): ToolAvailability[] {
    const availableIds = CATEGORY_TOOLS[category] || [];
    const lockedInfo = LOCKED_TOOLS[category] || [];

    const available: ToolAvailability[] = availableIds
        .map(id => TOOLS[id])
        .filter(Boolean)
        .map(tool => ({ tool, available: true }));

    const locked: ToolAvailability[] = lockedInfo
        .map(({ toolId, reason }) => TOOLS[toolId])
        .filter(Boolean)
        .map((tool, i) => ({
            tool,
            available: false,
            reason: lockedInfo[i]?.reason
        }));

    return [...available, ...locked];
}

export function getToolById(id: string): Tool | undefined {
    return TOOLS[id];
}
