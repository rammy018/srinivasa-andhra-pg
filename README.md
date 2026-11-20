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

Use a Google Sheet owned by `srinivasa.andhra.pg@gmail.com` and deploy the provided script at `docs/google-apps-script.js`.

### 4-step deployment

1. Sign in to Google at `https://sheets.google.com` as `srinivasa.andhra.pg@gmail.com`. Create or open the target spreadsheet, then open **Extensions → Apps Script**.
2. Replace the editor contents with `docs/google-apps-script.js`. Save the project, then run `setup` once from the Apps Script editor and grant its Google Sheet and Drive permissions.
3. In Apps Script, select **Deploy → New deployment → Web app**. Set **Execute as** to **Me (srinivasa.andhra.pg@gmail.com)** and **Who has access** to **Anyone**. Deploy and copy the generated `/exec` Web App URL.
4. Add `VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec` to `.env.local` or your hosting provider environment variables. Rebuild/redeploy. Alternatively, open **Owner login → Settings** and save the URL for the current browser.

The script automatically creates `Sri_Srinivasa_PG_ID_Proofs`, `Active_Tenants`, and `Vacated_List`. Form submissions use `action: "submit"`; owner check-outs use `action: "vacate"`; owner dashboard loads use `GET` to return live active and vacated records.

POST requests use `Content-Type: text/plain;charset=utf-8`, avoiding a CORS preflight request. Deploy a new Apps Script version after changing `Code.gs`. Aadhaar and identity documents are sensitive: keep Drive sharing limited and use production authentication, consent, retention, encryption, and access controls before real-world use.

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
