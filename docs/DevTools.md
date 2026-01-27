# Developer Tooling & Workflow

This project includes a small but powerful developer toolchain to make iteration fast and safe.

---

## Package Scripts

From `package.json`:

```json
{
  "deploy": "wrangler deploy",
  "dev": "wrangler dev",
  "start": "wrangler dev",
  "test": "vitest",
  "cf-typegen": "wrangler types",
  "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,html,css,md}\""
}
```

### Script Overview

| Script       | Purpose                               |
| ------------ | ------------------------------------- |
| `deploy`     | Deploy Worker to production           |
| `dev`        | Run local dev server                  |
| `start`      | Alias for `dev`                       |
| `test`       | Run test suite                        |
| `cf-typegen` | Generate Cloudflare binding types     |
| `format`     | Format all source files with Prettier |

---

## Prettier

Prettier is enabled to ensure:

* Consistent formatting
* Clean diffs
* Production‑quality readability

Run manually:

```bash
pnpm run format
```

---

## Custom Shell Tools — `cdn.sh`

A helper script is included to speed up common tasks.

Enable it once per session:

```bash
source cdn.sh
```

### Available Commands

| Command | Action                               |
| ------- | ------------------------------------ |
| `d`     | Runs `pnpm run deploy`               |
| `hp`    | Uploads the HTML UI to the R2 bucket |

---

## Typical Workflow

### Local Development

```bash
pnpm run dev
```

* Worker runs locally
* UI served from R2
* Auth bypassed with `AUTH_STATUS=dev`

---

### Deploy Backend

```bash
d
```

Deploys:

* Worker code
* Bindings
* Environment config

---

### Upload Frontend

```bash
hp
```

Uploads:

* `index.html`
* UI assets

---

## Type Safety

Run:

```bash
pnpm run cf-typegen
```

Generates:

* R2 bindings
* D1 bindings
* Env type definitions

---

## Notes

* No build step required
* No framework lock‑in
* Works on macOS, Linux, WSL

---

Happy hacking ⚡
