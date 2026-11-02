export type ProductId = 'bcmr' | 'pikpaktui' | 'iconchanger' | 'claudit';
export type Platform = 'macos' | 'linux' | 'windows' | 'freebsd';
export type Architecture = 'arm64' | 'x86_64';
export type InstallChannel = 'homebrew' | 'installer' | 'cargo' | 'download';
export interface InstallSelection { product: ProductId; platform: Platform; architecture: Architecture; channel: InstallChannel }
interface GuideStep { title: string; detail: string; command?: string; href?: string }
interface InstallationProduct { id: ProductId; title: string; requirement: string; troubleshooting: { title: string; detail: string; href: string }[] }
export type InstallPlanResult = { ok: true; requirement: string; asset?: string; steps: GuideStep[]; verification: { command: string; detail: string }; releaseUrl: string; docsHref: string } | { ok: false; error: string };
// Commands and support matrix: each product's docs.config.ts, getting-started.md,
// CLI installer, and release workflow in the content checkout. No runtime probing.
export const installationProducts: InstallationProduct[] = [
  { id: 'bcmr', title: 'bcmr', requirement: 'A supported desktop or server OS. Cargo builds need Rust 1.91+.', troubleshooting: [
    { title: 'The terminal says “command not found”', detail: 'Open a new terminal and confirm the installation folder is on PATH. The script prints its destination; a user install may use ~/.local/bin. Check bcmr --version after updating PATH.', href: '/bcmr/docs/getting-started' },
    { title: 'SSH connects, but the transfer falls back', detail: 'Run bcmr doctor host to inspect connectivity. Use bcmr deploy host to install a matching remote version. Your OpenSSH keys, host aliases and permissions still apply.', href: '/bcmr/docs/remote-copy' },
    { title: 'The backup appears in an unexpected subfolder', detail: 'A destination ending in / is a parent directory. Reuse that parent for a recursive check. Review local and remote path semantics before changing your paths.', href: '/bcmr/docs/local-remote-semantics' },
  ] },
  { id: 'pikpaktui', title: 'pikpaktui', requirement: 'A terminal and a PikPak account. Cargo builds need Rust 1.90+.', troubleshooting: [
    { title: 'Login or saved settings are unexpected', detail: 'Run pikpaktui to use the login form. Check whether PIKPAKTUI_CONFIG_DIR selects a separate config folder; configuration defaults to ~/.config/pikpaktui/.', href: '/pikpaktui/docs/configuration' },
    { title: 'Icons or image previews look wrong', detail: 'Use a Nerd Font before enabling nerd_font. Image rendering depends on your terminal; review image_protocols and thumbnail_mode in the configuration guide.', href: '/pikpaktui/docs/configuration' },
    { title: 'I need CLI help instead of the TUI', detail: 'Run pikpaktui --help, then the individual subcommand with --help. The full reference documents login, downloads, uploads and file operations.', href: '/pikpaktui/docs/cli/commands' },
  ] },
  { id: 'iconchanger', title: 'IconChanger', requirement: 'macOS 13.0 (Ventura) or later. Administrator access for initial setup.', troubleshooting: [
    { title: 'Setup keeps asking for permission', detail: 'Complete the app’s one-time Setup prompt, then use … → Check Setup Status. The setup guide explains the helper installation and permissions.', href: '/iconchanger/docs/setup' },
    { title: 'Online icon search has no results', detail: 'Add a macosicons.com API key in Settings → Advanced and use Test Connection. Local images work without an API key.', href: '/iconchanger/docs/api-key' },
    { title: 'The iconchanger command is missing', detail: 'Install the command-line tool from Settings → Advanced → Command Line Tool, then run iconchanger --version.', href: '/iconchanger/docs/cli' },
  ] },
  { id: 'claudit', title: 'Claudit', requirement: 'macOS 15.0 or later. Reads Claude Code usage logs from ~/.claude.', troubleshooting: [
    { title: 'The dashboard has no usage yet', detail: 'Confirm Claude Code has produced usage logs in ~/.claude. Open Claudit from Applications and select its menu bar icon to inspect usage and the dashboard.', href: '/claudit/docs/getting-started' },
    { title: 'Usage appears, but quota is missing', detail: 'Choose a quota source in Settings. Sign in through Claude Code or Claude.ai.', href: '/claudit/docs/getting-started' },
    { title: 'A remote machine is missing', detail: 'Add the host in Settings → Devices → Add Device. Test the SSH connection there before saving; check the remote-device guide for configuration.', href: '/claudit/docs/remote-devices' },
  ] },
];

const isNativeApp = (product: ProductId) => product === 'iconchanger' || product === 'claudit';
const repositories: Record<ProductId, string> = { bcmr: 'bcmr', pikpaktui: 'pikpaktui', iconchanger: 'macIconChanger', claudit: 'Claudit' };

export function productFromQuery(search: string): ProductId {
  const candidate = new URLSearchParams(search).get('tool');
  return installationProducts.find(product => product.id === candidate)?.id ?? 'bcmr';
}

