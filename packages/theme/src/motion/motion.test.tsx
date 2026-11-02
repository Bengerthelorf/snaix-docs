import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { BlockReveal } from './BlockReveal.tsx';
import { CommandStream } from './CommandStream.tsx';
import { GridFlip } from './GridFlip.tsx';
import { Scramble } from './Scramble.tsx';
import { Tally } from './Tally.tsx';
import { Typewriter } from './Typewriter.tsx';

describe('motion without client JavaScript', () => {
  test('keeps headlines and commands readable in the server response', () => {
    expect(renderToStaticMarkup(<Typewriter text="bcmr cp ./src ./dst" />)).toContain('bcmr cp ./src ./dst');
    expect(renderToStaticMarkup(<Scramble text="verified transfer" />)).toContain('verified transfer');
    expect(renderToStaticMarkup(<BlockReveal>copy files.</BlockReveal>)).not.toContain('visibility:hidden');
  });

  test('renders the actual metric and full terminal output', () => {
    expect(renderToStaticMarkup(<Tally to={16} suffix=" mib" />)).toContain('16');
    const terminal = renderToStaticMarkup(<CommandStream lines={[
      { type: 'prompt', text: 'bcmr verify ./dst' },
      { type: 'ok', text: 'verified' },
    ]} />);
    expect(terminal).toContain('bcmr verify ./dst');
    expect(terminal).toContain('verified');
  });

  test('supports fractional metrics with serializable Astro island props', () => {
    expect(renderToStaticMarkup(<Tally to={4.7} decimals={1} />)).toContain('4.7');
  });

  test('shows grid contents before hydration', () => {
    const grid = renderToStaticMarkup(<GridFlip items={['copy', 'verify']} />);
    expect(grid.match(/gf-cell is-flipped/g)).toHaveLength(2);
  });
});
