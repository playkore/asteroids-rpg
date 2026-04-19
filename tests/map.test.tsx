import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Map, { buildGridLayout } from '../src/Map';

describe('Map', () => {
  it('builds a grid layout around visited cells and the current cell', () => {
    const layout = buildGridLayout({
      seed: 'CINDER-5D',
      currentCell: { x: 0, y: 0 },
      cells: {
        '0:0': {
          kind: 'combat',
          visited: true,
          cleared: false,
          remaining: { 3: 1, 2: 0, 1: 0 },
        },
        '1:0': {
          kind: 'empty',
          visited: true,
          cleared: false,
          remaining: { 3: 0, 2: 0, 1: 0 },
        },
      },
    });

    expect(layout.cells.some((cell) => cell.current)).toBe(true);
    expect(layout.cells.some((cell) => cell.visited)).toBe(true);
    expect(layout.viewBox).toContain('0 0');
  });

  it('renders current and visited cells', () => {
    const markup = renderToStaticMarkup(
      <Map
        mapState={{
          seed: 'CINDER-5D',
          currentCell: { x: 0, y: 0 },
          cells: {
            '0:0': {
              kind: 'combat',
              visited: true,
              cleared: false,
              remaining: { 3: 1, 2: 0, 1: 0 },
            },
            '1:0': {
              kind: 'empty',
              visited: true,
              cleared: true,
              remaining: { 3: 0, 2: 0, 1: 0 },
            },
          },
        }}
      />,
    );

    expect(markup).toContain('Grid Map');
    expect(markup).toContain('data-current="true"');
    expect(markup).toContain('data-visited="true"');
  });
});
