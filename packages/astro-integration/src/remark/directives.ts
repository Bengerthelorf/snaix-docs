import type { Root } from 'mdast';
import remarkDirective from 'remark-directive';
import { visit } from 'unist-util-visit';

export { remarkDirective };

type DirectiveNode = {
  type: 'containerDirective' | 'leafDirective' | 'textDirective';
  name: string;
  attributes?: Record<string, string | null | undefined>;
  data?: Record<string, any>;
  children?: any[];
};

function setHProps(
  node: DirectiveNode,
  tagName: string,
  className: string[],
  extra: Record<string, any> = {},
) {
  node.data = node.data ?? {};
  node.data.hName = tagName;
  node.data.hProperties = { className, ...extra };
}

export function remarkSnaixDirectives() {
  return (tree: Root) => {
    visit(tree, (n: any) => {
      if (
        n.type !== 'containerDirective' &&
        n.type !== 'leafDirective' &&
        n.type !== 'textDirective'
      ) {
        return;
      }

      const node = n as DirectiveNode;
      const name = node.name;
      const attrs = node.attributes ?? {};

      if (name === 'callout') {
        const kind = attrs.kind ?? 'info';
        setHProps(node, 'aside', ['snx-callout', `snx-callout--${kind}`], {
          'data-kind': kind,
        });
        // remark-directive parks `[label]` as a child with data.directiveLabel === true.
        const children = Array.isArray(node.children) ? node.children : [];
        const idx = children.findIndex(
          (c: any) => c?.data?.directiveLabel === true,
        );
        if (idx >= 0) {
          const label = children[idx] as any;
          label.data = label.data ?? {};
          label.data.hName = 'h5';
          label.data.hProperties = { className: ['snx-callout__title'] };
          children.splice(idx, 1);
          children.unshift(label);
          node.children = children;
        }
        return;
      }

      if (name === 'terminal') {
        setHProps(node, 'pre', ['snx-terminal', 't-mono']);
        return;
      }

      if (name === 'panel') {
        const title = attrs.title;
        setHProps(node, 'section', ['snx-panel', 'panel', 'panel--paper']);
        if (title) {
          const children = Array.isArray(node.children) ? node.children : [];
          node.children = [
            {
              type: 'paragraph',
              data: {
                hName: 'h3',
                hProperties: { className: ['panel-title', 't-h3', 'lower'] },
              },
              children: [{ type: 'text', value: title }],
            },
            ...children,
          ];
        }
        return;
      }

      if (name === 'code-group' || name === 'codegroup') {
        setHProps(node, 'div', ['snx-code-group']);
        const children = Array.isArray(node.children) ? node.children : [];
        const rewritten: any[] = [];
        for (const child of children) {
          if (child.type === 'code') {
            const meta: string = child.meta ?? '';
            const match = meta.match(/\[([^\]]+)\]/);
            if (match) {
              const label = match[1];
              rewritten.push({
                type: 'paragraph',
                data: {
                  hName: 'h4',
                  hProperties: { className: ['snx-code-group__label'] },
                },
                children: [{ type: 'text', value: label }],
              });
              child.meta = meta.replace(/\s*\[[^\]]+\]\s*/, '').trim() || null;
            }
            rewritten.push(child);
          } else {
            rewritten.push(child);
          }
        }
        node.children = rewritten;
        return;
      }
    });
  };
}

export const snaixRemarkPlugins = [remarkDirective, remarkSnaixDirectives];
