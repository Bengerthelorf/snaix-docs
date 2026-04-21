import type { CliGroup } from '@snaix/docs-theme';

export const iconchangerCommandGroups: CliGroup[] = [
  {
    group: 'state',
    items: [
      {
        cmd: 'iconchanger status',
        sig: '',
        desc: 'show current configuration status — alias count, cached icon count, helper script state',
        tags: ['stable'],
        flags: [],
        example: ['iconchanger status'],
        related: ['iconchanger list'],
      },
      {
        cmd: 'iconchanger list',
        sig: '',
        desc: 'list all aliases and cached icons in a single table',
        tags: ['stable'],
        flags: [],
        example: ['iconchanger list'],
        related: ['iconchanger status'],
      },
    ],
  },
  {
    group: 'icons',
    items: [
      {
        cmd: 'iconchanger set-icon',
        sig: '<app-path> <image-path>',
        desc: 'set a custom icon for an application bundle',
        tags: ['stable', 'core'],
        flags: [
          { f: 'app-path',   t: 'path', d: '—', x: 'path to a .app bundle (e.g. /Applications/Safari.app)' },
          { f: 'image-path', t: 'path', d: '—', x: 'image source (.png, .jpeg, .icns, .svg)' },
        ],
        example: [
          'iconchanger set-icon /Applications/Safari.app ~/icons/safari.png',
          'iconchanger set-icon /Applications/Slack.app ./slack-icon.icns',
        ],
        related: ['iconchanger remove-icon', 'iconchanger restore'],
      },
      {
        cmd: 'iconchanger remove-icon',
        sig: '<app-path>',
        desc: 'remove a custom icon and restore the bundle\'s original',
        tags: ['stable', 'core'],
        flags: [
          { f: 'app-path', t: 'path', d: '—', x: 'path to a .app bundle' },
        ],
        example: ['iconchanger remove-icon /Applications/Safari.app'],
        related: ['iconchanger set-icon'],
      },
      {
        cmd: 'iconchanger restore',
        sig: '[options]',
        desc: 'restore all cached custom icons. handy after a system update wipes them',
        tags: ['stable'],
        flags: [
          { f: '--dry-run', t: 'bool', d: 'false', x: 'preview what would be restored without making changes' },
          { f: '--verbose', t: 'bool', d: 'false', x: 'show detailed output for each icon' },
          { f: '--force',   t: 'bool', d: 'false', x: 'restore even if the icon appears unchanged' },
        ],
        example: [
          'iconchanger restore',
          'iconchanger restore --dry-run --verbose',
          'iconchanger restore --force',
        ],
        related: ['iconchanger set-icon', 'iconchanger escape-jail'],
      },
      {
        cmd: 'iconchanger escape-jail',
        sig: '[app-path] [options]',
        desc: 'escape macOS Tahoe\'s squircle jail by re-applying bundled icons as custom icons',
        tags: ['stable', 'tahoe'],
        flags: [
          { f: 'app-path',  t: 'path', d: '/Applications/*', x: 'specific .app bundle; omit to process all apps in /Applications' },
          { f: '--dry-run', t: 'bool', d: 'false',           x: 'preview what would be done without making changes' },
          { f: '--verbose', t: 'bool', d: 'false',           x: 'show detailed output' },
        ],
        example: [
          'iconchanger escape-jail',
          'iconchanger escape-jail --dry-run --verbose',
          'iconchanger escape-jail /Applications/Safari.app',
        ],
        related: ['iconchanger restore'],
      },
    ],
  },
  {
    group: 'config',
    items: [
      {
        cmd: 'iconchanger export',
        sig: '<output-path>',
        desc: 'export aliases and cached icon configuration to a json file',
        tags: ['stable'],
        flags: [
          { f: 'output-path', t: 'path', d: '—', x: 'destination .json file' },
        ],
        example: ['iconchanger export ~/Desktop/my-icons.json'],
        related: ['iconchanger import', 'iconchanger validate'],
      },
      {
        cmd: 'iconchanger import',
        sig: '<input-path>',
        desc: 'import a configuration file. only adds new items — never replaces or removes existing entries',
        tags: ['stable'],
        flags: [
          { f: 'input-path', t: 'path', d: '—', x: '.json file produced by iconchanger export' },
        ],
        example: ['iconchanger import ~/Desktop/my-icons.json'],
        related: ['iconchanger export', 'iconchanger validate'],
      },
      {
        cmd: 'iconchanger validate',
        sig: '<file-path>',
        desc: 'validate a configuration file before importing — checks structure + integrity, no changes',
        tags: ['stable'],
        flags: [
          { f: 'file-path', t: 'path', d: '—', x: '.json file to validate' },
        ],
        example: ['iconchanger validate ~/Desktop/my-icons.json'],
        related: ['iconchanger import'],
      },
    ],
  },
  {
    group: 'system',
    items: [
      {
        cmd: 'iconchanger completions',
        sig: '<shell>',
        desc: 'generate shell completion scripts',
        tags: ['stable'],
        flags: [
          { f: 'shell', t: 'zsh|bash|fish', d: '—', x: 'shell to generate completions for' },
        ],
        example: [
          'source <(iconchanger completions zsh)',
          'source <(iconchanger completions bash)',
          'iconchanger completions fish > ~/.config/fish/completions/iconchanger.fish',
        ],
      },
    ],
  },
];

export const iconchangerCommandCount = iconchangerCommandGroups.reduce(
  (n, g) => n + g.items.length,
  0,
);
