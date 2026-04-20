import { useEffect, useState } from 'react';
import { useInView } from './useInView.ts';
import { Typewriter } from './Typewriter.tsx';

export type CmdLineType = 'prompt' | 'out' | 'ok' | 'warn' | 'err' | 'blank';

export interface CmdLine {
  type: CmdLineType;
  text?: string;
  speed?: number;
  pause?: number;
}

interface CommandStreamProps {
  lines: CmdLine[];
  startDelay?: number;
  className?: string;
}

export function CommandStream({
  lines,
  startDelay = 200,
  className = '',
}: CommandStreamProps) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const [visible, setVisible] = useState<number[]>([]);

  useEffect(() => {
    if (!inView) return;
    const timeouts: number[] = [];
    let acc = startDelay;
    lines.forEach((line, idx) => {
      const delay = acc;
      timeouts.push(
        window.setTimeout(() => {
          setVisible((v) => [...v, idx]);
        }, delay),
      );
      acc += (line.pause ?? 180) + (line.text ? line.text.length * (line.speed ?? 14) : 0);
    });
    return () => timeouts.forEach((t) => window.clearTimeout(t));
  }, [inView, lines, startDelay]);

  return (
    <div ref={ref} className={`cmd-stream ${className}`}>
      {lines.map((line, i) => {
        if (!visible.includes(i)) return null;
        const key = `${i}`;
        if (line.type === 'prompt') {
          return (
            <div key={key} className="cmd-line cmd-prompt">
              <span className="cmd-sigil">$</span>
              <Typewriter text={line.text ?? ''} speed={line.speed ?? 18} cursor={false} />
            </div>
          );
        }
        if (line.type === 'blank') {
          return <div key={key} className="cmd-line cmd-blank">&nbsp;</div>;
        }
        if (line.type === 'ok') {
          return (
            <div key={key} className="cmd-line cmd-ok">
              <span className="cmd-badge is-blue">ok</span> {line.text}
            </div>
          );
        }
        if (line.type === 'warn') {
          return (
            <div key={key} className="cmd-line cmd-warn">
              <span className="cmd-badge is-yellow">!!</span> {line.text}
            </div>
          );
        }
        if (line.type === 'err') {
          return (
            <div key={key} className="cmd-line cmd-err">
              <span className="cmd-badge is-red">xx</span> {line.text}
            </div>
          );
        }
        return (
          <div key={key} className="cmd-line cmd-out">
            {line.text}
          </div>
        );
      })}
    </div>
  );
}
