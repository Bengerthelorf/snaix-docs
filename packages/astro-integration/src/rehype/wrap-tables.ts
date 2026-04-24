import type { Element, Root, RootContent } from 'hast';
import { visit } from 'unist-util-visit';

const WRAP_CLASS = 'docs-table-wrap';

function isWrapped(parent: Element | Root): boolean {
  if (parent.type !== 'element') return false;
  if (parent.tagName !== 'div') return false;
  const cls = parent.properties?.className;
  return Array.isArray(cls) && cls.includes(WRAP_CLASS);
}

export function rehypeWrapTables() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName !== 'table') return;
      if (!parent || index === undefined) return;
      if (isWrapped(parent as Element | Root)) return;

      const wrapped: Element = {
        type: 'element',
        tagName: 'div',
        properties: { className: [WRAP_CLASS] },
        children: [node],
      };
      (parent.children as RootContent[])[index] = wrapped;
    });
  };
}
