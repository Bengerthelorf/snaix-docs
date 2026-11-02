# Homepage consolidation — 2026-11-02

Requested outcome: maintain only `Bengerthelorf/snaix-docs` for the homepage,
then delete the redundant `Bengerthelorf/app-snaix-homes-portal` repository.

## Ownership and source

The current Astro homepage, About/design system, and bcmr, pikpaktui,
macIconChanger and Claudit product sites already live in this repository.
Cloudflare Pages project `snaix-homes` deploys `main` to `app.snaix.homes`.

The separate Cloudflare Worker `app` remains necessary for two installers,
their release proxies and the half-hourly Pages rebuild. Its complete active
source (version `672b6250`) is now in `worker/index.js`, with its verified
runtime configuration in `worker/wrangler.jsonc`. This consolidation keeps
the existing Worker and encrypted `DEPLOY_HOOK`, Analytics dataset and routes.
Worker Git integration was not enabled; source updates require a separate
Worker deployment as documented in `worker/README.md`.

The old repository's Worker is obsolete: it contains a broad portal/assets/
stats/docs proxy and lacks the production scheduler. It must not be deployed.
Historical frontend styling/assets are preserved in the archive, rather than
added to the current design.

## Backup before deletion

Portable backup directory on the owner's Mac:
`~/Documents/snaix-docs-backups/2026-11-02-legacy-portal/`.

- Legacy main: `2356d1561612fa87dd2a603602665942d25f47b3`.
- Complete history: 3 commits, 1 branch, no tags, 19 files at head.
- Git bundle: `app-snaix-homes-portal.bundle`.
- Bundle SHA-256: `775376f55ae60a8c31b1165f56bb5bb33953974162e40ac2a2fce4b6e7dbabf5`.
- Source archive SHA-256: `d274a8f9376ca1a2eb4d7709538057b2b8106ae6548eb12f64db3f1c51c65d52`.
- Repository/branches/commits/issues/PRs/releases/Actions metadata, source file
  SHA-256 manifest and the detailed legacy audit are stored with the bundle.
- Checked all-state issues, PRs, releases and Actions runs were empty. The wiki
  remote was not available; no wiki content was retrieved.

## Documentation build repair

Reproduced the production `InvalidContentEntryDataError`: five internal
macIconChanger engineering notes in `docs/` had no frontmatter. Staging now
excludes Markdown without frontmatter before the unchanged strict collection
schema runs. Documents that declare frontmatter still fail on a missing or
invalid title or malformed YAML. Product source checkouts are never modified.

Local verification: 9 tests passed, 39 assertions; full build produced 379
pages, with Pagefind indexing 375 pages across 30 languages. Staged 31 bcmr,
3 Claudit, 18 pikpaktui and 300 IconChanger docs. Exactly five internal notes
were skipped, and their routes are absent from the build.

## Completion gates

- [x] Export production Worker source and reconcile configuration.
- [x] Verify complete portable legacy backup.
- [x] Reproduce and repair the failing docs ingestion, then build and test.
- [ ] Push reviewed code to the production branch and verify Pages deployment.
- [ ] Verify live homepage/product docs and install/release proxy contracts.
- [ ] Delete the redundant GitHub repository and verify its absence.

Deletion is deliberately last; a successful local build alone is insufficient.
