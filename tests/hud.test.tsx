import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Hud from '../src/components/Hud';

describe('Hud', () => {
  it('renders HP, XP, and sector asteroids information', () => {
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
          cell: { x: 4, y: 253 },
          cellLevel: 3,
          sectorAsteroidHpCurrent: 12,
          sectorAsteroidHpTotal: 38,
          sectorHasAsteroids: true,
          slotIndex: 0,
        }}
      />,
    );

    expect(markup).toContain('HP');
    expect(markup).toContain('XP');
    expect(markup).toContain('ECHO-Z3');
    expect(markup).toContain('12 / 38');
    expect(markup).toContain('ECHO-Z3');
    expect(markup).not.toContain('CINDER-5D');
    expect(markup).toContain('<span class="hud__sector-title">ECHO-Z3</span>');
  });

  it('shows clear when there are no sector asteroids', () => {
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
          cell: { x: 4, y: 253 },
          cellLevel: 3,
          sectorAsteroidHpCurrent: 0,
          sectorAsteroidHpTotal: 0,
          sectorHasAsteroids: false,
          slotIndex: 0,
        }}
      />,
    );

    expect(markup).toContain('CLEAR');
    expect(markup).not.toContain('0 / 0');
    expect(markup).toContain('hud__sector-clear');
  });

  it('shows sector void for negative y coordinates', () => {
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
          cell: { x: 4, y: -1 },
          cellLevel: 0,
          sectorAsteroidHpCurrent: 0,
          sectorAsteroidHpTotal: 0,
          sectorHasAsteroids: false,
          slotIndex: 0,
        }}
      />,
    );

    expect(markup).toContain('SECTOR VOID');
    expect(markup).not.toContain('SECTOR ECHO');
  });

  it('renders menu button inside the hud container when provided', () => {
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
          cell: { x: 4, y: 253 },
          cellLevel: 3,
          sectorAsteroidHpCurrent: 0,
          sectorAsteroidHpTotal: 0,
          sectorHasAsteroids: false,
          slotIndex: 0,
        }}
        onMenuClick={() => undefined}
      />,
    );

    expect(markup).toContain('<button class="hud__menu-button" type="button">Menu</button>');
    expect(markup).toContain('hud__menu-button');
  });
});
