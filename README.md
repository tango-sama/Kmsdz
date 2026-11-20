# KMS website — SARL KAT Multi Services (Touggourt, Algeria)

Bilingual (Arabic RTL default / French LTR) corporate website with a multi-step quote-request system that saves
every request to a **Google Sheet** through a secure server-side API.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 3 · Zod · Lucide icons · self-hosted Cairo/Inter fonts.
No Google SDK: the Sheets integration is ~150 lines of dependency-free server code (`src/lib/sheets.ts`).

```bash
npm install
cp .env.example .env.local     # fill in later (see below)
npm run dev                    # http://localhost:3000  (redirects to /ar)
npm run typecheck && npm test && npm run build
```

---

## 1. Where to edit things (nothing is hardcoded in components)

| What | File |
|---|---|
| Company name, phones, e-mail, WhatsApp, address, **business hours**, Maps URL | `src/config/company.ts` (+ env vars) |
| The 9 services: titles, descriptions, features, benefits, SEO text, images | `src/config/services.ts` |
| All Arabic UI text / all French UI text | `src/i18n/ar.ts` / `src/i18n/fr.ts` (same keys; a test enforces parity) |
| Wilayas (58) | `src/config/wilayas.ts` |
| Validation rules (shared by browser + server) | `src/lib/validation.ts`, `src/lib/phone.ts` |
| Sheet columns / row building | `src/lib/sheets.ts`, `src/lib/submission.ts` |

URLs: `/ar` and `/fr` + `/about`, `/services`, `/services/<slug>`, `/quote`, `/quote/confirmation`, `/contact`.
Un-prefixed URLs redirect to the saved language (cookie `kms-lang`) or Arabic. The language switcher keeps the current page.
`/sitemap.xml` (with hreflang), `/robots.txt`, localized 404, JSON-LD (GeneralContractor, Service, Breadcrumb) are generated.

---

## 2. Connecting the Google Sheet (do this when you have the link)

The site uses the **Google Sheets API with a service account** (chosen over Apps Script: credentials stay in Vercel env vars,
no public script URL to abuse, proper error codes, duplicate detection).

1. **Google Cloud Console** → create/select a project → *APIs & Services → Library* → enable **Google Sheets API**.
2. *IAM & Admin → Service Accounts → Create service account* (any name, e.g. `kms-website`). No roles needed.
3. Open it → *Keys → Add key → Create new key → JSON*. Download the file. **Never commit it.**
4. Create (or open) your Google Sheet. Click **Share** and add the service-account e-mail
   (`…@…iam.gserviceaccount.com`, field `client_email` in the JSON) as **Editor**.
5. Note the tab name at the bottom of the sheet (e.g. `Demandes`).
6. Set the environment variables (locally in `.env.local`, in production in Vercel → Settings → Environment Variables):

| Variable | Value |
|---|---|
| `GOOGLE_SHEETS_ID` | The spreadsheet ID **or the whole sheet URL** (both work) |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `client_email` from the JSON |
| `GOOGLE_PRIVATE_KEY` | `private_key` from the JSON (paste as-is; literal `\n` or real line breaks both work) |
| `GOOGLE_SHEET_NAME` | Exact tab name, e.g. `Demandes` |

7. Redeploy. On the first submission the API writes the header row automatically if row 1 is empty:

`Submission ID · Submission Date · Customer Name · Phone Number · Email · Customer Type · Requested Service · Wilaya · Municipality · Project Type · Project Description · Estimated Budget · Expected Start Date · Additional Notes · Attached Files · Submission Status · Language · Form Type`

(The 17 suggested columns + `Form Type`, which distinguishes *Quote request* from *Contact message*.
Values are stored in French labels; dates are Algeria time; status starts as `New` — edit it by hand in the sheet.)

