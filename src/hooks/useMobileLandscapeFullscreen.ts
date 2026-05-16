import { useCallback, useEffect, useRef, useState } from "react";
import {
  exitElementFullscreen,
  requestElementFullscreen,
  requestVideoNativeFullscreen,
  shouldUseLandscapeFullscreen,
  subscribeViewportOrientation,
} from "../lib/fullscreen";

const ROOT_ATTR = "data-landscape-player";

interface UseMobileLandscapeFullscreenOptions {
  enabled?: boolean;
  /** Re-dispara fullscreen ao trocar de vídeo */
  resetKey?: string;
}

export function useMobileLandscapeFullscreen(
  options: UseMobileLandscapeFullscreenOptions = {}
) {
  const { enabled = true, resetKey = "" } = options;
  const shellRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isLandscapeMobile, setIsLandscapeMobile] = useState(false);
  const enteredFsRef = useRef(false);

  const updateOrientation = useCallback(() => {
    const next = enabled && shouldUseLandscapeFullscreen();
    setIsLandscapeMobile(next);
    if (next) {
      document.documentElement.setAttribute(ROOT_ATTR, "true");
    } else {
      document.documentElement.removeAttribute(ROOT_ATTR);
    }
  }, [enabled]);

  useEffect(() => {
    updateOrientation();
    const unsubscribe = subscribeViewportOrientation(updateOrientation);
    return () => {
      unsubscribe();
      document.documentElement.removeAttribute(ROOT_ATTR);
      exitElementFullscreen();
    };
  }, [updateOrientation]);

  useEffect(() => {
    if (!isLandscapeMobile) {
      if (enteredFsRef.current) {
        exitElementFullscreen();
        enteredFsRef.current = false;
      }
      return;
    }

    const shell = shellRef.current;
    if (!shell) return;

    let cancelled = false;

    const enter = async () => {
      await new Promise((r) => setTimeout(r, 120));
      if (cancelled) return;

      const video = videoRef.current;
      if (video) {
        const ok = await requestVideoNativeFullscreen(video);
        if (ok) {
          enteredFsRef.current = true;
          return;
        }
      }

      const ok = await requestElementFullscreen(shell);
      enteredFsRef.current = ok;
    };

    enter();

    return () => {
      cancelled = true;
      exitElementFullscreen();
      enteredFsRef.current = false;
    };
  }, [isLandscapeMobile, resetKey]);

  const bindVideoRef = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
  }, []);

  return { shellRef, bindVideoRef, isLandscapeMobile };
}
