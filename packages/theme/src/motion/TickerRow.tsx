import type { ReactNode } from 'react';

interface TickerRowProps {
  items: ReactNode[];
  speed?: number;
  className?: string;
}

export function TickerRow({ items, speed = 40, className = '' }: TickerRowProps) {
  const doubled = [...items, ...items];
  return (
    <div className={`ticker ${className}`}>
      <div
        className="ticker-track"
        style={{ animationDuration: `${items.length * speed}s` }}
      >
        {doubled.map((it, i) => (
          <span key={i} className="ticker-item">
            <span className="ticker-mark">●</span>
            {it}
          </span>
        ))}
      </div>
    </div>
  );
}
