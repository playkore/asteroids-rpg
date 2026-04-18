export default function MapToggleButton({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      className="map-toggle"
      type="button"
      onClick={onToggle}
      aria-label={open ? 'Close map' : 'Open map'}
      aria-pressed={open}
    >
      <span className="map-toggle__frame" />
      <span className="map-toggle__grid" />
    </button>
  );
}
