#!/usr/bin/env node
/** Generate a dependency-free Playwright MCP function for all built HTML routes. */
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, resolve, relative } from 'node:path';
import responsiveAudit from './responsive-audit.mjs';

const args = new Map(process.argv.slice(2).map(arg => {
  const i = arg.indexOf('=');
  return [i < 0 ? arg : arg.slice(0, i), i < 0 ? true : arg.slice(i + 1)];
}));
const dist = resolve(String(args.get('--dist') || 'apps/site/dist'));
const output = resolve(String(args.get('--output') || '.playwright-mcp/responsive-audit.js'));
const profiles = [
  { name: 'compact-280', width: 280, height: 653 },
  { name: 'phone-320', width: 320, height: 568 },
  { name: 'phone-360', width: 360, height: 780 },
  { name: 'phone-430', width: 430, height: 932 },
  // CSS viewport examples published in WebKit Features for Safari 27.1.
  // These are browser emulations, not claims of testing physical iPhone Duo.
  { name: 'duo-outer-portrait', width: 382, height: 580 },
  { name: 'duo-outer-landscape', width: 594, height: 368 },
  { name: 'duo-inner-portrait', width: 669, height: 867 },
  { name: 'duo-inner-landscape', width: 951, height: 585 },
  { name: 'duo-dual-window', width: 385, height: 571 },
  { name: 'tablet-portrait', width: 768, height: 1024 },
  { name: 'tablet-landscape', width: 1024, height: 768 },
  { name: 'laptop', width: 1280, height: 720 },
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'ultrawide', width: 2560, height: 1440 },
];
const selected = args.has('--profiles') ? String(args.get('--profiles')).split(',') : profiles.map(p => p.name);
for (const name of selected) if (!profiles.some(p => p.name === name)) throw new Error(`Unknown profile: ${name}`);
const files = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (entry.isFile() && path.endsWith('.html')) files.push(path);
  }
}
await walk(dist);
if (!files.length) throw new Error(`No built HTML under ${dist}`);
const routes = files.map(file => {
  const path = relative(dist, file).replaceAll('\\', '/');
  return '/' + (path.endsWith('index.html') ? path.slice(0, -10) : path);
}).sort();
const redirects = {};
for (const file of files) {
  const html = await readFile(file, 'utf8');
  const refresh = html.match(/<meta[^>]*http-equiv=["']refresh["'][^>]*content=["']([^"']*)["']/i);
  const target = refresh?.[1]?.match(/(?:^|;)\s*url=(.+)$/i)?.[1]?.trim();
  if (target) {
    const path = relative(dist, file).replaceAll('\\', '/');
    redirects['/' + (path.endsWith('index.html') ? path.slice(0, -10) : path)] = target;
  }
}
const options = {
  redirects,
  origin: String(args.get('--origin') || 'http://127.0.0.1:4321'),
  routes,
  profiles: profiles.filter(p => selected.includes(p.name)),
  concurrency: Math.max(1, Math.min(8, Number(args.get('--concurrency') || 6))),
  settleMs: 60,
};
await mkdir(dirname(output), { recursive:true });
await writeFile(output, `async (page) => {\n${responsiveAudit.toString()}\nreturn await responsiveAudit(page, ${JSON.stringify(options)});\n}\n`);
console.log(JSON.stringify({ output, routeCount: routes.length, profiles: options.profiles, samples: routes.length * options.profiles.length }, null, 2));
