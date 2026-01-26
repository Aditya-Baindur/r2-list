<p align="center">
  <img src="src/favicon/favicon.svg" width="96" />
</p>

# CDN Admin

> A lightweight Cloudflare R2 dashboard for managing your CDN buckets, files, and telemetry.

---

### Have you ever used a Cloudflare R2 bucket and wanted a real dashboard to control it?

**CDN Admin** gives you a clean, production-style UI to:

- Browse files & folders
- Move, rename, and organize objects
- Track file usage with D1 telemetry
- Secure access with Cloudflare Access

---

## Deployment

### Automatic Deployment (New R2 Bucket) :

Creates:

- R2 bucket
- D1 telemetry database
- Worker bindings

## Manual Deployment :

```bash
wrangler d1 create cdn-telem
wrangler d1 migrations apply cdn-telem --remote
```
