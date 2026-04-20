---
title: your first copy
description: move some bytes, verify them, see the manifest
section: guide
order: 3
---

the shortest loop that exercises every design promise.

## copy

:::terminal
$ bcmr cp ./photos ~/Backup/
scanning …… 1,204 files · 2.3 gb
complete · all blake3 verified
:::

## inspect the manifest

:::terminal
$ bcmr manifest ~/Backup/photos
signed · ed25519:2c…9a · 1,204 files
:::

## re-verify later

the destination contains a sealed `.bcmr/` sidecar. any time you want, you can
re-check every byte without rerunning the transfer.

:::terminal
$ bcmr verify ~/Backup/photos
recomputing blake3 …… 2.3 gb
all 1,204 files match
:::

:::callout{kind="info"}
if a byte flipped after the copy, verify prints the hash mismatch and exits
non-zero. silent corruption is the one failure bcmr refuses.
:::
