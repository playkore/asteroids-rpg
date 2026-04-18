import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Hud from '../src/components/Hud';

describe('Hud', () => {
  it('renders HP and XP progress bars with the active seed', () => {
    const markup = renderToStaticMarkup(
      <Hud
        hud={{
          player: {
            level: 2,
            xp: 18,
            hp: 42,
            maxHp: 74,
            attack: 12,
          },
          seed: 'CINDER-5D',
          gameOver: false,
          ready: true,
        }}
      />,
    );

    expect(markup).toContain('HP');
    expect(markup).toContain('XP');
    expect(markup).toContain('Seed');
    expect(markup).toContain('CINDER-5D');
    expect(markup).not.toContain('Score');
    expect(markup).not.toContain('Lives');
    expect(markup).not.toContain('Wave');
  });
});
