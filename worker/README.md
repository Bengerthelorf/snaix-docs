# Installation and download Worker

`index.js` is the audited local successor to Cloudflare Worker **app** version
**672b6250**, exported on 2026-11-02.
The original 2531-byte production export is preserved outside this repository at
`/Users/snaix/Documents/snaix-docs-backups/2026-11-02-legacy-portal/active-worker-export`.
SHA-256 of that original export:
`a6b5ea0c4d63b4bde9b1c1be57ca033c410303188ba8034ab7b53f05d886b9bf`.
This source derives from the minimal installer/download Worker, not the obsolete
portal's monolithic Worker.

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

The audit preserves installer rewriting, release streaming and Analytics, while
rejecting methods other than GET/HEAD with 405. Release query strings reach
GitHub. HEAD reuses cached GET metadata; a cold release HEAD is forwarded as
HEAD and never populates the GET cache with an empty body. A cold installer HEAD
fetches and transforms the small script as GET so subsequent GETs can reuse it.
All HEAD responses omit the body. Unknown project names, including inherited
object property names, return 404 without upstream requests.

Upstream connection failures and installer body-read failures return 502.
Cache lookup failures fall back to upstream, and rejected background cache
writes are logged without rejecting an otherwise successful request. The
[Cloudflare Cache API](https://developers.cloudflare.com/workers/runtime-apis/cache/)
requires GET keys; the HEAD handling observes that restriction.

Run the isolated regression suite from the repository root:

```sh
bun test worker/index.test.js
```

Tests use real Request/Response objects with in-memory cache, network and
Analytics substitutes. They make no network requests and use a fake deploy-hook
URL. They do not establish that the source works in the production
Cloudflare runtime; validate that separately with Wrangler and a controlled
deployment when ready.
