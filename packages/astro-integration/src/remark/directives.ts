import type { Root } from 'mdast';
import remarkDirective from 'remark-directive';
import { visit } from 'unist-util-visit';

export { remarkDirective };

/* Rewrite root-relative image paths (/images/...) to include the product
   slug derived from the source file location. Markdown in the product
   submodules uses /images/... assuming their doc site is the root, but
   we serve every product under /{slug}/, so /images/foo.png needs to
   become /{slug}/images/foo.png. */
export function remarkProductImagePrefix() {
  return (tree: Root, file: any) => {
    const path = String(file?.path ?? file?.history?.[0] ?? '');
    const slug = path.match(/content\/([^/]+)\//)?.[1];
    if (!slug) return;
    visit(tree, 'image', (node: any) => {
      if (typeof node.url === 'string' && node.url.startsWith('/images/')) {
        node.url = `/${slug}${node.url}`;
      }
    });
  };
}

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
        const children = Array.isArray(node.children) ? node.children : [];
        const items: { label: string; code: any }[] = [];
        for (const child of children) {
          if (child.type !== 'code') continue;
          const meta: string = child.meta ?? '';
          const match = meta.match(/\[([^\]]+)\]/);
          const label = match ? match[1] : (child.lang ?? 'snippet');
          if (match) {
            child.meta = meta.replace(/\s*\[[^\]]+\]\s*/, '').trim() || null;
          }
          items.push({ label, code: child });
        }
        if (items.length === 0) return;

        const tabHead = {
          type: 'paragraph',
          data: {
            hName: 'div',
            hProperties: { className: ['snx-code-tabs__head'], role: 'tablist' },
          },
          children: items.map((it, i) => ({
            type: 'paragraph',
            data: {
              hName: 'button',
              hProperties: {
                className: ['snx-code-tabs__tab'],
                type: 'button',
                role: 'tab',
                'data-tab-label': it.label,
                'data-tab-idx': String(i),
                'aria-selected': i === 0 ? 'true' : 'false',
                tabindex: i === 0 ? '0' : '-1',
              },
            },
            children: [{ type: 'text', value: it.label }],
          })),
        };

        const panels = items.map((it, i) => ({
          type: 'paragraph',
          data: {
            hName: 'div',
            hProperties: {
              className: ['snx-code-tabs__panel'],
              role: 'tabpanel',
              'data-panel-idx': String(i),
              ...(i === 0 ? {} : { hidden: true }),
            },
          },
          children: [
            it.code,
            {
              type: 'paragraph',
              data: {
                hName: 'button',
                hProperties: {
                  className: ['snx-code-tabs__copy'],
                  type: 'button',
                  'data-copy': '',
                  'aria-label': 'copy',
                },
              },
              children: [{ type: 'text', value: 'copy' }],
            },
          ],
        }));

        const panelsWrap = {
          type: 'paragraph',
          data: {
            hName: 'div',
            hProperties: { className: ['snx-code-tabs__panels'] },
          },
          children: panels,
        };

        setHProps(node, 'div', ['snx-code-tabs'], { 'data-code-tabs': '' });
        node.children = [tabHead, panelsWrap];
        return;
      }
    });
  };
}

export const snaixRemarkPlugins = [
  remarkDirective,
  remarkSnaixDirectives,
  remarkProductImagePrefix,
];
