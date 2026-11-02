export interface CommandOptions {
  operation: 'copy' | 'check';
  source: string;
  destination: string;
  recursive: boolean;
  preserve: boolean;
  verify: boolean;
  resume: boolean;
  strict: boolean;
  dryRun: boolean;
  noHash: boolean;
}

export const commandPresets = {
  backup: { label: 'Local backup', detail: 'Copy a folder, keep attributes, verify the destination.', options: { operation: 'copy', source: './photos/', destination: './backup/', recursive: true, preserve: true, verify: true, resume: false, strict: false, dryRun: false, noHash: false } },
  ssh: { label: 'SSH transfer', detail: 'Upload a folder using your existing SSH configuration.', options: { operation: 'copy', source: './dataset/', destination: 'user@host:/backup/', recursive: true, preserve: false, verify: true, resume: false, strict: false, dryRun: false, noHash: false } },
  resume: { label: 'Resume a file', detail: 'Check the partial content and continue an interrupted copy.', options: { operation: 'copy', source: './archive.tar', destination: './backup/archive.tar', recursive: false, preserve: false, verify: true, resume: true, strict: true, dryRun: false, noHash: false } },
  check: { label: 'Compare copies', detail: 'Compare a source with its backup without changing either.', options: { operation: 'check', source: './photos/', destination: './backup/', recursive: true, preserve: false, verify: false, resume: false, strict: false, dryRun: false, noHash: false } },
  preview: { label: 'Dry-run preview', detail: 'Preview the destination layout before making changes.', options: { operation: 'copy', source: './photos/', destination: './backup/', recursive: true, preserve: false, verify: false, resume: false, strict: false, dryRun: true, noHash: false } },
} satisfies Record<string, { label: string; detail: string; options: CommandOptions }>;

export type PresetId = keyof typeof commandPresets;
export type CommandResult = { ok: true; command: string; notes: string[] } | { ok: false; errors: Partial<Record<'source' | 'destination' | 'operation', string>> };

/** One literal shell argument. Never interpolate user input into shell syntax. */
export function quotePosixArgument(value: string): string {
  return `'${value.replaceAll("'", `'"'"'`)}'`;
}

function quotePath(value: string): string {
  if (value === '~') return '"$HOME"';
  if (value.startsWith('~/')) return `"$HOME"/${quotePosixArgument(value.slice(2))}`;
  return quotePosixArgument(value);
}

function isRemotePath(value: string): boolean {
  if (/^(?:\/|\.\/|\.\.\/|~|[A-Za-z]:)/.test(value)) return false;
  return /^scp:\/\//i.test(value) || /^(?:[^@/:\s]+@)?(?:\[[^\]]+\]|[^/:\s]+):/.test(value);
}

export function buildCommand(options: CommandOptions): CommandResult {
  const errors: Partial<Record<'source' | 'destination' | 'operation', string>> = {};
  for (const key of ['source', 'destination'] as const) {
    if (!options[key].trim()) errors[key] = `Enter a ${key} path.`;
    else if (/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/.test(options[key])) {
      errors[key] = 'Use a single line without control characters.';
    } else if (options[key].startsWith('~') && options[key] !== '~' && !options[key].startsWith('~/')) {
      errors[key] = 'Use ~/ for your home directory or enter an absolute path.';
    }
  }
  if (options.operation !== 'copy' && options.operation !== 'check') errors.operation = 'Choose copy or check.';
  if (options.operation === 'check' && isRemotePath(options.source) && isRemotePath(options.destination)) {
    errors.destination = 'Check supports one remote endpoint. Compare a remote path with a local copy.';
  }
  if (Object.keys(errors).length) return { ok: false, errors };

  const flags: string[] = [];
  const notes: string[] = [];
  if (options.recursive) flags.push('--recursive');
  if (options.operation === 'copy') {
    if (options.preserve) flags.push('--preserve');
    if (options.verify) flags.push('--verify');
    if (options.resume) flags.push('--resume');
    if (options.strict) flags.push('--strict');
    if (options.dryRun) flags.push('--dry-run');
    if (options.verify) notes.push('BLAKE3 readback verification checks copied content at the destination.');
    if (options.resume || options.strict) notes.push('Keep the original source and destination. Strict resume checks the existing partial content before continuing.');
    if (options.dryRun) notes.push('Dry-run previews the copy layout without writing files.');
  } else {
    if (options.noHash) flags.push('--no-hash');
    notes.push(options.noHash
      ? 'This comparison skips content hashing and uses size and modification time.'
      : 'Recursive check trusts files with matching size and modification time; it hashes size-matched files when their times differ. Individual file-to-file comparisons hash content.');
    notes.push('For directories, use the same destination parent as the copy. An existing backup/ directory is a parent, so photos/ is compared with backup/photos/.');
  }
  if (options.source.includes('*')) notes.push('bcmr itself expands * in source paths, even when quoted. An exact existing path stays literal.');
  if (isRemotePath(options.source) || isRemotePath(options.destination)) {
    notes.push('SSH uses your existing keys and ~/.ssh/config. Install a matching bcmr on the remote host for the serve protocol.');
  }
  if (options.operation === 'copy' && options.recursive) notes.push('A destination ending in / is a parent directory. For example, photos/ → backup/ creates backup/photos/.');
  return {
    ok: true,
    command: ['bcmr', options.operation, ...flags, '--', quotePath(options.source), quotePath(options.destination)].join(' '),
    notes,
  };
}
