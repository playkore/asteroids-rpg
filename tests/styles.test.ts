import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const styles = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');

function selectorBlock(selector: string) {
  const match = styles.match(new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([\\s\\S]*?)\\}`, 'm'));
  return match?.[1] ?? '';
}

describe('styles', () => {
  it('keeps the mini-map and HUD surfaces transparent', () => {
    expect(selectorBlock('.mini-map')).toContain('background: transparent;');
    expect(selectorBlock('.hud__pill')).toContain('background: transparent;');
    expect(selectorBlock('.hud__meter')).toContain('background: transparent;');
    expect(selectorBlock('.hud__menu-button')).toContain('background: transparent;');
  });
});
