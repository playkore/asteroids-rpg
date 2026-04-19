import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Hud from '../src/components/Hud';

describe('Hud', () => {
  it('renders HP, XP, level, and cell information', () => {
    const markup = renderToStaticMarkup(
      <Hud
        hud={{
          player: {
            level: 2,
            xp: 3,
            hp: 8,
            maxHp: 12,
            attack: 3,
          },
          seed: 'CINDER-5D',
          gameOver: false,
          ready: true,
          cell: { x: 1, y: 2 },
          cellLevel: 3,
          slotIndex: 0,
        }}
      />,
    );

    expect(markup).toContain('HP');
    expect(markup).toContain('XP');
    expect(markup).toContain('Lv 2');
    expect(markup).toContain('Cell 1, 2');
    expect(markup).toContain('L3');
    expect(markup).toContain('CINDER-5D');
  });
});