export function getPlatforms(product: ProductId): Platform[] {
  return isNativeApp(product) ? ['macos'] : ['macos', 'linux', 'windows', 'freebsd'];
}

export function getArchitectures(product: ProductId, platform: Platform): Architecture[] {
  if (!getPlatforms(product).includes(platform)) return [];
  return platform === 'freebsd' ? ['x86_64'] : ['arm64', 'x86_64'];
}

export function getChannels(product: ProductId, platform: Platform): InstallChannel[] {
  if (!getPlatforms(product).includes(platform)) return [];
  if (isNativeApp(product)) return ['homebrew', 'download'];
  if (platform === 'windows') return ['download', 'cargo'];
  if (platform === 'macos') return ['homebrew', 'installer', 'cargo', 'download'];
  return ['installer', 'cargo', 'download'];
}

export function getInstallPlan(selection: InstallSelection): InstallPlanResult {
  const { product, platform, architecture, channel } = selection;
  const entry = installationProducts.find(item => item.id === product);
  if (!entry || !getArchitectures(product, platform).includes(architecture) || !getChannels(product, platform).includes(channel)) {
    return { ok: false, error: 'This platform, architecture and installation channel combination is not supported.' };
  }
  const releaseUrl = `https://github.com/Bengerthelorf/${repositories[product]}/releases/latest`;
  const app = isNativeApp(product);
  const assetArch = architecture === 'arm64' ? 'aarch64' : 'x86_64';
  const asset = app ? undefined : `${product}-${assetArch}-${platform}.${platform === 'windows' ? 'zip' : 'tar.gz'}`;
  const steps: GuideStep[] = [];
  if (channel === 'homebrew') {
    steps.push({ title: 'Install with Homebrew', detail: app ? 'Installs the universal macOS app for Apple Silicon and Intel. Homebrew must already be installed.' : 'Installs the native binary for your Mac. Homebrew must already be installed.', command: `brew install Bengerthelorf/tap/${product}` });
  } else if (channel === 'installer') {
    steps.push({ title: 'Run the release installer', detail: product === 'bcmr'
      ? 'Requires Bash, curl, tar and sha256sum or shasum. Detects this machine’s architecture, verifies SHA-256 and prints the installation directory. Ensure that directory is on PATH.'
      : 'Requires Bash, curl, tar and sha256sum or shasum. Detects this machine’s architecture and verifies SHA-256. Linux installs to /usr/bin; macOS and FreeBSD use /usr/local/bin. It requests sudo if needed.', command: `curl -fsSL https://app.snaix.homes/${product}/install.sh | bash` });
  } else if (channel === 'cargo') {
    steps.push({ title: 'Build with Cargo', detail: `${product === 'bcmr' ? 'Rust 1.91+' : 'Rust 1.90+'} and the native Rust build toolchain are required. This builds for the machine running Cargo. Ensure Cargo’s bin directory is on PATH.`, command: `cargo install ${product}${product === 'bcmr' ? ' --locked' : ''}` });
  } else if (app) {
    steps.push({ title: 'Download the universal DMG', detail: `Open the latest release and download its DMG. Open the disk image and drag ${entry.title} to Applications.`, command: `open ${releaseUrl}`, href: releaseUrl });
  } else {
    steps.push({ title: `Download ${asset}`, detail: 'Choose this asset from the latest release together with sha256sums.txt. Verify the archive’s SHA-256 against that manifest before extracting it.', href: releaseUrl });
    steps.push({ title: 'Place the binary on PATH', detail: platform === 'windows' ? `Extract the ZIP, keep ${product}.exe in a folder you own, add that folder to your user PATH and open a new PowerShell terminal.` : `Extract the archive, make ${product} executable, and put it in a directory on your PATH. Use a new terminal for the version check.` });
  }
  if (app) {
    steps.push({ title: `Open ${entry.title}`, detail: product === 'iconchanger' ? 'Complete the one-time Setup prompt using an administrator account, then choose an application and a local image.' : 'Select the menu bar icon to open usage, quota and the dashboard. Claude Code logs provide the usage data.', command: `open -a ${entry.title}` });
  } else {
    steps.push({ title: 'Take the first step', detail: product === 'bcmr' ? 'Open the command builder to prepare a verified copy or a dry-run preview.' : 'Run pikpaktui with no arguments to open the TUI and sign in to PikPak.', ...(product === 'bcmr' ? { href: '/workbench/commands' } : { command: 'pikpaktui' }) });
  }
  return { ok: true, requirement: entry.requirement, asset, steps, releaseUrl, docsHref: `/${product}/docs/getting-started`, verification: {
    command: app ? `defaults read '/Applications/${entry.title}.app/Contents/Info' CFBundleShortVersionString` : `${product} --version`,
    detail: app ? 'Reads the version installed in /Applications. Adjust the path if you installed the app elsewhere; compare it with the published release.' : 'Compare the installed version with the latest release.',
  } };
}
