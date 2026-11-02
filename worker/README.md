# Installation and download Worker

`index.js` is the complete source copied from active Cloudflare Worker **app**
version **672b6250** on 2026-11-02. SHA-256 of the 2531-byte export:
`a6b5ea0c4d63b4bde9b1c1be57ca033c410303188ba8034ab7b53f05d886b9bf`.
It is the deployed minimal Worker, not the obsolete portal's monolithic Worker.

`wrangler.jsonc` records the verified production account, compatibility date,
four narrow routes, Analytics dataset, workers.dev access, preview URLs,
observability and cron. Keep the runtime identity **app** when deploying.
Do not add a wildcard route covering the homepage: Pages serves all other URLs.

Required existing secret: **DEPLOY_HOOK**, the Pages `snaix-homes` deploy hook.
Its value remains encrypted in Cloudflare and must never be committed.
Existing Analytics binding: **ANALYTICS** → **app_analytics**.

To publish changes using the Cloudflare dashboard, replace the full `index.js`
in Worker's Edit code view with this file, deploy, and verify all four routes.
The Worker has no Git repository connection; Pages' Git integration deploys
only the site. A Worker source change therefore requires this separate deploy.
For CLI deployment with an authenticated Wrangler installation, first validate
against its schema and run a dry run:

```sh
wrangler deploy --config worker/wrangler.jsonc --dry-run
wrangler deploy --config worker/wrangler.jsonc
```

Preserve `DEPLOY_HOOK`, the dataset and scheduler. The installer response is
cached for 300 seconds; release responses for 3600 seconds. The scheduled
handler posts the hook every 30 minutes. The Worker serves `.sh` text; never
execute the scripts as part of verification. Validate downloads against their
upstream release hashes and check homepage/docs separately.
