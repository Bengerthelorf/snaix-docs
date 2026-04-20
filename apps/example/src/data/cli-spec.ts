import type { CliSpec } from '@snaix/docs-theme';

export const cliSpec: CliSpec = {
  groups: [
    {
      group: 'core',
      items: [
        { cmd: 'bcmr cp',   sig: '<src>… <dst>', desc: 'copy files or directories with blake3 verification. src and dst may be local or ssh', tags: ['stable', 'core'] },
        { cmd: 'bcmr mv',   sig: '<src>… <dst>', desc: 'copy, verify, then remove source. source is only sealed after every byte is verified', tags: ['stable', 'core'] },
        { cmd: 'bcmr rm',   sig: '<path>…',      desc: 'remove files with optional trash, secure-wipe, or dry-run modes', tags: ['stable', 'core'] },
        { cmd: 'bcmr sync', sig: '<src> <dst>',  desc: 'one-way sync. only transfer what changed, based on content hashes', tags: ['stable'] },
      ],
    },
    {
      group: 'integrity',
      items: [
        { cmd: 'bcmr verify',   sig: '<path>',    desc: 'recompute blake3 for a destination and compare against the manifest', tags: ['stable'] },
        { cmd: 'bcmr hash',     sig: '<path>…',   desc: 'print blake3 hashes. accepts --json for scripting', tags: ['stable'] },
        { cmd: 'bcmr resume',   sig: '[--list]',  desc: 'list or resume unfinished transfers from the journal', tags: ['stable'] },
        { cmd: 'bcmr manifest', sig: '<path>',    desc: 'print the signed manifest for a completed transfer', tags: ['stable'] },
      ],
    },
    {
      group: 'transfer',
      items: [
        { cmd: 'bcmr serve',   sig: '--listen=<addr>', desc: 'expose a directory over direct-tcp to a peer bcmr. mtls required', tags: ['beta'] },
        { cmd: 'bcmr connect', sig: '<host>[:<port>]', desc: 'talk to a peer bcmr instead of going through ssh', tags: ['beta'] },
        { cmd: 'bcmr keys',    sig: '<add|list|rm>',   desc: 'manage trusted peer keys and ssh host aliases', tags: ['stable'] },
      ],
    },
    {
      group: 'inspect',
      items: [
        { cmd: 'bcmr ls',     sig: '<path>',       desc: 'list a local or remote path with size, mtime and hash columns', tags: ['stable'] },
        { cmd: 'bcmr stat',   sig: '<path>',       desc: 'detailed info for a single file including reflink chain', tags: ['stable'] },
        { cmd: 'bcmr plan',   sig: '<src>… <dst>', desc: 'dry-run. print exactly what cp would do without doing it', tags: ['stable'] },
        { cmd: 'bcmr doctor', sig: '',             desc: 'probe the environment: fs capabilities, ssh agent, reflink support', tags: ['stable'] },
      ],
    },
  ],
  flagsByGroup: {
    core: [
      { f: '--dry-run',   t: 'bool',    d: 'false', x: "don't write anything, just plan" },
      { f: '--verify',    t: 'bool',    d: 'true',  x: 'recompute blake3 after transfer' },
      { f: '--compress',  t: 'lz4|zst', d: 'auto',  x: 'on-wire compression' },
      { f: '--reflink',   t: 'auto|no', d: 'auto',  x: 'clone_file / copy_file_range when available' },
      { f: '--json',      t: 'bool',    d: 'false', x: 'emit structured output' },
    ],
    integrity: [
      { f: '--recursive', t: 'bool',    d: 'true',   x: 'descend into directories' },
      { f: '--algorithm', t: 'str',     d: 'blake3', x: 'override hash algorithm' },
      { f: '--json',      t: 'bool',    d: 'false',  x: 'emit structured output' },
      { f: '--parallel',  t: 'int',     d: 'cpu',    x: 'concurrent hash workers' },
    ],
    transfer: [
      { f: '--listen',    t: 'addr',    d: '0:8733', x: 'bind address for serve' },
      { f: '--mtls',      t: 'bool',    d: 'true',   x: 'require mutual tls' },
      { f: '--allow',     t: 'str…',    d: '—',      x: 'whitelist of peer key fingerprints' },
      { f: '--dry-run',   t: 'bool',    d: 'false',  x: "don't actually transfer" },
    ],
    inspect: [
      { f: '--long',      t: 'bool',    d: 'false', x: 'show hash, reflink, and manifest columns' },
      { f: '--json',      t: 'bool',    d: 'false', x: 'emit structured output' },
      { f: '--fs',        t: 'bool',    d: 'false', x: 'probe filesystem capabilities only' },
      { f: '--verbose',   t: '-v…',     d: '0',     x: 'stacked; 3 = everything' },
    ],
  },
  examples: {
    'bcmr cp':       ['scanning source……  2,481 files · 14.2 gb', 'handshake (ssh)……  ok', 'direct-tcp fast path ……  negotiated', 'transfer ……  412 mb/s · eta 00:00:12', 'complete · all blake3 verified'],
    'bcmr mv':       ['copying  ……  ok', 'verifying ……  ok', 'source sealed. removing ……  ok', 'moved · 1,204 files · hashes match'],
    'bcmr rm':       ['resolving ……  ok', 'would remove: 37 files · 120.4 mb', 'confirm? y', 'removed · journal entry #a3f109c'],
    'bcmr sync':     ['indexing src ……  ok  (2,481 files)', 'indexing dst ……  ok  (2,410 files)', 'delta  ……  71 new · 4 changed · 0 stale', 'transfer ……  ok'],
    'bcmr verify':   ['loading manifest ……  ok', 'recomputing blake3 ……  14.2 gb', 'all 2,481 files match'],
    'bcmr hash':     ['b3: 2c1f…9a  dataset.tar', 'b3: e4b0…1f  big.iso'],
    'bcmr resume':   ['found 1 unfinished transfer', '→ ./big.iso → node-04:/iso/  (4.3 gb of 14.0 gb)', 'resuming ……  ok'],
    'bcmr manifest': ['manifest v1', 'src: ./dataset/', 'dst: node-04:/srv/', '2,481 entries · 14.2 gb', 'signed: ed25519:2c…9a'],
    'bcmr serve':    ['loading peer keys ……  ok (3 trusted)', 'listening on 0.0.0.0:8733 …  mtls', 'accepting connections'],
    'bcmr connect':  ['resolving node-04 ……  ok', 'mtls handshake ……  ok', 'direct-tcp channel open'],
    'bcmr keys':     ['added key ed25519:2c…9a for node-04', '3 keys trusted'],
    'bcmr ls':       ['dataset/       4.1 gb  2026-04-10  b3:2c1f…', 'big.iso       14.0 gb  2026-04-12  b3:e4b0…', 'photos/        2.3 gb  2026-04-14  b3:9fa8…'],
    'bcmr stat':     ['path  ./big.iso', 'size  14,024,181,248 b', 'mtime 2026-04-12 14:22:01', 'b3    e4b01faa…', 'reflink parent: none'],
    'bcmr plan':     ['would copy 2,481 files (14.2 gb)', 'reflink: 412 files · 8.1 gb  (fast)', 'full:     2,069 files · 6.1 gb', 'estimated: 34s over ssh'],
    'bcmr doctor':   ['fs apfs       reflink: yes', 'fs ext4       reflink: no', 'ssh agent     ok  (3 keys)', 'direct-tcp    ok  (port 8733 free)'],
  },
};
