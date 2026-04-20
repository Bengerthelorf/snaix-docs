---
title: how verification works
description: what "agree" means between source and destination
section: core concepts
order: 1
---

bcmr refuses to say a transfer succeeded until both ends agree on the bytes.
this page explains exactly what "agree" means, how it is checked, and what
happens when things go wrong.

## overview

a transfer in bcmr is a three-phase pipeline: **read** from source, **send**
to destination, **verify** on the other end. verification is not an optional
step — it is the only thing that turns a "copy completed" into a "copy
succeeded".

the whole design assumes networks lie, disks lie, and kernels occasionally
drop a byte on the floor. so every file is hashed twice, independently, and
the two hashes must match before the destination path is renamed into place.

:::callout{kind="info"}
this page is generated from a markdown file. fenced code blocks and callouts
are rewritten into live components by the site's markdown pipeline.
:::

## why blake3

bcmr uses **blake3** as its only hash. it is cryptographically strong,
parallelizable across cores, and fast enough that hashing is never the
bottleneck — on a modern laptop bcmr will saturate a 10 gbe link before the
cpu notices.

### chunked hashing

files are split into 1 mib chunks. each chunk produces a leaf hash; leaves
are combined pairwise into a tree; the root is the file hash. this is what
makes `--resume` safe.

### the manifest

for every transfer, bcmr writes a manifest: the source path, the destination
path, every file's size, mtime, and blake3, and a signature over the lot.

:::panel{title="manifest.json"}
version  1
src      ./dataset/
dst      node-04:/srv/
count    2481
bytes    15,231,488,000
algo     blake3
root     2c1f9a…e4b0
sig      ed25519:2c…9a
:::

## failure modes

1. **hash mismatch.** the destination file is deleted, the journal entry is
   marked failed, the exit code is 20.
2. **network drop mid-transfer.** partial file stays. run the same command
   again and bcmr resumes at the last verified chunk.
3. **source changed during copy.** detected via mtime + partial rehash. the
   transfer aborts with a clear error, not a silent truncation.

:::callout{kind="danger"}
do not use `bcmr mv` with `--verify=false`. the whole point of mv is that the
source is removed only after the destination is verified.
:::
