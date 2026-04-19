import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import FloatingControls from '../src/components/FloatingControls';

describe('FloatingControls', () => {
  it('renders the joystick shell and knob elements', () => {
    const markup = renderToStaticMarkup(
      <FloatingControls
        enabled={false}
        onMovementChange={() => undefined}
      />,
    );

    expect(markup).toContain('controls-layer');
    expect(markup).toContain('joystick__base');
    expect(markup).toContain('joystick__knob');
  });
});
