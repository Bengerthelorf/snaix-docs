// Minimal app worker: install.sh + releases proxy for bcmr & pikpaktui,
// plus a 30-min cron that pings the snaix.homes deploy hook.
const PROJECTS = {
  bcmr:      { repo: 'Bengerthelorf/bcmr',      scriptFile: 'install.sh' },
  pikpaktui: { repo: 'Bengerthelorf/pikpaktui', scriptFile: 'install.sh' },
};

export default {
  async scheduled(event, env, ctx) {
    if (!env.DEPLOY_HOOK) return;
    ctx.waitUntil(fetch(env.DEPLOY_HOOK, { method: 'POST' }));
  },

  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const m = url.pathname.match(/^\/([^/]+)(\/.*)?$/);
    const project = m ? PROJECTS[m[1]] : null;
    if (!project) return new Response('not found', { status: 404 });
    const subPath = m[2] || '/';

    const country = request.headers.get('CF-IPCountry') || 'unknown';

    if (subPath === '/install.sh') {
      env.ANALYTICS?.writeDataPoint({ blobs: [m[1], 'install', country, subPath], indexes: [m[1]] });
      const cache = caches.default;
      const cached = await cache.match(request);
      if (cached) return cached;
      const upstream = await fetch(`https://raw.githubusercontent.com/${project.repo}/main/${project.scriptFile}`);
      if (!upstream.ok) return new Response('failed to fetch install script', { status: 502 });
      let body = await upstream.text();
      body = body.replace(
        /DOWNLOAD_URL=".*"/,
        `DOWNLOAD_URL="${url.origin}/${m[1]}/releases/latest/download/\${ASSET_NAME}"`,
      );
      const resp = new Response(body, {
        headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=300' },
      });
      ctx.waitUntil(cache.put(request, resp.clone()));
      return resp;
    }

    if (subPath.startsWith('/releases/')) {
      env.ANALYTICS?.writeDataPoint({ blobs: [m[1], 'release', country, subPath], indexes: [m[1]] });
      const cache = caches.default;
      const cached = await cache.match(request);
      if (cached) return cached;
      const upstream = await fetch(`https://github.com/${project.repo}${subPath}`, {
        headers: { 'User-Agent': 'app-proxy' },
      });
      if (!upstream.ok) return new Response('release not found', { status: upstream.status });
      const resp = new Response(upstream.body, { status: upstream.status, headers: upstream.headers });
      resp.headers.set('cache-control', 'public, max-age=3600');
      ctx.waitUntil(cache.put(request, resp.clone()));
      return resp;
    }

    return new Response('not found', { status: 404 });
  },
};
