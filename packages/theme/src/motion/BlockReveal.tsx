import { useEffect, useState, type ReactNode } from 'react';
import { useInView } from './useInView.ts';
import { useReducedMotion } from './useReducedMotion.ts';

interface BlockRevealProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  color?: string;
  className?: string;
}

/** 0: waiting, 1: covering, 2: covered, 3: uncovered */
type Phase = 0 | 1 | 2 | 3;

export function BlockReveal({
  children,
  delay = 0,
  duration = 600,
  color = 'var(--ink)',
  className = '',
}: BlockRevealProps) {
  const [ref, inView] = useInView<HTMLSpanElement>();
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>(3);

  useEffect(() => {
    if (!inView || reducedMotion || duration <= 0) return;
    setPhase(0);
    const t1 = window.setTimeout(() => setPhase(1), delay);
    const t2 = window.setTimeout(() => setPhase(2), delay + duration / 2);
    const t3 = window.setTimeout(() => setPhase(3), delay + duration);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [inView, delay, duration, reducedMotion]);

  const visiblePhase = !inView || reducedMotion || duration <= 0 ? 3 : phase;

  return (
    <span
      ref={ref}
      className={`block-reveal ${className}`}
      style={{ position: 'relative', display: 'inline-block' }}
    >
      <span>{children}</span>
      <span
        className="block-reveal-cover"
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: color,
          transformOrigin: visiblePhase < 2 ? 'left' : 'right',
          transform:
            visiblePhase === 0 ? 'scaleX(0)' : visiblePhase === 3 ? 'scaleX(0)' : 'scaleX(1)',
          transition: `transform ${duration / 2}ms var(--ease)`,
        }}
      />
    </span>
  );
}
