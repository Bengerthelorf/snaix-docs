---
title: installation
description: pick a channel, paste one line
section: guide
order: 2
---

bcmr ships as a single static binary. four paths in — pick the one that fits
your toolchain, paste one line, keep moving.

## homebrew (macOS)

:::terminal
$ brew install melodic-lab/tap/bcmr
:::

universal — arm64 and x86_64 from the same formula.

## curl (Linux)

:::terminal
$ curl -sSf get.bcmr.sh | sh
:::

musl-static. works on debian, ubuntu, arch, alpine, fedora without extra deps.

:::callout{kind="warn"}
piping curl into sh is always a trust decision. the script fingerprint is
published on the [release page](#) so you can pin it.
:::

## windows

:::terminal
$ scoop install bcmr
$ winget install melodic-lab.bcmr
:::

## from source

:::terminal
$ cargo install bcmr --locked
:::

needs rust 1.78 or newer.
