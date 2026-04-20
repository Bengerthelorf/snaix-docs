---
title: overview
description: what bcmr is and why
section: guide
order: 1
---

bcmr is a single-verb wrapper over copy / move / remove — one invocation,
one mental model, local paths and ssh targets treated the same way.

:::callout{kind="info"}
this doc page is authored in plain markdown. the :::callout, :::terminal,
and :::panel directives are handled by the `@snaix/docs` remark plugin.
:::

## quickstart

:::terminal
$ bcmr cp ./src node-04:/dst
→ hashing (blake3) ……  ok
→ handshake (ssh) ……  ok
→ streaming      ……  44 files
→ verify         ……  ok
:::

:::panel{title="build stamp"}
ver   0.9.1
sha   a3f109c
node  bcmr-build-04
:::
