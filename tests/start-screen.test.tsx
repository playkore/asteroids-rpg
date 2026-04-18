import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import StartScreen from '../src/components/StartScreen';

describe('StartScreen', () => {
  it('renders the title, seed field, and start action', () => {
    const markup = renderToStaticMarkup(
      <StartScreen
        seed="ALPHA-7X"
        onSeedChange={vi.fn()}
        onRoll={vi.fn()}
        onStart={vi.fn()}
      />,
    );

    expect(markup).toContain('Asteroids RPG');
    expect(markup).toContain('Start Adventure');
    expect(markup).toContain('ALPHA-7X');
  });
});
