import { useEffect, type CSSProperties } from 'react';
import { useJoystickInput, type JoystickVector } from '../hooks/useJoystickInput';

const JOYSTICK_RADIUS = 56;

export default function FloatingControls({
  enabled,
  onMovementChange,
  onFireStart,
  onFireEnd,
}: {
  enabled: boolean;
  onMovementChange: (movement: JoystickVector) => void;
  onFireStart: () => void;
  onFireEnd: () => void;
}) {
  const { vector, bindings, reset } = useJoystickInput({
    enabled,
    radius: JOYSTICK_RADIUS,
    onChange: onMovementChange,
  });

  useEffect(() => {
    if (!enabled) {
      reset();
    }
  }, [enabled, reset]);

  return (
    <div className="controls-layer" aria-hidden={!enabled}>
      <div className="controls-surface" {...bindings} />

      <div
        className={`joystick${vector.active ? ' is-active' : ''}`}
        aria-hidden="true"
        style={(
          vector.active
            ? {
                display: 'grid',
                left: `${vector.centerX}px`,
                top: `${vector.centerY}px`,
                transform: 'translate(-50%, -50%)',
                '--knob-x': `${vector.x * JOYSTICK_RADIUS}px`,
                '--knob-y': `${vector.y * JOYSTICK_RADIUS}px`,
              }
            : { display: 'none' }
        ) as CSSProperties}
      >
        <span className="joystick__base" />
        <span className="joystick__knob" />
      </div>

      <button
        className="fire"
        type="button"
        onPointerDown={onFireStart}
        onPointerUp={onFireEnd}
        onPointerCancel={onFireEnd}
        aria-label="Shoot"
      >
        <span className="fire__ring" />
        <span className="fire__plus" />
      </button>
    </div>
  );
}
