import { useCallback, useEffect, useRef, useState } from "react";
import {
  shouldUseLandscapeFullscreen,
  subscribeViewportOrientation,
} from "../lib/fullscreen";

const ROOT_ATTR = "data-landscape-player";

interface UseMobileLandscapeFullscreenOptions {
  enabled?: boolean;
}

/**
 * Modo imersivo só via CSS (sem API Fullscreen nativa) para não remontar iframes ao girar o celular.
 */
export function useMobileLandscapeFullscreen(
  options: UseMobileLandscapeFullscreenOptions = {}
) {
  const { enabled = true } = options;
  const shellRef = useRef<HTMLDivElement>(null);
  const [autoLandscape, setAutoLandscape] = useState(false);
  const [userImmersive, setUserImmersive] = useState(false);

  const isImmersive = enabled && (autoLandscape || userImmersive);

  const syncRootAttr = useCallback(
    (immersive: boolean) => {
      if (immersive) {
        document.documentElement.setAttribute(ROOT_ATTR, "true");
      } else {
        document.documentElement.removeAttribute(ROOT_ATTR);
      }
    },
    []
  );

  useEffect(() => {
    const update = () => {
      setAutoLandscape(enabled && shouldUseLandscapeFullscreen());
    };
    update();
    return subscribeViewportOrientation(update);
  }, [enabled]);

  useEffect(() => {
    syncRootAttr(isImmersive);
    return () => syncRootAttr(false);
  }, [isImmersive, syncRootAttr]);

  const enterImmersive = useCallback(() => setUserImmersive(true), []);
  const exitImmersive = useCallback(() => setUserImmersive(false), []);

  const toggleImmersive = useCallback(() => {
    setUserImmersive((v) => !v);
  }, []);

  return {
    shellRef,
    isImmersive,
    isAutoLandscape: autoLandscape,
    enterImmersive,
    exitImmersive,
    toggleImmersive,
  };
}
