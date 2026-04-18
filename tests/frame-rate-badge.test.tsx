import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import FrameRateBadge from '../src/components/FrameRateBadge';

describe('FrameRateBadge', () => {
  it('renders the FPR label and value', () => {
    const markup = renderToStaticMarkup(<FrameRateBadge frameRate={58} />);

    expect(markup).toContain('FPR');
    expect(markup).toContain('58');
  });
});
