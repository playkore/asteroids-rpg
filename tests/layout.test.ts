import { describe, expect, it } from 'vitest';
import { MENU_BUTTON_TOP } from '../src/layout';

describe('layout', () => {
  it('keeps the menu button below the HUD', () => {
    expect(MENU_BUTTON_TOP).toContain('132px');
  });
});
