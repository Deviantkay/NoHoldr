# Privacy Model

**Built with trust. Built for trust. Built on trust.**

---

## How Your Files Are Processed

### Local-First Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     YOUR BROWSER                            │
│                                                             │
│  ┌─────────┐    ┌──────────────┐    ┌─────────────────┐   │
│  │  Your   │───▶│   Browser    │───▶│   Processed     │   │
│  │  File   │    │   Memory     │    │   Result        │   │
│  └─────────┘    │   (RAM)      │    └─────────────────┘   │
│                 └──────────────┘                           │
│                                                             │
│  ✓ Processing happens here                                 │
│  ✓ Files never leave your device intentionally             │
│  ✓ No server upload required                               │
└─────────────────────────────────────────────────────────────┘
```

### What Happens to Your Files

| Stage | What Happens |
|-------|--------------|
| **Selection** | You choose files from your device |
| **Loading** | Files are read into browser memory (RAM) |
| **Processing** | Operations run locally using Web APIs/WebAssembly |
| **Result** | Processed files are available for download |
| **Cleanup** | Refreshing or closing clears all data |

### What We Do NOT Do

- ❌ Upload your files to any server
- ❌ Store your files anywhere
- ❌ Transmit file contents over the network (except for AI features you explicitly enable)
- ❌ Keep any file data after you close the page
- ❌ Use your files to train AI models
- ❌ Share your data with third parties

---

## Data Storage

### What Gets Stored Locally

NoHoldr uses browser `localStorage` only for:

| Data | Purpose | Can You Delete It? |
|------|---------|-------------------|
| API keys (if you provide them) | AI feature access | Yes, clear site data |
| User preferences | Remember settings | Yes, clear site data |

### What Is Never Stored

- Your files
- Your file contents
- Processing results
- Metadata from your files

---

## AI Features & Privacy

AI features are **disabled by default** and require explicit consent.

### When You Enable AI

If you choose to use AI features:

1. **You provide your own API key** — We never supply or share keys
2. **Requests go directly to the AI provider** — Browser → Gemini API
3. **We don't proxy, inspect, or log** — Your request doesn't pass through our servers
4. **Your data is not used for training** — By this project (AI provider terms apply)

### AI Data Flow

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Your      │────────▶│   Your      │────────▶│   Gemini    │
│   Browser   │         │   API Key   │         │   API       │
└─────────────┘         └─────────────┘         └─────────────┘
                              │
                    Direct connection
                    (No proxy server)
```

---

## Honest Limitations

We believe in transparency about what we cannot guarantee.

### Inherent Risks

Even with local-first processing, absolute security cannot be guaranteed due to:

- **Browser extensions** may have access to page content
- **Operating system** may cache or log data
- **Memory** may persist briefly after page close
- **Browser crashes** may leave temporary data
- **Malware** on your device can access browser data

### Our Position

We **reduce risk** through architecture but do not claim to **eliminate risk**.

Privacy is achieved by design, not by promises.

---

## Third-Party Services

### Services We Use

| Service | When Used | Your Data Sent |
|---------|-----------|----------------|
| Gemini API | Only if you enable AI features | Image/text you explicitly send |

### Services We Don't Use

- ❌ No analytics (Google Analytics, etc.)
- ❌ No tracking pixels
- ❌ No advertising networks
- ❌ No user fingerprinting
- ❌ No session recording

---

## Your Rights

### You Control

- Which files to process
- Whether to enable AI features
- What API keys to provide
- When to clear your data

### How to Clear Data

1. **Refresh the page** — Clears all file data from memory
2. **Close the tab** — Same as refresh
3. **Clear site data** — Removes stored preferences and API keys
4. **Use incognito mode** — Nothing persists after closing

---

## Contact

Questions about this privacy model:

- **GitHub:** [Deviantkay](https://github.com/Deviantkay)
- **Repository:** [NoHoldr](https://github.com/Deviantkay/NoHoldr)

---

*Last updated: January 2026*
