import DocsCode from './components/docs/DocsCode.astro';

export const mdxComponents = {
  pre: DocsCode,
} satisfies Record<string, unknown>;
