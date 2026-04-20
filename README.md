# snaix.homes

Single Astro site hosting the portal at `/` and every product under
`/<slug>/`. Docs content comes from each product's own repo via git
submodules (locally symlinked during dev).

## Layout

```
apps/site/       # the one Astro project that builds the whole site
packages/
  theme/         # @snaix/docs-theme — components, layouts, motion, styles
  astro-integration/  # @snaix/docs — Astro integration (remark/rehype, virtual config)
```

## Local dev

```sh
bun install
bun --cwd apps/site run dev
```

Site serves at <http://localhost:4321>.

## Deploy

Cloudflare Pages, wired via GitHub integration. Each product repo's CI
pings a deploy hook on `docs/**` pushes, which triggers a rebuild with
`git submodule update --remote` picking up fresh content.

Licensed [Apache-2.0](LICENSE).
