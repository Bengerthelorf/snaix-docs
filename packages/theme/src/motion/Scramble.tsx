import { useEffect, useState, type ElementType } from 'react';
import { useInView } from './useInView.ts';

const SCRAMBLE_CHARS =
  '!<>-_\\/[]{}—=+*^?#abcdefghijklmnopqrstuvwxyz0123456789';

interface ScrambleProps {
  text: string;
  duration?: number;
  delay?: number;
  className?: string;
  as?: ElementType;
}

export function Scramble({
  text,
  duration = 900,
  delay = 0,
  className = '',
  as: Tag = 'span',
}: ScrambleProps) {
  const [ref, inView] = useInView<HTMLElement>();
  const [shown, setShown] = useState(() => text.replace(/\S/g, ' '));

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now() + delay;
    const frame = (now: number) => {
      if (now < start) {
        raf = requestAnimationFrame(frame);
        return;
      }
      const t = Math.min(1, (now - start) / duration);
      const revealCount = Math.floor(t * text.length);
      let out = '';
      for (let i = 0; i < text.length; i++) {
        if (i < revealCount) out += text[i];
        else if (text[i] === ' ') out += ' ';
        else out += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
      }
      setShown(out);
      if (t < 1) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [inView, text, duration, delay]);

  return (
    <Tag ref={ref as any} className={className}>
      {shown}
    </Tag>
  );
}

interface ScrambleLinesProps {
  lines: string[];
  delay?: number;
  lineStagger?: number;
  duration?: number;
  className?: string;
}

export function ScrambleLines({
  lines,
  delay = 0,
  lineStagger = 120,
  duration = 700,
  className = '',
}: ScrambleLinesProps) {
  return (
    <div className={className}>
      {lines.map((line, i) => (
        <div key={i} style={{ display: 'block' }}>
          <Scramble text={line} delay={delay + i * lineStagger} duration={duration} />
        </div>
      ))}
    </div>
  );
}
