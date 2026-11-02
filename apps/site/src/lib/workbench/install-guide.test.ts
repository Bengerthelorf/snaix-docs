import { expect, test } from 'bun:test';
import { getArchitectures, getChannels, getInstallPlan, getPlatforms, installationProducts, productFromQuery } from './install-guide.ts';

test('native macOS apps offer no Windows or Linux installation', () => {
  for (const product of ['iconchanger', 'claudit'] as const) {
    expect(getPlatforms(product)).toEqual(['macos']);
    expect(getInstallPlan({ product, platform: 'linux', architecture: 'x86_64', channel: 'homebrew' }).ok).toBe(false);
    expect(getChannels(product, 'macos')).toEqual(['homebrew', 'download']);
  }
});

test('FreeBSD only offers the x86_64 assets supported by upstream installers', () => {
  for (const product of ['bcmr', 'pikpaktui'] as const) {
    expect(getArchitectures(product, 'freebsd')).toEqual(['x86_64']);
    expect(getInstallPlan({ product, platform: 'freebsd', architecture: 'arm64', channel: 'installer' }).ok).toBe(false);
  }
});

test('Windows channels never suggest a Bash installer or Homebrew', () => {
  for (const product of ['bcmr', 'pikpaktui'] as const) {
    expect(getChannels(product, 'windows')).toEqual(['download', 'cargo']);
    const plan = getInstallPlan({ product, platform: 'windows', architecture: 'arm64', channel: 'download' });
    expect(plan.ok).toBe(true);
    if (plan.ok) {
      expect(plan.asset).toBe(`${product}-aarch64-windows.zip`);
      expect(plan.verification.command).toBe(`${product} --version`);
    }
  }
});

test('each offered combination resolves and every product has linked troubleshooting', () => {
  expect(installationProducts.map(product => product.id)).toEqual(['bcmr', 'pikpaktui', 'iconchanger', 'claudit']);
  for (const product of installationProducts) {
    expect(product.troubleshooting.length).toBeGreaterThan(1);
    for (const item of product.troubleshooting) {
      expect(item.href.startsWith(`/${product.id}/docs/`)).toBe(true);
      expect(item.href.endsWith('/index')).toBe(false);
    }
    for (const platform of getPlatforms(product.id)) {
      for (const architecture of getArchitectures(product.id, platform)) {
        for (const channel of getChannels(product.id, platform)) {
          const plan = getInstallPlan({ product: product.id, platform, architecture, channel });
          expect(plan.ok).toBe(true);
          if (plan.ok) expect(plan.steps.length).toBeGreaterThan(0);
        }
      }
    }
  }
});

test('GUI version checks read app bundle metadata rather than inventing a CLI', () => {
  const plan = getInstallPlan({ product: 'claudit', platform: 'macos', architecture: 'arm64', channel: 'homebrew' });
  expect(plan.ok).toBe(true);
  if (plan.ok) {
    expect(plan.requirement).toContain('macOS 15');
    expect(plan.verification.command).toBe("defaults read '/Applications/Claudit.app/Contents/Info' CFBundleShortVersionString");
  }
});

test('supported installer and Cargo commands retain upstream options', () => {
  const cargo = getInstallPlan({ product: 'bcmr', platform: 'linux', architecture: 'x86_64', channel: 'cargo' });
  expect(cargo.ok && cargo.steps[0].command).toBe('cargo install bcmr --locked');
  const linux = getInstallPlan({ product: 'pikpaktui', platform: 'linux', architecture: 'arm64', channel: 'installer' });
  expect(linux.ok && linux.steps[0].command).toBe('curl -fsSL https://app.snaix.homes/pikpaktui/install.sh | bash');
  expect(linux.ok && linux.steps[0].detail).toContain('sudo');
});

test('product query links select only a known product and fall back for invalid values', () => {
  expect(productFromQuery('?tool=claudit')).toBe('claudit');
  expect(productFromQuery('?tool=iconchanger&from=status')).toBe('iconchanger');
  expect(productFromQuery('?tool=unknown')).toBe('bcmr');
  expect(productFromQuery('')).toBe('bcmr');
});
