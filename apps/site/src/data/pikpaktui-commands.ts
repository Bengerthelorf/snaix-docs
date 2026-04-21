import type { CliGroup } from '@snaix/docs-theme';

export const pikpaktuiCommandGroups: CliGroup[] = [
  {
    group: 'file',
    items: [
      {
        cmd: 'pikpaktui ls',
        sig: '[options] [path]',
        desc: 'list files and folders in your PikPak drive',
        tags: ['stable', 'core'],
        flags: [
          { f: '-l, --long',          t: 'bool',                       d: 'false', x: 'long format — id, size, date, name' },
          { f: '-J, --json',          t: 'bool',                       d: 'false', x: 'output as a json array' },
          { f: '-s, --sort <field>',  t: 'name|size|created|type|extension|none', d: 'name', x: 'sort field' },
          { f: '-r, --reverse',       t: 'bool',                       d: 'false', x: 'reverse sort order' },
          { f: '--tree',              t: 'bool',                       d: 'false', x: 'recursive tree view' },
          { f: '--depth=N',           t: 'int',                        d: '—',     x: 'limit tree depth (with --tree)' },
        ],
        example: [
          'pikpaktui ls "/My Pack"',
          'pikpaktui ls --sort=size -r /',
          'pikpaktui ls --tree --depth=2 "/My Pack"',
          'pikpaktui ls /Movies --json | jq \'.[] | select(.size > 1073741824)\'',
        ],
        related: ['pikpaktui info', 'pikpaktui starred'],
      },
      {
        cmd: 'pikpaktui mv',
        sig: '[options] <src> <dst> | -t <dst> <src...>',
        desc: 'move files or folders to a destination folder',
        tags: ['stable', 'core'],
        flags: [
          { f: '-t <dst>',         t: 'path', d: '—',     x: 'batch mode — move multiple sources into <dst>' },
          { f: '-n, --dry-run',    t: 'bool', d: 'false', x: 'preview without executing' },
        ],
        example: [
          'pikpaktui mv "/My Pack/file.txt" /Archive',
          'pikpaktui mv -t /Archive /a.txt /b.txt /c.txt',
          'pikpaktui mv -n "/My Pack/a.txt" /Archive',
        ],
        related: ['pikpaktui cp', 'pikpaktui rename'],
      },
      {
        cmd: 'pikpaktui cp',
        sig: '[options] <src> <dst> | -t <dst> <src...>',
        desc: 'copy files or folders to a destination folder',
        tags: ['stable', 'core'],
        flags: [
          { f: '-t <dst>',         t: 'path', d: '—',     x: 'batch mode — copy multiple sources into <dst>' },
          { f: '-n, --dry-run',    t: 'bool', d: 'false', x: 'preview without executing' },
        ],
        example: [
          'pikpaktui cp "/My Pack/file.txt" /Backup',
          'pikpaktui cp -t /Backup /a.txt /b.txt',
          'pikpaktui cp -n -t /Backup /a.txt /b.txt',
        ],
        related: ['pikpaktui mv'],
      },
      {
        cmd: 'pikpaktui rename',
        sig: '[options] <path> <new_name>',
        desc: 'rename a file or folder in place',
        tags: ['stable', 'core'],
        flags: [
          { f: '-n, --dry-run', t: 'bool', d: 'false', x: 'preview without executing' },
        ],
        example: [
          'pikpaktui rename "/My Pack/old.txt" new.txt',
          'pikpaktui rename -n "/My Pack/old.txt" new.txt',
        ],
        related: ['pikpaktui mv'],
      },
      {
        cmd: 'pikpaktui rm',
        sig: '[options] <path...>',
        desc: 'remove files or folders. defaults to trash; -f deletes permanently',
        tags: ['stable', 'core'],
        flags: [
          { f: '-r, --recursive', t: 'bool', d: 'false', x: 'required to remove folders' },
          { f: '-f, --force',     t: 'bool', d: 'false', x: 'permanently delete (bypass trash)' },
          { f: '-rf, -fr',        t: 'bool', d: 'false', x: 'remove folder permanently' },
          { f: '-n, --dry-run',   t: 'bool', d: 'false', x: 'preview without executing' },
        ],
        example: [
          'pikpaktui rm "/My Pack/file.txt"',
          'pikpaktui rm /a.txt /b.txt /c.txt',
          'pikpaktui rm -r "/My Pack/folder"',
          'pikpaktui rm -rf "/My Pack/old-folder"',
          'pikpaktui rm -n -rf "/My Pack/folder"',
        ],
        related: ['pikpaktui trash', 'pikpaktui untrash'],
      },
      {
        cmd: 'pikpaktui mkdir',
        sig: '[options] <parent> <name> | -p <full_path>',
        desc: 'create a new folder or a nested folder path',
        tags: ['stable', 'core'],
        flags: [
          { f: '-p',            t: 'bool', d: 'false', x: 'create all intermediate directories in <full_path>' },
          { f: '-n, --dry-run', t: 'bool', d: 'false', x: 'preview without executing' },
        ],
        example: [
          'pikpaktui mkdir "/My Pack" NewFolder',
          'pikpaktui mkdir -p "/My Pack/a/b/c"',
          'pikpaktui mkdir -n -p "/My Pack/a/b/c"',
        ],
      },
      {
        cmd: 'pikpaktui info',
        sig: '[options] <path>',
        desc: 'show metadata for a file or folder, including media tracks for video',
        tags: ['stable'],
        flags: [
          { f: '-J, --json', t: 'bool', d: 'false', x: 'json output (includes hash, links, tracks)' },
        ],
        example: [
          'pikpaktui info "/My Pack/video.mp4"',
          'pikpaktui info "/My Pack/video.mp4" --json',
        ],
        related: ['pikpaktui link'],
      },
      {
        cmd: 'pikpaktui link',
        sig: '[options] <path>',
        desc: 'print the direct download url for a file',
        tags: ['stable'],
        flags: [
          { f: '-m, --media', t: 'bool', d: 'false', x: 'also show transcoded video stream urls' },
          { f: '-c, --copy',  t: 'bool', d: 'false', x: 'copy the url to clipboard' },
          { f: '-J, --json',  t: 'bool', d: 'false', x: 'json output: {name, url, size}' },
        ],
        example: [
          'pikpaktui link "/My Pack/file.zip"',
          'pikpaktui link "/My Pack/file.zip" --copy',
          'pikpaktui link -m "/My Pack/video.mp4"',
          'pikpaktui link -mc "/My Pack/video.mp4"',
        ],
        related: ['pikpaktui play', 'pikpaktui download'],
      },
      {
        cmd: 'pikpaktui cat',
        sig: '<path>',
        desc: 'print the text content of a file to stdout',
        tags: ['stable'],
        flags: [],
        example: ['pikpaktui cat "/My Pack/notes.txt"'],
      },
    ],
  },
  {
    group: 'transfer',
    items: [
      {
        cmd: 'pikpaktui play',
        sig: '<path> [quality]',
        desc: 'stream a video file using an external player (mpv / vlc / iina)',
        tags: ['stable'],
        flags: [
          { f: 'quality', t: '720|1080|original|N', d: 'list', x: 'stream quality or stream index number' },
        ],
        example: [
          'pikpaktui play "/My Pack/video.mp4"',
          'pikpaktui play "/My Pack/video.mp4" 1080',
          'pikpaktui play "/My Pack/video.mp4" original',
        ],
        related: ['pikpaktui link'],
      },
      {
        cmd: 'pikpaktui download',
        sig: '[options] <path> | -t <local_dir> <path...>',
        desc: 'download files or folders recursively to local storage',
        tags: ['stable', 'core'],
        flags: [
          { f: '-o, --output <file>', t: 'path', d: '—',     x: 'custom output filename (single file only)' },
          { f: '-t <local_dir>',      t: 'path', d: '—',     x: 'batch mode — download multiple items into <local_dir>' },
          { f: '-j, --jobs <n>',      t: 'int',  d: '1',     x: 'concurrent download threads' },
          { f: '-n, --dry-run',       t: 'bool', d: 'false', x: 'preview without downloading' },
        ],
        example: [
          'pikpaktui download "/My Pack/file.txt"',
          'pikpaktui download -o output.mp4 "/My Pack/video.mp4"',
          'pikpaktui download -j4 -t ./videos/ /a.mp4 /b.mp4',
          'pikpaktui download -n "/My Pack/folder"',
        ],
        related: ['pikpaktui upload', 'pikpaktui offline'],
      },
      {
        cmd: 'pikpaktui upload',
        sig: '[options] <local_path> [remote_path] | -t <remote_dir> <local...>',
        desc: 'upload local files. dedup is instant if the file already exists server-side',
        tags: ['stable', 'core'],
        flags: [
          { f: '-t <remote_dir>', t: 'path', d: '—',     x: 'batch mode — upload multiple files into <remote_dir>' },
          { f: '-n, --dry-run',   t: 'bool', d: 'false', x: 'preview without uploading' },
        ],
        example: [
          'pikpaktui upload ./file.txt',
          'pikpaktui upload ./file.txt "/My Pack"',
          'pikpaktui upload -t "/My Pack" ./a.txt ./b.txt',
          'pikpaktui upload -n ./file.txt "/My Pack"',
        ],
        related: ['pikpaktui download'],
      },
    ],
  },
  {
    group: 'share',
    items: [
      {
        cmd: 'pikpaktui share',
        sig: '[options] <path...> | -l | -S <url> | -D <id...>',
        desc: 'create, list, save, and delete share links',
        tags: ['stable'],
        flags: [
          { f: '-p, --password',   t: 'bool', d: 'false', x: 'auto-generate a password for the share' },
          { f: '-d, --days <n>',   t: 'int',  d: '-1',    x: 'expiry in days; -1 = permanent' },
          { f: '-o <file>',        t: 'path', d: '—',     x: 'write share url to a file' },
          { f: '-J, --json',       t: 'bool', d: 'false', x: 'json output: {share_id, share_url, pass_code}' },
          { f: '-l',               t: 'bool', d: 'false', x: 'list your shares' },
          { f: '-S <url>',         t: 'url',  d: '—',     x: 'save a share to your drive' },
          { f: '-D <id...>',       t: 'id',   d: '—',     x: 'delete share(s) by id' },
          { f: '-p <code>',        t: 'string', d: '—',   x: 'pass code (with -S)' },
          { f: '-t <path>',        t: 'path', d: '/',     x: 'destination folder (with -S)' },
          { f: '-n, --dry-run',    t: 'bool', d: 'false', x: 'preview (with -S)' },
        ],
        example: [
          'pikpaktui share -p -d 7 "/My Pack/file.txt"',
          'pikpaktui share -l',
          'pikpaktui share -D abc123 def456',
          'pikpaktui share -S -p PO -t "/My Pack" "https://mypikpak.com/s/XXXX"',
        ],
      },
    ],
  },
  {
    group: 'tasks',
    items: [
      {
        cmd: 'pikpaktui offline',
        sig: '[options] <url>',
        desc: 'submit a url or magnet link for server-side cloud downloading',
        tags: ['stable'],
        flags: [
          { f: '--to, -t <path>',   t: 'path',   d: '/',  x: 'destination folder in PikPak' },
          { f: '--name, -n <name>', t: 'string', d: '—',  x: 'override the task / file name' },
          { f: '--dry-run',         t: 'bool',   d: 'false', x: 'preview without creating the task' },
        ],
        example: [
          'pikpaktui offline "magnet:?xt=urn:btih:abc123..."',
          'pikpaktui offline --to "/Downloads" "https://example.com/file.zip"',
          'pikpaktui offline --to "/Downloads" --name myvideo.mp4 "https://..."',
        ],
        related: ['pikpaktui tasks'],
      },
      {
        cmd: 'pikpaktui tasks',
        sig: '[list|retry|delete] [options] [limit]',
        desc: 'manage offline download tasks',
        tags: ['stable'],
        flags: [
          { f: 'list, ls',        t: 'subcmd', d: 'list', x: 'list tasks (default if no subcommand)' },
          { f: 'retry <id>',      t: 'subcmd', d: '—',    x: 'retry a failed task' },
          { f: 'delete <id...>',  t: 'subcmd', d: '—',    x: 'delete task(s)  (alias: rm)' },
          { f: '-J, --json',      t: 'bool',   d: 'false', x: 'json output for list' },
          { f: '-n, --dry-run',   t: 'bool',   d: 'false', x: 'preview for delete' },
          { f: '<number>',        t: 'int',    d: '50',   x: 'limit number of results' },
        ],
        example: [
          'pikpaktui tasks',
          'pikpaktui tasks list 10 --json',
          'pikpaktui tasks retry abc12345',
          'pikpaktui tasks rm abc12345 def67890',
        ],
        related: ['pikpaktui offline'],
      },
    ],
  },
  {
    group: 'org',
    items: [
      {
        cmd: 'pikpaktui trash',
        sig: '[options] [limit]',
        desc: 'list files currently in the trash',
        tags: ['stable'],
        flags: [
          { f: '-l, --long', t: 'bool', d: 'false', x: 'long format — id, size, date' },
          { f: '-J, --json', t: 'bool', d: 'false', x: 'json output' },
          { f: '<number>',   t: 'int',  d: '100',   x: 'max number of results' },
        ],
        example: [
          'pikpaktui trash',
          'pikpaktui trash 50 -l',
          'pikpaktui trash --json',
        ],
        related: ['pikpaktui untrash', 'pikpaktui rm'],
      },
      {
        cmd: 'pikpaktui untrash',
        sig: '[options] <name...>',
        desc: 'restore one or more files from trash by exact filename',
        tags: ['stable'],
        flags: [
          { f: '-n, --dry-run', t: 'bool', d: 'false', x: 'preview without restoring' },
        ],
        example: [
          'pikpaktui untrash "file.txt"',
          'pikpaktui untrash "a.txt" "b.mp4"',
          'pikpaktui untrash -n "file.txt"',
        ],
        related: ['pikpaktui trash'],
      },
      {
        cmd: 'pikpaktui star',
        sig: '<path...>',
        desc: 'star (bookmark) one or more files',
        tags: ['stable'],
        flags: [],
        example: [
          'pikpaktui star "/My Pack/video.mp4"',
          'pikpaktui star "/My Pack/a.txt" "/My Pack/b.txt"',
        ],
        related: ['pikpaktui unstar', 'pikpaktui starred'],
      },
      {
        cmd: 'pikpaktui unstar',
        sig: '<path...>',
        desc: 'remove the star from one or more files',
        tags: ['stable'],
        flags: [],
        example: ['pikpaktui unstar "/My Pack/video.mp4"'],
        related: ['pikpaktui star'],
      },
      {
        cmd: 'pikpaktui starred',
        sig: '[options] [limit]',
        desc: 'list all starred files',
        tags: ['stable'],
        flags: [
          { f: '-l, --long', t: 'bool', d: 'false', x: 'long format' },
          { f: '-J, --json', t: 'bool', d: 'false', x: 'json output' },
          { f: '<number>',   t: 'int',  d: '100',   x: 'max results' },
        ],
        example: ['pikpaktui starred 50 -l', 'pikpaktui starred --json'],
        related: ['pikpaktui star'],
      },
    ],
  },
  {
    group: 'meta',
    items: [
      {
        cmd: 'pikpaktui events',
        sig: '[options] [limit]',
        desc: 'list recent file activity (uploads, downloads, deletions)',
        tags: ['stable'],
        flags: [
          { f: '-J, --json', t: 'bool', d: 'false', x: 'json output' },
          { f: '<number>',   t: 'int',  d: '20',    x: 'max results' },
        ],
        example: ['pikpaktui events', 'pikpaktui events 50 --json'],
      },
      {
        cmd: 'pikpaktui login',
        sig: '[options]',
        desc: 'log in to PikPak. credentials saved to ~/.config/pikpaktui/login.yaml',
        tags: ['stable'],
        flags: [
          { f: '-u, --user <email>',     t: 'string', d: '—', x: 'PikPak account email (env: PIKPAK_USER)' },
          { f: '-p, --password <pass>',  t: 'string', d: '—', x: 'PikPak account password (env: PIKPAK_PASS)' },
        ],
        example: [
          'pikpaktui login',
          'pikpaktui login -u user@example.com -p mypassword',
          'PIKPAK_USER=user@example.com PIKPAK_PASS=pass pikpaktui login',
        ],
      },
      {
        cmd: 'pikpaktui quota',
        sig: '[options]',
        desc: 'show your storage quota and bandwidth usage',
        tags: ['stable'],
        flags: [{ f: '-J, --json', t: 'bool', d: 'false', x: 'json output' }],
        example: ['pikpaktui quota', 'pikpaktui quota --json'],
      },
      {
        cmd: 'pikpaktui vip',
        sig: '',
        desc: 'show VIP membership status, invite code, and transfer quota',
        tags: ['stable'],
        flags: [],
        example: ['pikpaktui vip'],
      },
    ],
  },
  {
    group: 'system',
    items: [
      {
        cmd: 'pikpaktui update',
        sig: '',
        desc: 'check for updates and self-update the binary from github releases',
        tags: ['stable'],
        flags: [],
        example: ['pikpaktui update'],
      },
      {
        cmd: 'pikpaktui completions',
        sig: '<shell>',
        desc: 'generate shell completion scripts. zsh only.',
        tags: ['stable'],
        flags: [
          { f: 'shell', t: 'zsh', d: '—', x: 'shell to generate completions for' },
        ],
        example: [
          'pikpaktui completions zsh',
          'pikpaktui completions zsh > ~/.zfunc/_pikpaktui',
          'eval "$(pikpaktui completions zsh)"',
        ],
      },
    ],
  },
];

export const pikpaktuiCommandCount = pikpaktuiCommandGroups.reduce(
  (n, g) => n + g.items.length,
  0,
);