**Behaviour you can rely on**
- Until the four variables are set, the API answers `503 NOT_CONFIGURED` and the form shows a clear *“your request was NOT sent”* message with phone/WhatsApp fallbacks. **No fake success is ever shown.**
- Google errors (auth, permission 403, quota, timeout…) → `502` + error message; they are logged on the server (Vercel logs) without any personal data.
- The confirmation page only appears after a real `ok: true` response; opening its URL directly shows “no recent request”.
- Duplicate protection: each form load has a unique key; re-sending the same key returns the *original* reference instead of adding a row.
- Free-text cells starting with `= + - @` are prefixed with `'` (spreadsheet formula-injection guard).

### Attachments (optional)
Vercel functions accept ~4.5 MB bodies, so uploads are limited to 3 files / 4 MB (PDF, JPG, PNG, WebP, content-sniffed).
To store them, create a **Vercel Blob** store (Vercel → Storage) and set `BLOB_READ_WRITE_TOKEN`; their URLs go in the “Attached Files” column
(public, unguessable URLs). Without it, files are **not** stored: the sheet shows `NOT STORED: name…` and the confirmation page
tells the visitor to send the files by WhatsApp/e-mail with their reference. *(Blob upload could not be tested without a real token — please test once.)*

### Spam protection
Honeypot field · minimum fill time (2.5 s) · per-IP rate limit (6 / 10 min, in-memory per server instance) · duplicate-key check ·
strict server validation · file content sniffing · optional **Cloudflare Turnstile** (free): set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`.
For strict global rate limiting on Vercel, swap `src/lib/ratelimit.ts` for Upstash Redis.

---

## 3. Deploy on Vercel

1. Push the repo to GitHub → Vercel → *Add New Project* → import it (framework auto-detected, no settings needed).
2. Add the environment variables below, deploy.
3. Add the domain `www.kms-dz.com` (Vercel → Domains) and set `NEXT_PUBLIC_SITE_URL=https://www.kms-dz.com`.
4. Submit `https://www.kms-dz.com/sitemap.xml` in Google Search Console.

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | yes | canonical URLs, sitemap, Open Graph |
| `GOOGLE_SHEETS_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SHEET_NAME` | **yes, for requests to be saved** | Google Sheets |
| `BLOB_READ_WRITE_TOKEN` | optional | store attachments |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | optional | captcha |
| `DATABASE_URL` | **yes, for the worker portal** | Neon/Postgres (see 3b) |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | first login only | creates the first administrator (see 3b) |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | optional | default `213661204590` |
| `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL` | optional | Google Maps → Share → *Embed a map* → copy the `src` URL |

---

## 3b. Worker portal (login, jobs, files, news)

URL: `https://www.kms-dz.com/ar/portal` (French: `/fr/portal`) — linked discreetly from the site footer, `noindex`, not in the sitemap.

**What workers get** — dashboard · *Jobs* (current jobs, status/priority/due date, related files) · *Files* (forms, plans, procedures: search, open in a new tab to **print**, download) · *News* (post, comment; admin can pin/moderate) · own account / password change.
**What the admin gets (same pages, extra controls)** — create / edit / delete jobs and change their status · upload / edit / delete files · **choose, for every job and file, "all workers" or "selected workers only"** (hidden items are invisible and return 404 to everyone else) · create worker accounts, reset passwords, deactivate (instant sign-out) or delete users · moderate news.

