import { useCallback, useMemo, useRef, useState } from 'react';
import type { PointerEventHandler } from 'react';

export type JoystickVector = {
  x: number;
  y: number;
  active: boolean;
};

export type JoystickBindings = {
  onPointerDown: PointerEventHandler<HTMLButtonElement>;
  onPointerMove: PointerEventHandler<HTMLButtonElement>;
  onPointerUp: PointerEventHandler<HTMLButtonElement>;
  onPointerCancel: PointerEventHandler<HTMLButtonElement>;
};

type JoystickState = {
  active: boolean;
  pointerId: number | null;
  centerX: number;
  centerY: number;
  x: number;
  y: number;
};

export function useJoystickInput({
  enabled,
  radius,
  onChange,
}: {
  enabled: boolean;
  radius: number;
  onChange: (vector: JoystickVector) => void;
}) {
  const stateRef = useRef<JoystickState>({
    active: false,
    pointerId: null,
    centerX: 0,
    centerY: 0,
    x: 0,
    y: 0,
  });
  const [viewState, setViewState] = useState<JoystickVector>({
    x: 0,
    y: 0,
    active: false,
  });

  const emit = useCallback(() => {
    const state = stateRef.current;
    const next = {
      x: state.active ? state.x : 0,
      y: state.active ? state.y : 0,
      active: state.active,
    };
    setViewState(next);
    onChange(next);
  }, [onChange]);

  const reset = useCallback(() => {
    const state = stateRef.current;
    state.active = false;
    state.pointerId = null;
    state.x = 0;
    state.y = 0;
    emit();
  }, [emit]);

  const onPointerDown = useCallback<PointerEventHandler<HTMLButtonElement>>(
    (event) => {
      if (!enabled) {
        return;
      }

      const state = stateRef.current;
      state.active = true;
      state.pointerId = event.pointerId;
      state.centerX = event.clientX;
      state.centerY = event.clientY;
      state.x = 0;
      state.y = 0;
      event.currentTarget.setPointerCapture(event.pointerId);
      emit();
    },
    [enabled, emit],
  );

  const onPointerMove = useCallback<PointerEventHandler<HTMLButtonElement>>(
    (event) => {
      const state = stateRef.current;
      if (!state.active || state.pointerId !== event.pointerId) {
        return;
      }

      const dx = event.clientX - state.centerX;
      const dy = event.clientY - state.centerY;
      const length = Math.hypot(dx, dy);
      const clamped = Math.min(length, radius);
      const factor = clamped / radius;
      const nx = length > 0 ? dx / length : 0;
      const ny = length > 0 ? dy / length : 0;
      state.x = nx * factor;
      state.y = ny * factor;
      emit();
    },
    [emit, radius],
  );

  const endPointer = useCallback<PointerEventHandler<HTMLButtonElement>>(
    (event) => {
      const state = stateRef.current;
      if (state.pointerId !== event.pointerId) {
        return;
      }

      reset();
    },
    [reset],
  );

  const bindings = useMemo<JoystickBindings>(
    () => ({
      onPointerDown,
      onPointerMove,
      onPointerUp: endPointer,
      onPointerCancel: endPointer,
    }),
    [endPointer, onPointerDown, onPointerMove],
  );

  return {
    vector: viewState,
    bindings,
    reset,
  };
}
