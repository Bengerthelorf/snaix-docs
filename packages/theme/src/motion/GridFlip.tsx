import { useEffect, useState, type ReactNode } from 'react';
import { useInView } from './useInView.ts';
import { useReducedMotion } from './useReducedMotion.ts';

interface GridFlipProps {
  items: ReactNode[];
  cols?: number;
  delay?: number;
  stagger?: number;
  className?: string;
}

export function GridFlip({
  items,
  cols = 3,
  delay = 0,
  stagger = 60,
  className = '',
}: GridFlipProps) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const reducedMotion = useReducedMotion();
  const [flipped, setFlipped] = useState<Set<number> | null>(null);

  useEffect(() => {
    if (!inView || reducedMotion) return;
    setFlipped(new Set());
    const timers = items.map((_, i) =>
      window.setTimeout(() => {
        setFlipped((s) => {
          const n = new Set(s);
          n.add(i);
          return n;
        });
      }, delay + i * stagger),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [inView, items, delay, stagger, reducedMotion]);

  return (
    <div
      ref={ref}
      className={`grid-flip ${className}`}
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {items.map((item, i) => (
        <div key={i} className={`gf-cell ${(!inView || reducedMotion || flipped === null || flipped.has(i)) ? 'is-flipped' : ''}`}>
          <div className="gf-inner">
            <div className="gf-back" aria-hidden="true" />
            <div className="gf-front">{item}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
