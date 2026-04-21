import { useEffect, useState, type ElementType } from 'react';
import { useInView } from './useInView.ts';

interface TypewriterProps {
  text: string;
  speed?: number;
  delay?: number;
  cursor?: boolean;
  onDone?: () => void;
  as?: ElementType;
  className?: string;
}

export function Typewriter({
  text,
  speed = 32,
  delay = 0,
  cursor = true,
  onDone,
  as: Tag = 'span',
  className = '',
}: TypewriterProps) {
  const [ref, inView] = useInView<HTMLElement>();
  const [shown, setShown] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!inView) return;
    let i = 0;
    let tickId = 0;
    const start = window.setTimeout(() => {
      tickId = window.setInterval(() => {
        i++;
        setShown(text.slice(0, i));
        if (i >= text.length) {
          window.clearInterval(tickId);
          setDone(true);
          onDone?.();
        }
      }, speed);
    }, delay);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(tickId);
    };
  }, [inView, text, speed, delay, onDone]);

  return (
    <Tag ref={ref as any} className={className}>
      {shown}
      {cursor && !done && <span className="tw-cursor">█</span>}
    </Tag>
  );
}
