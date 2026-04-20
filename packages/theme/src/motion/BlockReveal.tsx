import { useEffect, useState, type ReactNode } from 'react';
import { useInView } from './useInView.ts';

interface BlockRevealProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  color?: string;
  className?: string;
}

/** 0: hidden, 1: covered, 2: revealing, 3: done */
type Phase = 0 | 1 | 2 | 3;

export function BlockReveal({
  children,
  delay = 0,
  duration = 600,
  color = 'var(--ink)',
  className = '',
}: BlockRevealProps) {
  const [ref, inView] = useInView<HTMLSpanElement>();
  const [phase, setPhase] = useState<Phase>(0);

  useEffect(() => {
    if (!inView) return;
    const t1 = window.setTimeout(() => setPhase(1), delay);
    const t2 = window.setTimeout(() => setPhase(2), delay + duration / 2);
    const t3 = window.setTimeout(() => setPhase(3), delay + duration);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [inView, delay, duration]);

  return (
    <span
      ref={ref}
      className={`block-reveal ${className}`}
      style={{ position: 'relative', display: 'inline-block' }}
    >
      <span style={{ visibility: phase >= 2 ? 'visible' : 'hidden' }}>{children}</span>
      <span
        className="block-reveal-cover"
        style={{
          position: 'absolute',
          inset: 0,
          background: color,
          transformOrigin: phase < 2 ? 'left' : 'right',
          transform:
            phase === 0 ? 'scaleX(0)' : phase === 3 ? 'scaleX(0)' : 'scaleX(1)',
          transition: `transform ${duration / 2}ms var(--ease)`,
        }}
      />
    </span>
  );
}
