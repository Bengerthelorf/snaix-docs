import type { Root, Code } from 'mdast';
import { visit } from 'unist-util-visit';

export function remarkMermaid() {
  return (tree: Root) => {
    visit(tree, 'code', (node: Code) => {
      if (node.lang !== 'mermaid') return;
      const value = node.value;
      (node as any).type = 'html';
      (node as any).value = `<pre class="mermaid" data-source="snaix-mermaid">${escapeHtml(value)}</pre>`;
    });
  };
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
