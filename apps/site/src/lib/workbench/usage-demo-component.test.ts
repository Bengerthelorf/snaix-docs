import { expect, test } from 'bun:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import UsageDemo from '../../components/workbench/UsageDemo';

test('the demo starts with the menu bar Usage/Quota workflow before exposing dashboard filters', () => {
  const html = renderToStaticMarkup(createElement(UsageDemo));
  expect(html).toContain('aria-label="Claudit menu bar experience"');
  expect(html).toContain('aria-label="Menu bar view"');
  expect(html).toContain('data-popover-view="usage"');
  expect(html).toContain('Today’s estimated cost');
  expect(html).toContain('$2.10');
  expect(html).toContain('Open Dashboard');
  expect(html).not.toContain('id="usage-range"');
  expect(html).not.toContain('class="ud-session-table"');
  expect(html.split('>Example data<')).toHaveLength(2);
});
