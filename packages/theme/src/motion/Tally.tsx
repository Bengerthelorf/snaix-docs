import { useEffect, useState } from 'react';
import { useInView } from './useInView.ts';

interface TallyProps {
  to: number;
  from?: number;
  duration?: number;
  delay?: number;
  prefix?: string;
  suffix?: string;
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
  format,
  className = '',
}: TallyProps) {
  const [ref, inView] = useInView<HTMLSpanElement>();
  const [val, setVal] = useState(from);

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
      const e = 1 - Math.pow(1 - t, 3);
      setVal(from + (to - from) * e);
      if (t < 1) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, from, duration, delay]);

  const display = format ? format(val) : Math.round(val).toLocaleString();
  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
