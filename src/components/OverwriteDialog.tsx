type OverwriteDialogProps = {
  slotLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function OverwriteDialog({ slotLabel, onCancel, onConfirm }: OverwriteDialogProps) {
  return (
    <div className="overlay">
      <div className="overlay__panel">
        <h1>Overwrite?</h1>
        <p className="overlay__message">{slotLabel} already has progress.</p>
        <div className="overlay__actions">
          <button className="overlay__button" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="overlay__button" type="button" onClick={onConfirm}>
            Start New
          </button>
        </div>
      </div>
    </div>
  );
}
