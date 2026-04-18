import { useCallback, useEffect, type Dispatch, type SetStateAction } from 'react';

export type ScreenMode = 'start' | 'play' | 'map' | 'gameover';

export function useScreenMode(
  started: boolean,
  gameOver: boolean,
  mapOpen: boolean,
  setMapOpen: Dispatch<SetStateAction<boolean>>,
) {
  useEffect(() => {
    if (!started || gameOver) {
      setMapOpen(false);
    }
  }, [gameOver, setMapOpen, started]);

  const openMap = useCallback(() => {
    if (started && !gameOver) {
      setMapOpen(true);
    }
  }, [gameOver, started]);

  const closeMap = useCallback(() => {
    setMapOpen(false);
  }, []);

  const toggleMap = useCallback(() => {
    if (started && !gameOver) {
      setMapOpen((value) => !value);
    }
  }, [gameOver, started]);

  const mode: ScreenMode = !started ? 'start' : gameOver ? 'gameover' : mapOpen ? 'map' : 'play';

  return {
    mode,
    mapOpen,
    openMap,
    closeMap,
    toggleMap,
  };
}
