import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Hud from '../src/components/Hud';

describe('Hud', () => {
  it('renders the active level seed as a copyable control', () => {
    const markup = renderToStaticMarkup(
      <Hud
        hud={{
          score: 1200,
          lives: 3,
          wave: 2,
          seed: 'CINDER-5D',
          gameOver: false,
          ready: true,
        }}
      />,
    );

    expect(markup).toContain('Seed');
    expect(markup).toContain('CINDER-5D');
  });
});
