const X_LABELS = ['ALFA', 'BRAVO', 'CHARLIE', 'DELTA', 'ECHO', 'FOXTROT', 'GOLF'];

export function formatHudCellCoord(x: number, y: number) {
  return `${formatHudX(x)}-${formatHudY(y)}`;
}

export function formatHudX(x: number) {
  return X_LABELS[((x % X_LABELS.length) + X_LABELS.length) % X_LABELS.length]!;
}

export function formatHudY(y: number) {
  const negative = y < 0;
  const value = Math.abs(y);
  const group = Math.floor(value / 10);
  const digit = value % 10;
  return `${negative ? '-' : ''}${formatHudYGroup(group)}${digit}`;
}

function formatHudYGroup(index: number) {
  let value = index;
  let label = '';

  do {
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26) - 1;
  } while (value >= 0);

  return label;
}
