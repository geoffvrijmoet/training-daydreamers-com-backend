## PDF Generation and Storage Architecture

### Current Implementation

- Generator: `@react-pdf/renderer` (React-PDF) used server-side in a Next.js route.
- Entry point: `app/api/portal/generate-liability-waiver/route.tsx`.
- Template: Inline `WaiverPDF` React component renders waiver content, signature (drawn PNG or typed), and audit fields (timestamp, IP, User-Agent).
- Rendering: `renderToBuffer()` produces a PDF Buffer in the route.
- Delivery to storage: The API returns a base64 PDF plus a Cloudinary signed upload payload. The client uploads directly to Cloudinary as `resource_type: raw` under `clients/temp/liability-waivers`.
- Persistence: Intake flow later moves temp assets to `clients/client-{id}/liability-waivers` via existing upload metadata mover endpoints.

Key files:
- `app/api/portal/generate-liability-waiver/route.tsx` – generate PDF buffer + sign Cloudinary upload params
- `app/portal/intake/page.tsx` – convert base64 -> Blob, POST to Cloudinary, attach to intake
- `guidelines/serverless-pdf-generation.md` – guidance for serverless-friendly React-PDF and custom fonts

### Storage

- Provider: Cloudinary
- Type: `resource_type: raw` for PDFs
- Folders:
  - Temp: `clients/temp/liability-waivers`
  - Final: `clients/client-{id}/liability-waivers`
- Access: Public delivery URLs from Cloudinary; metadata persisted with client records via API routes

### Why React-PDF vs Headless Chromium

We intentionally do NOT use headless Chromium (Puppeteer/Playwright) for waiver PDFs.

Pros of our React-PDF approach:
- Lightweight runtime: no bundling/booting Chromium
- Serverless-friendly: compatible with Vercel Functions without special runtimes
- Deterministic layout: no CSS-to-print surprises from web rendering engines
- Direct embedding of vector text and images (signatures), easy to parameterize from React state

Cons:
- No direct “print exact web page” fidelity
- Complex HTML/CSS content requires re-implementation in React-PDF primitives

### Comparison: Lambda + Headless Chromium (Puppeteer/Playwright)

Reference baseline: “PDFs/heavy tasks: Lambda with headless Chromium (Puppeteer/Playwright).”

Chromium-based PDF generation:
- Pros:
  - Pixel-perfect printing of existing HTML/CSS
  - Supports complex layouts, web fonts, and client-side rendering artifacts
  - Easy to reuse existing page templates
- Cons:
  - Heavy cold starts; larger function bundles and memory requirements
  - Additional maintenance (bundling Chromium, layers, fonts)
  - Harder in constrained serverless environments without custom runtimes

Where we would consider Chromium:
- Large multi-page reports that must mirror app pages exactly
- HTML-first templates already styled for print
- Long-running or graphically intensive layouts where React-PDF is insufficient

### Performance & Limits

- React-PDF buffers are generated within the API route request lifecycle; current waiver PDFs are small and fast (< a few seconds typical).
- Upload is client-performed directly to Cloudinary using signed params; this offloads bandwidth from our API.

### Security

- The API signs Cloudinary parameters server-side; client never sees our secret.
- PDFs are stored publicly for download; metadata persists under the associated client record for auditability.
- Audit fields included in PDF: signed timestamp, IP, User-Agent, signatory name, consent.

### Future Extensions

- Report Card PDFs: follow the serverless guide (`guidelines/serverless-pdf-generation.md`) to add React-PDF templates and on-demand download endpoints.
- If print fidelity or complexity demands arise, evaluate a dedicated Lambda using headless Chromium for heavy PDF jobs; store outputs in Cloudinary (raw) under a `reports/` folder.

### File Map

- `app/api/portal/generate-liability-waiver/route.tsx`
- `app/portal/intake/page.tsx`
- `guidelines/serverless-pdf-generation.md`
- `internal/engineering/decisions/adr-001-client-side-pdf-generation.md`
- `internal/engineering/runbooks/esignature-maintenance.md`


