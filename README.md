# snaix.homes

The maintained repository for the personal homepage at
<https://app.snaix.homes>, product websites and documentation, and the
installation/download Worker. Product source code stays in its own repository.

## Layout

```text
apps/site/             # Astro homepage and four product sites
packages/theme/       # Shared components, layouts and styles
packages/astro-integration/
worker/                # Cloudflare app Worker: installers, releases, rebuild cron
content/               # Ignored product checkouts populated per environment
```

## Local development

```sh
bun install --frozen-lockfile
bun run content:setup
bun --cwd apps/site run dev
```

Open <http://localhost:4321>. `content:setup` clones missing product repositories;
it preserves existing checkouts. Refresh those separately with Git when needed.
These are ordinary clones, not submodules.

The site's prebuild/predev stage copies product docs into `.cache/docs/`.
Markdown without frontmatter is treated as an internal note and excluded;
documents with frontmatter still undergo the strict Astro schema validation.
Neither staging nor image sync modifies the source product checkouts.

```sh
bun test
bun run build
```

## Deployment

Cloudflare Pages project **snaix-homes**, production branch **main**, builds this
repository and serves `app.snaix.homes`. Build from the repository root:

```sh
bun run content:setup && bun install --frozen-lockfile && bun --cwd apps/site run build
```

Output directory: `apps/site/dist`. Use Node 22 and Bun 1.3.13 as configured in
Pages. Product workflows trigger the existing Pages deploy hook on docs changes;
the Worker also triggers it every 30 minutes to refresh release metadata.

Worker source and its separate deployment instructions are in
[worker/README.md](worker/README.md). Pages and the Worker are two Cloudflare
resources maintained from this single repository.

The historical `app-snaix-homes-portal` frontend is retired. See the
[consolidation record](docs/operations/homepage-consolidation-2026-11-02.md)
for source provenance, backup checksums, and validation status.