### Setup on Vercel (5 minutes)
1. Vercel → your project → **Storage → Create Database → Neon (Postgres)** → connect to the project. This sets `DATABASE_URL` automatically. (Any Postgres works; Neon's free tier is plenty.)
2. Add env vars `ADMIN_USERNAME` (e.g. `boss`) and `ADMIN_PASSWORD` (a temporary password, 8+ chars). Redeploy.
3. Open `/ar/portal`, sign in with them. You are **forced to choose a new password**; then remove `ADMIN_PASSWORD` from Vercel (it is only used while there are no users).
4. *Users* page → add each worker. The generated temporary password is shown **once** — give it to the worker (they must change it at first login).
5. Tables are created automatically; there is nothing to migrate.

### Local preview on your PC
`npm install` then `npm run dev`, open `http://localhost:3000/ar/portal/login` → `admin` / `ChangeMe123!` (dev only; this default does **not** exist in production). Data is kept in `./.data` (git-ignored) with an embedded Postgres, no account needed.

### Security design
- Passwords: scrypt (salted, memory-hard), min 8 chars, not containing the username; temporary passwords are random and must be changed.
- Sessions: random token in an `HttpOnly`, `Secure`, `SameSite=Lax` cookie (`__Host-` prefix in production); only its SHA-256 is stored; 7-day expiry; every request re-checks that the account is still active; changing a password signs out other devices.
- Brute force: 5 failed attempts per username (or 25 per IP) in 15 min lock sign-in; identical error for unknown user / wrong password / disabled account.
- CSRF: Server Actions (Next verifies Origin) + SameSite cookies. SQL: parameterised queries only.
- Files: stored **inside the database (private)**, never at a public URL; served by `/api/portal/files/<id>` only to signed-in users allowed to see them (permission is checked in the same SQL query); type + content (magic bytes) verified; PDFs/images open inline, Office files are download-only; no HTML/SVG/executables.
- Authorisation is enforced on the server in one place per resource (`src/lib/portal/*`); the UI hiding buttons is cosmetic.

### Limits to know
- **File size: 4 MB per file** (Vercel request-body limit). JPG/PNG images are converted to **WebP in the browser at their full original resolution** (only the compression quality is lowered until they fit; pixels are reduced only as an absolute last resort, and the admin is told when that happens). If WebP would not make a small image smaller, the original is kept. PDFs/Office files are never converted. Large multi-page plans should be compressed, or tell me and I will add direct-to-storage uploads (Vercel Blob).
- Files live in Postgres: Neon's free 0.5 GB is ~100+ typical PDFs. 
- Login throttling uses the database, so it works across serverless instances.
- Workers are read-only on jobs/files by design (they post only in *News*). Per-worker job "I started / I finished" updates can be added later.
- There is no e-mail / SMS: password resets are done by the admin (Users → Reset).

---

## 4. Still needs your input

- [ ] **Google Sheet link + service-account credentials** (section 2) — requests cannot be saved before this.
- [ ] **Real photos.** The images are crops of your flyers/AI visuals (low resolution, slightly soft). Replace files in `public/images/services/*.webp`, `public/images/hero.webp`, `public/images/about.webp` (same names) with real project photos. `public/og.jpg` (1200×630) is the social-share image.
- [ ] **Review the service texts** (`src/config/services.ts`, esp. *Solar & smart farms* and *Interior space planning*). They are drafted from your presentation without invented claims — please confirm they describe what you actually do.
- [ ] **Business hours** (`company.businessHours`), **street address** (`company.streetAddress`), **Google Maps embed URL**, social links — placeholders until provided.
- [ ] Confirm the **WhatsApp number** (assumed to be 0661 20 45 90).
- [ ] Optional: a Privacy Policy page (the quote form has a consent checkbox).
- [ ] `www.kms-dz.com` DNS → Vercel.
- [ ] Worker portal: create the Neon database, set `ADMIN_USERNAME`/`ADMIN_PASSWORD` (section 3b).

No certifications, licences, project references, testimonials, statistics or company history were invented.

## 5. Tests & quality

`npm test` runs 71 tests (incl. the worker portal: login/lockout/sessions, per-worker visibility, file authorisation, news permissions, SQL-injection attempts) and, before them, API behaviour with a mocked Google (success, header creation, duplicates, 500/403/auth failures,
honeypot, too-fast, validation, consent, rate limit, formula injection, file sniffing, contact form), Algerian phone rules, i18n key parity.
Also verified in a real browser (Chromium): RTL/LTR layouts at phone/desktop widths with no horizontal overflow, step validation messages
in Arabic, file rejection, failure state on a non-configured server (no confirmation shown), success → confirmation, language switch + cookie.

Known note: `npm audit` reports a PostCSS advisory inside Next 15's bundled build tooling (affects build-time CSS processing only, not the running site);
upgrade Next when a patched 15.x/16.x is adopted.
