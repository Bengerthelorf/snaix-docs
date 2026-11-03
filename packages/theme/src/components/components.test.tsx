import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { InstallTabs } from './install/InstallTabs.tsx';
import { CliReference } from './cli/CliReference.tsx';
import { ThemeToggle } from './ThemeToggle.tsx';

describe('shared interactive components', () => {
  test('exposes the theme toggle state when its visual label is hidden on mobile', () => {
    const html = renderToStaticMarkup(<ThemeToggle />);
    expect(html).toContain('aria-pressed="false"');
  });

  test('offers installation choices as native, stateful keyboard controls', () => {
    const html = renderToStaticMarkup(<InstallTabs options={{
      macos: { name: 'Homebrew', cmd: 'brew install bcmr', note: 'macOS' },
      linux: { name: 'Linux', cmd: 'curl example | sh', note: 'Linux' },
    }} />);
    expect(html.match(/<button\b/g)).toHaveLength(2);
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('aria-pressed="false"');
  });

  test('handles empty reusable component inputs', () => {
    expect(() => renderToStaticMarkup(<InstallTabs options={{}} />)).not.toThrow();
    expect(() => renderToStaticMarkup(<CliReference spec={{ groups: [] }} />)).not.toThrow();
  });

  test('labels command search and exposes the selected command', () => {
    const html = renderToStaticMarkup(<CliReference spec={{ groups: [{ group: 'files', items: [{
      cmd: 'bcmr cp', sig: '<source> <dest>', desc: 'copy files', tags: [],
    }] }] }} />);
    expect(html).toContain('aria-label="Search commands"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).not.toContain('<main');
  });

  test('renders command examples as separate prompts without inventing successful output', () => {
    const html = renderToStaticMarkup(<CliReference spec={{ groups: [{ group: 'files', items: [{
      cmd: 'tool copy', sig: '<source> <dest>', desc: 'copy files', tags: [],
      example: ['tool copy --verify ./source ./backup', 'tool copy --dry-run ./source ./backup'],
    }] }] }} />);
    expect(html.match(/class="cmd-line cmd-prompt"/g)).toHaveLength(2);
    expect(html).not.toContain('cmd-line cmd-ok');
    expect(html).toContain('Command examples');
  });

  test('missing examples offer real help instead of executing a placeholder signature', () => {
    const html = renderToStaticMarkup(<CliReference spec={{ groups: [{ group: 'files', items: [{
      cmd: 'tool copy', sig: '<source> <dest>', desc: 'copy files', tags: [],
    }] }] }} />);
    expect(html).toContain('tool copy --help');
    expect(html).not.toContain('cmd-line cmd-ok');
  });

  test('legacy sample output is explicitly labelled and never assigned a success state', () => {
    const html = renderToStaticMarkup(<CliReference spec={{ groups: [{ group: 'files', items: [{
      cmd: 'tool copy', sig: '<source> <dest>', desc: 'copy files', tags: [],
    }] }], examples: { 'tool copy': ['sample transfer output'] } }} />);
    expect(html).toContain('Example output');
    expect(html).toContain('sample transfer output');
    expect(html).not.toContain('cmd-line cmd-ok');
  });
});
