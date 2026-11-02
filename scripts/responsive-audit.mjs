/**
 * Browser-side responsive audit, usable with an existing Playwright Page.
 * Generate routes from built HTML, then invoke this exported function with the
 * site origin, route list and viewport profiles. It opens isolated contexts and
 * never changes source files. Bounded chunks keep progress inspectable.
 *
 * DOM findings are review candidates: intentional cropped artwork, ticker tape
 * and local code/table scrolling are not automatically layout defects.
 */
export default async function responsiveAudit(page, options = {}) {
  const { origin = 'http://127.0.0.1:4321', routes = ['/'], profiles = [{ name: 'phone', width: 320, height: 568 }], concurrency = 6, screenshotDir, screenshots = false, settleMs = 60 } = options;
  const browser = page.context().browser();
  const queue = profiles.flatMap(profile => routes.map(route => ({ profile, route })));
  const records = [];
  const inspect = () => {
    const width = document.documentElement.clientWidth;
    const segmented = document.documentElement.hasAttribute('data-display-panel');
    const bodyRect = document.body.getBoundingClientRect();
    const readingBounds = segmented
      ? { left:bodyRect.left, top:bodyRect.top, right:bodyRect.left + document.body.clientWidth, bottom:bodyRect.top + document.body.clientHeight }
      : { left:0, top:0, right:width, bottom:innerHeight };
    const clipCandidates = [], intentionalCrops = [], localScrollers = [], controlsOutside = [];
    const visible = el => {
      if (el.checkVisibility && !el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true, contentVisibilityAuto: true })) return false;
      const r = el.getBoundingClientRect();
      for (let current = el; current; current = current.parentElement) {
        const s = getComputedStyle(current);
        if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) === 0) return false;
      }
      return r.width > 1 && r.height > 1 && !el.closest('[hidden], [aria-hidden="true"], .sr-only, .visually-hidden, .katex-mathml');
    };
    const label = el => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + [...el.classList].slice(0, 3).map(c => '.' + c).join('');
    const compact = r => ({ x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) });
    const clips = (el, rect, includeSelf = false) => {
      let candidateRect = rect;
      for (let parent = includeSelf ? el : el.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
        const s = getComputedStyle(parent), r = parent.getBoundingClientRect();
        const outsideX = candidateRect.left < r.left - 2 || candidateRect.right > r.right + 2;
        const outsideY = candidateRect.top < r.top - 2 || candidateRect.bottom > r.bottom + 2;
        if (outsideX && /auto|scroll/.test(s.overflowX)) {
          // Content may scroll locally, but its viewport must itself fit every
          // outer clipping ancestor; do not suppress those outer checks.
          candidateRect = r;
          continue;
        }
        if ((outsideX && /hidden|clip/.test(s.overflowX)) || (outsideY && /hidden|clip/.test(s.overflowY))) {
          return { container: label(parent), containerRect: compact(r), axis: outsideX ? 'x' : 'y' };
        }
      }
      return null;
    };
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const el = node.parentElement;
      if (!el || !node.textContent.trim() || !visible(el) || el.closest('script, style, svg, .p-ticker, .ticker, [data-audit-crop="intentional"]')) continue;
      const range = document.createRange(); range.selectNodeContents(node);
      for (const rect of range.getClientRects()) {
        if (rect.width < 1 || rect.height < 1) continue;
        const clip = clips(el, rect, true);
        if (clip) {
          const finding = { element: label(el), text: node.textContent.trim().slice(0, 100), rect: compact(rect), ...clip };
          if (el.id === 'nf-req-path' && getComputedStyle(el).textOverflow === 'ellipsis') intentionalCrops.push({ ...finding, reason:'404 requested-path preview intentionally ellipsizes; complete text remains in the DOM and browser address bar' });
          else clipCandidates.push(finding);
          break;
        }
      }
    }
    for (const el of document.querySelectorAll('pre, table, [class*="terminal"], [class*="code"], [class*="session"], [class*="tui"]')) {
      if (!visible(el)) continue;
      const s = getComputedStyle(el);
      if (el.scrollWidth > el.clientWidth + 2) localScrollers.push({element:label(el),overflowX:s.overflowX,clientWidth:el.clientWidth,scrollWidth:el.scrollWidth});
    }
    for (const el of document.querySelectorAll('a, button, input, select, summary, [tabindex="0"]')) {
      if (!visible(el)) continue;
      const r = el.getBoundingClientRect(), s = getComputedStyle(el), clip = clips(el, r);
      let localScroll = false;
      for (let parent = el.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
        if (/auto|scroll/.test(getComputedStyle(parent).overflowX) && parent.scrollWidth > parent.clientWidth + 2) { localScroll = true; break; }
      }
      if (((r.right > readingBounds.right + 2 || r.left < readingBounds.left - 2) && !localScroll) || (clip && s.position === 'fixed')) controlsOutside.push({element:label(el),text:(el.innerText||el.getAttribute('aria-label')||'').trim().slice(0,80),rect:compact(r),clip});
    }
    const all = [...document.querySelectorAll('body *')];
    const fixedOutside = all.filter(el => visible(el) && getComputedStyle(el).position === 'fixed').map(el => ({element:label(el),rect:compact(el.getBoundingClientRect())})).filter(x => x.rect.x < readingBounds.left - 2 || x.rect.x + x.rect.width > readingBounds.right + 2 || x.rect.y < readingBounds.top - 2 || x.rect.y + x.rect.height > readingBounds.bottom + 2);
    return { title: document.title, viewport:{width:innerWidth,height:innerHeight,clientWidth:width}, readingBounds, segmented, documentWidth:document.documentElement.scrollWidth, horizontalOverflow:segmented ? document.body.scrollWidth > document.body.clientWidth + 2 : document.documentElement.scrollWidth > width + 2, h1:[...document.querySelectorAll('h1')].map(x=>x.textContent.trim().slice(0,100)), clipCandidates:clipCandidates.slice(0,50), clipCount:clipCandidates.length, intentionalCrops, localScrollers:localScrollers.slice(0,20), controlsOutside:controlsOutside.slice(0,25), fixedOutside:fixedOutside.slice(0,10) };
  };
  await Promise.all(Array.from({length:Math.min(concurrency,queue.length)}, async () => {
    let context, p, currentContextKey, emulationSession;
    while (queue.length) {
      const {profile,route}=queue.shift();
      const touch = profile.touch ?? profile.width <= 1024;
      const contextKey = JSON.stringify([touch, profile.displayFeature, profile.safeArea]);
      if (!context || contextKey !== currentContextKey) {
        if (context) await context.close();
        context = await browser.newContext({ reducedMotion:'reduce', hasTouch:touch, ...(browser.browserType().name() === 'firefox' ? {} : { isMobile:touch }) });
        p = undefined;
        currentContextKey = contextKey;
        emulationSession = undefined;
      }
      // Isolate page lifecycle events: a cancelled dynamic import from an old
      // navigation must not be attributed to the next route.
      if (p) await p.close();
      p = await context.newPage();
      emulationSession = undefined;
      if (options.onStage) await options.onStage('page', profile.name, route);
      await p.setViewportSize({width:profile.width,height:profile.height});
      const errors=[];const onError=e=>errors.push(String(e));p.on('pageerror',onError);
      try {
        const response=await p.goto(origin+route,{waitUntil:'load',timeout:30000});
        if (options.onStage) await options.onStage('loaded', profile.name, route);
        if (options.redirects?.[route]) {
          const target = new URL(options.redirects[route], origin);
          await p.waitForURL(url => url.origin === target.origin && url.pathname.replace(/\/$/, '') === target.pathname.replace(/\/$/, ''), { timeout:10000 });
          await p.waitForLoadState('load');
        }
        if (profile.displayFeature || profile.safeArea) {
          emulationSession ||= await context.newCDPSession(p);
          if (profile.displayFeature) await emulationSession.send('Emulation.setDeviceMetricsOverride', { width:profile.width, height:profile.height, deviceScaleFactor:1, mobile:touch, displayFeature:profile.displayFeature });
          if (profile.safeArea) await emulationSession.send('Emulation.setSafeAreaInsetsOverride', { insets:profile.safeArea });
        }
        if (settleMs) await p.waitForTimeout(settleMs);
        if (profile.textScale && profile.textScale !== 1) {
          // Synthetic text-only enlargement: snapshot every computed size before
          // mutation, so inherited sizes are multiplied once rather than compounded.
          await p.evaluate(scale => {
            const sizes = [...document.querySelectorAll('body *')].filter(el => !el.closest('svg, script, style')).map(el => {
              const s = getComputedStyle(el); return [el, parseFloat(s.fontSize), parseFloat(s.lineHeight)];
            });
            for (const [el, font, line] of sizes) {
              if (Number.isFinite(font)) el.style.fontSize = `${font * scale}px`;
              if (Number.isFinite(line)) el.style.lineHeight = `${line * scale}px`;
            }
          }, profile.textScale);
        }
        // Measure lazy sections while they are rendered. Firefox can retain
        // content-box intrinsic sizes after they leave the viewport; measuring
        // their old descendants against that skipped box reports false clips.
        const lazyCount = await p.evaluate(() => {
          const lazy = [...document.querySelectorAll('body *')].filter(el => getComputedStyle(el).contentVisibility === 'auto');
          lazy.forEach((el, index) => el.setAttribute('data-audit-lazy', String(index)));
          return lazy.length;
        });
        if (options.onStage) await options.onStage(`lazy:${lazyCount}`, profile.name, route);
        const observations = [];
        for (let index = 0; index < lazyCount; index++) {
          await p.evaluate(async index => {
            document.querySelector(`[data-audit-lazy="${index}"]`)?.scrollIntoView({ block:'start', behavior:'instant' });
            // Headless/background tabs may suspend animation frames. Layout
            // reads below still flush styles after this bounded scheduling turn.
            const frame = () => new Promise(resolve => {
              const timer = setTimeout(resolve, 100);
              requestAnimationFrame(() => { clearTimeout(timer); resolve(); });
            });
            await frame();
            await frame();
          }, index);
          observations.push(await p.evaluate(inspect));
        }
        await p.evaluate(async () => {
          window.scrollTo({ top:0, left:0, behavior:'instant' });
          await new Promise(resolve => {
            const timer = setTimeout(resolve, 100);
            requestAnimationFrame(() => { clearTimeout(timer); resolve(); });
          });
        });
        const result=await p.evaluate(inspect);
        observations.push(result);
        for (const field of ['clipCandidates', 'intentionalCrops', 'localScrollers', 'controlsOutside', 'fixedOutside']) {
          result[field] = [...new Map(observations.flatMap(observation => observation[field]).map(item => [JSON.stringify([item.element, item.text, item.container, item.axis]), item])).values()];
        }
        result.clipCount = result.clipCandidates.length;
        result.horizontalOverflow = observations.some(observation => observation.horizontalOverflow);
        if (profile.displayFeature?.maskLength > 0 && !result.segmented) throw new Error('Requested segmented emulation did not activate the readable-panel path');
        const record={route,finalUrl:p.url(),profile:profile.name,status:response.status(),...result,errors};
        if (screenshots && screenshotDir && (result.horizontalOverflow || result.clipCount || result.controlsOutside.length || result.fixedOutside.length)) {
          const name=(profile.name+'-'+route.replaceAll('/','_').replaceAll('.','_')).slice(0,160)+'.png';
          await p.screenshot({path:screenshotDir+'/'+name,fullPage:true});record.screenshot=screenshotDir+'/'+name;
        }
        records.push(record);
      } catch(e) {records.push({route,profile:profile.name,error:String(e)});}
      finally {p.off('pageerror',onError); if (options.onProgress) await options.onProgress(records.length, queue.length);}
    }
    if (context) await context.close();
  }));
  const findings=records.filter(x=>x.horizontalOverflow||x.clipCount||x.controlsOutside?.length||x.fixedOutside?.length||x.errors?.length||x.error||(x.status>=400&&x.route!='/404.html'));
  return {recordedAt:new Date().toISOString(),origin,profiles,routeCount:routes.length,sampleCount:records.length,browser:browser.browserType().name(),methodology:'All supplied routes, isolated browser contexts, reduced motion, touch/mobile emulation for profiles <=1024px unless overridden, full-document DOM text ranges and clipping ancestors; local scroll containers retained separately; visually hidden KaTeX/accessibility text and animated ticker excluded; 404 requested-path ellipsis classified separately; lazy sections measured while scrolled into view; findings require visual review. No claim of physical-device testing.',summary:{overflow:records.filter(x=>x.horizontalOverflow).length,clipping:records.filter(x=>x.clipCount).length,controlsOutside:records.filter(x=>x.controlsOutside?.length).length,fixedOutside:records.filter(x=>x.fixedOutside?.length).length,errors:records.filter(x=>x.errors?.length||x.error).length},records,findings};
}
