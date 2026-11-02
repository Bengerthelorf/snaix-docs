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
    const response = await handleRequest(request, env, ctx);
    return request.method === 'HEAD' ? new Response(null, response) : response;
  },
};

async function handleRequest(request, env, ctx) {
  const url = new URL(request.url);
  const m = url.pathname.match(/^\/([^/]+)(\/.*)?$/);
  const project = m && Object.hasOwn(PROJECTS, m[1]) ? PROJECTS[m[1]] : null;
  if (!project) return new Response('not found', { status: 404 });
  const subPath = m[2] || '/';
  const isInstaller = subPath === '/install.sh';
  if (!isInstaller && !subPath.startsWith('/releases/')) {
    return new Response('not found', { status: 404 });
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  }

  const country = request.headers.get('CF-IPCountry') || 'unknown';
  env.ANALYTICS?.writeDataPoint({ blobs: [m[1], isInstaller ? 'install' : 'release', country, subPath], indexes: [m[1]] });
  const cache = caches.default;
  // Cache API only stores GET keys. HEAD can reuse an existing GET response.
  const cacheKey = request.method === 'HEAD' ? new Request(request.url, { headers: request.headers }) : request;
  try {
    const cached = await cache.match(cacheKey);
    if (cached) return cached;
  } catch {
    console.warn('Worker cache lookup failed');
  }

  try {
    if (isInstaller) {
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
      // HEAD still fetches this small script as GET so its transformed cache is complete.
      ctx.waitUntil(storeResponse(cache, cacheKey, resp.clone()));
      return resp;
    }

    const upstream = await fetch(`https://github.com/${project.repo}${subPath}${url.search}`, {
      method: request.method,
      headers: { 'User-Agent': 'app-proxy' },
    });
    if (!upstream.ok) return new Response('release not found', { status: upstream.status });
    const resp = new Response(upstream.body, upstream);
    resp.headers.set('cache-control', 'public, max-age=3600');
    // A HEAD response has no asset bytes and must never populate the GET cache.
    if (request.method === 'GET') ctx.waitUntil(storeResponse(cache, cacheKey, resp.clone()));
    return resp;
  } catch {
    return new Response(isInstaller ? 'failed to fetch install script' : 'failed to fetch release', { status: 502 });
  }
}

async function storeResponse(cache, request, response) {
  try {
    await cache.put(request, response);
  } catch {
    // Oversize assets and transient cache failures must not fail a valid download.
    console.warn('Worker cache write failed');
  }
}
