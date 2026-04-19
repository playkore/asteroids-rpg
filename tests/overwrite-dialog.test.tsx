import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import OverwriteDialog from '../src/components/OverwriteDialog';

describe('OverwriteDialog', () => {
  it('renders the overwrite confirmation copy', () => {
    const markup = renderToStaticMarkup(
      <OverwriteDialog slotLabel="Slot 2" onCancel={vi.fn()} onConfirm={vi.fn()} />,
    );

    expect(markup).toContain('Overwrite?');
    expect(markup).toContain('Slot 2 already has progress.');
    expect(markup).toContain('Cancel');
    expect(markup).toContain('Start New');
  });
});
