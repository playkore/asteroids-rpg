import { useCallback, useEffect, type Dispatch, type SetStateAction } from 'react';

export type ScreenMode = 'play' | 'map' | 'gameover';

export function useScreenMode(
  gameOver: boolean,
  mapOpen: boolean,
  setMapOpen: Dispatch<SetStateAction<boolean>>,
) {
  useEffect(() => {
    if (gameOver) {
      setMapOpen(false);
    }
  }, [gameOver, setMapOpen]);

  const openMap = useCallback(() => {
    if (!gameOver) {
      setMapOpen(true);
    }
  }, [gameOver]);

  const closeMap = useCallback(() => {
    setMapOpen(false);
  }, []);

  const toggleMap = useCallback(() => {
    if (!gameOver) {
      setMapOpen((value) => !value);
    }
  }, [gameOver]);

  const mode: ScreenMode = gameOver ? 'gameover' : mapOpen ? 'map' : 'play';

  return {
    mode,
    mapOpen,
    openMap,
    closeMap,
    toggleMap,
  };
}
