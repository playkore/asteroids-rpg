import Map from '../Map';

export default function MapOverlay({ onClose }: { onClose: () => void }) {
  return (
    <section className="map-overlay" aria-label="Map overlay">
      <button className="map-overlay__close" type="button" onClick={onClose}>
        Close
      </button>
      <Map />
    </section>
  );
}
