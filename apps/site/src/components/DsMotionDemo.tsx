import { useState } from 'react';
import {
  BlockReveal,
  Typewriter,
  Scramble,
  Tally,
  CommandStream,
} from '@snaix/docs-theme';

export function DsMotionDemo() {
  const [replayNonce, setReplayNonce] = useState(0);

  return (
    <>
      <div className="ds-motion-intro">
        <p className="ds-lead">
          text is animated as a first-class subject. <b>random is cheap.</b>{' '}
          use motion to direct attention — only on headings, hero copy, and
          metric callouts. body text is always static.
        </p>
        <button className="btn-block is-ghost" onClick={() => setReplayNonce((n) => n + 1)}>
          ↻ replay
        </button>
      </div>

      <div className="ds-motion-grid" key={replayNonce}>
        <div className="ds-motion-cell">
          <div className="ds-motion-label"><code>&lt;BlockReveal/&gt;</code></div>
          <div className="ds-motion-stage" style={{ fontSize: 36, fontWeight: 700 }}>
            <BlockReveal delay={100}>blockreveal</BlockReveal>{' '}
            <BlockReveal delay={400} color="var(--red)">is for</BlockReveal>{' '}
            <BlockReveal delay={700} color="var(--blue)">titles</BlockReveal>
          </div>
          <div className="ds-motion-note">
            block-wipe across text. sweeps in from left, out to right. use for titles.
          </div>
        </div>

        <div className="ds-motion-cell">
          <div className="ds-motion-label"><code>&lt;Typewriter/&gt;</code></div>
          <div className="ds-motion-stage" style={{ fontFamily: 'var(--mono)', fontSize: 14 }}>
            <Typewriter text="$ bcmr cp ./data host:/srv/" speed={22} delay={200} />
          </div>
          <div className="ds-motion-note">character-by-character. use for code + commands.</div>
        </div>

        <div className="ds-motion-cell">
          <div className="ds-motion-label"><code>&lt;Scramble/&gt;</code></div>
          <div className="ds-motion-stage" style={{ fontFamily: 'var(--mono)', fontSize: 14 }}>
            <Scramble text="blake3:2c49aa…9a" duration={1200} />
          </div>
          <div className="ds-motion-note">characters resolve to final via noise. use for hashes, ids.</div>
        </div>

        <div className="ds-motion-cell">
          <div className="ds-motion-label"><code>&lt;Tally/&gt;</code></div>
          <div className="ds-motion-stage" style={{ fontSize: 56, fontWeight: 700, letterSpacing: '-0.02em' }}>
            <Tally to={1234} duration={1400} />
          </div>
          <div className="ds-motion-note">counts up to value. use for stats, metrics, counts.</div>
        </div>

        <div className="ds-motion-cell ds-motion-cell--wide">
          <div className="ds-motion-label"><code>&lt;CommandStream/&gt;</code></div>
          <div
            className="ds-motion-stage"
            style={{ background: 'var(--bg-inverse)', color: 'var(--fg-inverse)', padding: 16 }}
          >
            <CommandStream
              lines={[
                { type: 'prompt', text: 'bcmr cp ./data host:/srv/', speed: 22 },
                { type: 'out',    text: 'scanning …',                pause: 400 },
                { type: 'out',    text: '  1,284 files · 12.4 gib',  pause: 200 },
                { type: 'ok',     text: '  ✓ transferred · blake3 verified', pause: 400 },
              ]}
            />
          </div>
          <div className="ds-motion-note">scripted terminal session. lines stream in with timed pauses.</div>
        </div>
      </div>
    </>
  );
}
