<p align="center">
  <h1 align="center">NoHoldr</h1>
  <p align="center"><strong>50+ file tools that run entirely in your browser.</strong></p>
  <p align="center">No uploads. No servers. No tracking. Just tools.</p>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-NAL--2.0-blue.svg" alt="License: NAL-2.0" /></a>
  <a href="https://github.com/Deviantkay"><img src="https://img.shields.io/badge/Made%20by-Deviantkay-purple.svg" alt="Made by Deviantkay" /></a>
  <img src="https://img.shields.io/badge/Next.js-16.1-black?logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript" alt="TypeScript" />
</p>

---

## Why NoHoldr?

Most online file tools upload your files to a server. NoHoldr doesn't. Every tool processes files **locally in your browser** using Canvas API, Web Audio API, PDF.js, and other browser-native technologies. Your files never leave your device.

---

## Tools

### 📄 PDF — 15 tools

| Organize | Convert | Secure |
|----------|---------|--------|
| Merge | To Images | Sign |
| Split | From Images | Watermark |
| Academic Split | | Page Numbers |
| Remove Pages | | Protect |
| Re-order | | Unlock |
| Rotate | | View Metadata |
| Compress | | |

### 🖼️ Image — 8 tools

| Edit | Convert | Metadata |
|------|---------|----------|
| Compress | Convert (8 formats) | View EXIF |
| Resize | | Remove EXIF |
| Crop | | |
| Rotate | | |
| Watermark | | |

**Converter formats:** JPEG, PNG, WebP, AVIF, BMP, GIF, SVG (trace), ICO — with quality slider, max-width resize, ICO size presets, and batch ZIP download.

### 🎵 Media — 6 tools

| Audio | Video |
|-------|-------|
| Convert Audio | Convert Video |
| Trim Audio | Compress Video |
| Extract Audio | Trim Video |

**Audio output:** WAV (8/16/24/32-bit), OGG (Opus), WebM Audio — with sample rate, channel, and normalization controls.
**Video output:** WebM (VP8/VP9) with bitrate, resolution, and FPS controls. Frame extraction to JPEG/PNG.

### 🔄 Smart Convert — auto-detect & convert

Drop any file and NoHoldr detects its type, then shows available conversions:

| Input | Available Outputs |
|-------|-------------------|
| Image | JPEG, PNG, WebP, AVIF, BMP, GIF, ICO, PDF |
| PDF | JPEG, PNG, WebP, AVIF, BMP, GIF |
| Document | PDF, TXT, HTML, Markdown |
| Audio | WAV, OGG, WebM Audio |
| Video | WebM (VP8/VP9), Frame JPEG, Frame PNG |
| Data | JSON ↔ CSV, JSON → XML |

**Dedicated sub-converters** with advanced controls:
- `/convert/image` — 8 output formats, quality, resize, ICO sizes, batch ZIP
- `/convert/audio` — Sample rate, bit depth, channels, normalize
- `/convert/video` — Bitrate, resolution, FPS, frame extraction with time slider
- `/convert/document` — TXT, HTML, Markdown, CSV ↔ JSON, JSON → XML

### 📁 Files — 5 tools

| Tool | Description |
|------|-------------|
| Create ZIP | Bundle files into a ZIP archive |
| Extract ZIP | Unpack ZIP archives |
| Batch Rename | Rename files with patterns |
| Find Duplicates | Detect duplicate files by hash |
| File Hash | Generate file checksums |

### 📊 Data — 16 tools

| Tool | Tool | Tool |
|------|------|------|
| JSON Formatter | CSV Viewer | Text Hash |
| Base64 Encode/Decode | URL Encode/Decode | Text Diff |
| QR Code Generator | Color Picker | Password Generator |
| Lorem Ipsum | Markdown Preview | Timestamp Converter |
| Regex Tester | Word Counter | Unit Converter |
| Color Extractor | | |

### ✨ AI — 4 tools (opt-in)

| Tool | Description |
|------|-------------|
| Chat | Conversational AI assistant |
| Summarize | Condense long text |
| Describe Image | AI image analysis |
| Generate Metadata | Titles, descriptions, keywords |

> AI tools use **your own Gemini API key**. Requests go directly from your browser to Google — NoHoldr never sees your content.

---

## Privacy

| | |
|---|---|
| 🔒 **In-Browser** | Files processed entirely in browser memory |
| 🚫 **No Upload** | Nothing is sent to any server |
| 🗑️ **No Storage** | Nothing is saved anywhere |
| 👤 **No Tracking** | No accounts, no analytics, no cookies |

---

## Getting Started

```bash
# Clone
git clone https://github.com/Deviantkay/NoHoldr.git
cd NoHoldr

# Install
npm install

# Dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16.1 (Turbopack) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 |
| **Components** | shadcn/ui + Radix UI |
| **PDF** | pdf-lib, PDF.js, fontkit |
| **Image** | Canvas API, Piexifjs |
| **Audio/Video** | Web Audio API, MediaRecorder, OfflineAudioContext |
| **Data** | Web Crypto API (hashing), JSZip |
| **AI** | Google Gemini (opt-in, BYOK) |

---

## Project Structure

```
src/
├── app/
│   ├── pdf/           # 15 PDF tools
│   ├── image/         # 8 image tools
│   ├── media/         # 6 audio & video tools
│   ├── convert/       # Smart Convert + 4 sub-converters
│   ├── files/         # 5 file utilities
│   ├── data/          # 16 data & developer tools
│   └── ai/            # 4 AI tools (Gemini)
├── components/ui/     # shadcn/ui components
└── lib/               # Shared utilities
```

---

## License

Licensed under the **NoHoldr Attribution License (NAL) v2.0** — a permissive MIT-based license with attribution requirements for derivative works.

See [LICENSE](LICENSE) for full terms and [NOTICE](NOTICE) for third-party attributions.

---

<p align="center"><strong>NoHoldr</strong> by <a href="https://github.com/Deviantkay">Deviantkay</a></p>
