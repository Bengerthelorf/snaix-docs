import { useEffect, useRef, useState, type ElementType } from 'react';
import { useInView } from './useInView.ts';
import { useReducedMotion } from './useReducedMotion.ts';

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
  const reducedMotion = useReducedMotion();
  const [shown, setShown] = useState(text);
  const [done, setDone] = useState(true);
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

  useEffect(() => {
    if (!inView) return;
    if (reducedMotion || speed <= 0 || text.length === 0) {
      setShown(text);
      setDone(true);
      onDoneRef.current?.();
      return;
    }
    setShown('');
    setDone(false);
    let i = 0;
    let tickId = 0;
    const start = window.setTimeout(() => {
      tickId = window.setInterval(() => {
        i++;
        setShown(text.slice(0, i));
        if (i >= text.length) {
          window.clearInterval(tickId);
          setDone(true);
          onDoneRef.current?.();
        }
      }, speed);
    }, delay);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(tickId);
    };
  }, [inView, text, speed, delay, reducedMotion]);

  return (
    <Tag ref={ref as any} className={className}>
      <span className="motion-reserve">
        <span className="motion-measure" aria-hidden="true" data-pagefind-ignore>{text}</span>
        <span>
          {!inView || reducedMotion ? text : shown}
          {cursor && inView && !reducedMotion && !done && <span className="tw-cursor" aria-hidden="true">█</span>}
        </span>
      </span>
    </Tag>
  );
}
