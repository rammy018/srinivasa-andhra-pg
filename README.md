# Sri Srinivasa Andhra PG

Responsive tenant joining and owner management app built with React, TypeScript, Vite, Tailwind CSS and Lucide icons.

## Run locally

```bash
npm install
npm run dev
```

Create `.env.local` from `.env.example` to configure the optional Apps Script endpoint. Restart Vite after changing environment variables.

## Features

- Public joining form with phone/Aadhaar validation, required image/PDF uploads, room selection, and rules acceptance.
- Confirmation screen with a copyable WhatsApp welcome message.
- Discreet owner login at the footer and protected `/owner` workspace, tenant search/room filtering, document previews, check-out/refund calculations and CSV export.
- Browser `localStorage` persistence, with optional Google Apps Script sync.
- Owner settings provide an Apps Script URL field for the current browser session/device.

## Owner access and security note

The requested demo password is `Rammy018`; the owner mobile field accepts any valid 10-digit number. This is client-side demo authentication, not production-grade security: anyone can inspect frontend bundles and browser storage. Do not use this as a secure system for Aadhaar or other sensitive identity documents without moving authentication and storage to a protected backend, adding role-based access, encryption, consent/retention policies, and access controls. Use only a test environment until then. Uploaded files are limited to 5 MB each. The WhatsApp action uses a placeholder contact number in `src/App.tsx`; replace `WHATSAPP` with the actual PG contact number.

## Google Sheets and Drive integration

The frontend sends a JSON POST to `VITE_APPS_SCRIPT_URL`, including the uploaded files as Base64 data URLs. Configure and deploy your own Google Apps Script Web App to validate requests, create/update a Sheet and save file data into Drive, and return a suitable response. The email `srinivasa.andhra.pg@gmail.com` is included as the intended recipient metadata; it does not grant access or configure a Google account. Apps Script deployment must handle CORS/browser requests and enforce appropriate authorization. Never expose private credentials in this frontend. Local browser storage is retained as a fallback; records saved there exist only on that browser/device.

Example environment file:

```dotenv
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

After setting the URL, run `npm run build` again. The Settings dialog saves a URL for display/status on the current browser; the built-in request uses the Vite environment variable, so rebuild to change the live sync endpoint.

## Build

```bash
npm run build
npm run preview
```

## GitHub deployment

Push the project to GitHub. For deployment workflows, install dependencies with `npm ci` (or `npm install` if no lockfile is committed), then run `npm run build`. Publish the generated `dist/` directory. Add `VITE_APPS_SCRIPT_URL` as a repository or environment secret/variable for the deployment build if sync is desired.

## Netlify

- Build command: `npm run build`
- Publish directory: `dist`
- Add `VITE_APPS_SCRIPT_URL` in Site configuration → Environment variables.
- SPA deep-link redirect is included in `public/_redirects`.

## Vercel

Import the GitHub repository; Vercel detects Vite automatically. Set the build command to `npm run build` and output directory to `dist`. Add `VITE_APPS_SCRIPT_URL` to project environment variables. `vercel.json` rewrites app routes to `index.html`.
