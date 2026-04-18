import { useEffect, type CSSProperties } from 'react';
import { useJoystickInput } from '../hooks/useJoystickInput';

const JOYSTICK_RADIUS = 56;

export default function FloatingControls({
  enabled,
  onMovementChange,
  onFireStart,
  onFireEnd,
}: {
  enabled: boolean;
  onMovementChange: (movement: { x: number; y: number; active: boolean }) => void;
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
    <>
      <button
        className={`joystick${vector.active ? ' is-active' : ''}`}
        type="button"
        aria-label="Virtual joystick"
        style={(
          vector.active
            ? {
                display: 'grid',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                '--knob-x': `${vector.x * JOYSTICK_RADIUS}px`,
                '--knob-y': `${vector.y * JOYSTICK_RADIUS}px`,
              }
            : { display: 'none' }
        ) as CSSProperties}
        {...bindings}
      >
        <span className="joystick__base" />
        <span className="joystick__knob" />
      </button>

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
    </>
  );
}
