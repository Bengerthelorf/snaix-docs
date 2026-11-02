import { useEffect, useState } from 'react';
import { useInView } from './useInView.ts';
import { useReducedMotion } from './useReducedMotion.ts';

interface TallyProps {
  to: number;
  from?: number;
  duration?: number;
  delay?: number;
  prefix?: string;
  suffix?: string;
  /** Serializable decimal precision for Astro islands. */
  decimals?: number;
  format?: (n: number) => string;
  className?: string;
}

export function Tally({
  to,
  from = 0,
  duration = 1200,
  delay = 0,
  prefix = '',
  suffix = '',
  decimals = 0,
  format,
  className = '',
}: TallyProps) {
  const [ref, inView] = useInView<HTMLSpanElement>();
  const reducedMotion = useReducedMotion();
  const [val, setVal] = useState(to);

  useEffect(() => {
    if (!inView || reducedMotion || duration <= 0) return;
    setVal(from);
    let raf = 0;
    const start = performance.now() + delay;
    const frame = (now: number) => {
      if (now < start) {
        raf = requestAnimationFrame(frame);
        return;
      }
      const t = Math.min(1, (now - start) / duration);
      const e = 1 - Math.pow(1 - t, 3);
      setVal(from + (to - from) * e);
      if (t < 1) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, from, duration, delay, reducedMotion]);

  const value = !inView || reducedMotion || duration <= 0 ? to : val;
  const formatValue = (number: number) => format
    ? format(number)
    : decimals > 0 ? number.toFixed(decimals) : Math.round(number).toLocaleString();
  const display = formatValue(value);
  const finalDisplay = formatValue(to);
  return (
    <span ref={ref} className={className}>
      {prefix}
      <span className="motion-reserve">
        <span className="motion-measure" aria-hidden="true" data-pagefind-ignore>{finalDisplay}</span>
        <span>{display}</span>
      </span>
      {suffix}
    </span>
  );
}
