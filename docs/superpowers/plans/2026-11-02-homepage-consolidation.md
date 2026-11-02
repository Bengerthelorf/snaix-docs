# Homepage repository consolidation

> Execute the migration with evidence before deleting the legacy repository.

**Goal:** Keep `Bengerthelorf/snaix-docs` as the single maintained homepage repository, then delete `Bengerthelorf/app-snaix-homes-portal` as requested.

**Architecture:** Keep Cloudflare Pages `snaix-homes` and the existing `app` Worker. Move the actual deployed Worker source and deployment contract into this repository; preserve routes, Analytics binding, secret references, and `*/30 * * * *` scheduler. Stage published product docs without importing internal engineering notes.

**Constraints:** Preserve current URLs and product repositories. Never commit secret values. Back up all legacy Git refs and metadata before deletion. Do not delete legacy until the new repository is pushed and production verification passes.

- [x] Back up and inventory legacy Git refs, issues, PRs, releases and unique content.
- [x] Export the full active Worker and record actual settings and bindings.
- [x] Reproduce the docs failure, implement published-doc staging, and verify with fixtures plus a full build.
- [x] Add reproducible content setup and deployment instructions; review all changes.
- [x] Push the verified consolidation, verify successful Pages deployment and existing script/download routes.
- [x] Delete legacy GitHub repository only after the preceding checks pass; verify removal and retain the backup.

Review focus: missing title in an intentional published document must still fail; internal notes must not appear in output; route/asset hashes must remain intact; Worker configuration must preserve the existing Analytics dataset and secret; no undocumented legacy resource may be deleted.
