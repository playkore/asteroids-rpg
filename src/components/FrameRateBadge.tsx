type FrameRateBadgeProps = {
  frameRate: number;
};

export default function FrameRateBadge({ frameRate }: FrameRateBadgeProps) {
  return (
    <div className="frame-rate" aria-label="Frame rate">
      <span>FPR</span>
      <strong>{frameRate}</strong>
    </div>
  );
}
