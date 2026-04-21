import DocsCode from './components/docs/DocsCode.astro';
import DocsTable from './components/docs/DocsTable.astro';

export const mdxComponents = {
  pre: DocsCode,
  table: DocsTable,
} satisfies Record<string, unknown>;
