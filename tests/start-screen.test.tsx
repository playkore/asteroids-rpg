import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import StartScreen from '../src/components/StartScreen';

describe('StartScreen', () => {
  it('renders the menu, seed field, and save slots', () => {
    const markup = renderToStaticMarkup(
      <StartScreen
        seed="ALPHA-7X"
        onSeedChange={vi.fn()}
        onRoll={vi.fn()}
        onContinue={vi.fn()}
        onNewGame={vi.fn()}
        onLoadGame={vi.fn()}
        paused={false}
        saveBundle={{
          version: 1,
          lastSlot: null,
          slots: [null, null, null],
        }}
      />,
    );

    expect(markup).toContain('Asteroids RPG');
    expect(markup).toContain('Seed');
    expect(markup).toContain('Continue');
    expect(markup).toContain('New Game');
    expect(markup).not.toContain('Resume');
    expect(markup).toContain('Load Game');
    expect(markup).toContain('Slot 1');
    expect(markup).toContain('ALPHA-7X');
  });
});
