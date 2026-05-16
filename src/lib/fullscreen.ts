export function isStandaloneDisplay(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    ("standalone" in window.navigator &&
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

export function isMobileLikeDevice(): boolean {
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const narrow = Math.min(window.innerWidth, window.innerHeight) < 900;
  const uaMobile = /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry/i.test(
    navigator.userAgent
  );
  return (coarse && narrow) || uaMobile;
}

/** Largura/altura do viewport — confiável no PWA e após rotação. */
function viewportDimensions(): { w: number; h: number } {
  const vv = window.visualViewport;
  return {
    w: vv?.width ?? window.innerWidth,
    h: vv?.height ?? window.innerHeight,
  };
}

export function isLandscapeOrientation(): boolean {
  const { w, h } = viewportDimensions();
  if (w > h && h < 900) return true;

  const screenType = window.screen?.orientation?.type;
  if (screenType) return screenType.startsWith("landscape");

  const legacy = (window as Window & { orientation?: number }).orientation;
  if (typeof legacy === "number") {
    return legacy === 90 || legacy === -90;
  }

  return window.matchMedia("(orientation: landscape)").matches;
}

export function shouldUseLandscapeFullscreen(): boolean {
  return isMobileLikeDevice() && isLandscapeOrientation();
}

type FsElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
};

export async function requestElementFullscreen(element: HTMLElement): Promise<boolean> {
  const el = element as FsElement;
  try {
    if (el.requestFullscreen) {
      await el.requestFullscreen();
      return true;
    }
    if (el.webkitRequestFullscreen) {
      await el.webkitRequestFullscreen();
      return true;
    }
    if (el.msRequestFullscreen) {
      await el.msRequestFullscreen();
      return true;
    }
  } catch {
    /* fallback via CSS imersivo */
  }
  return false;
}

export async function exitElementFullscreen(): Promise<void> {
  const doc = document as Document & {
    webkitExitFullscreen?: () => Promise<void> | void;
    msExitFullscreen?: () => Promise<void> | void;
  };
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else if (doc.webkitExitFullscreen) {
      await doc.webkitExitFullscreen();
    } else if (doc.msExitFullscreen) {
      await doc.msExitFullscreen();
    }
  } catch {
    /* ignorar */
  }
}

export async function requestVideoNativeFullscreen(
  video: HTMLVideoElement
): Promise<boolean> {
  const v = video as HTMLVideoElement & {
    webkitEnterFullscreen?: () => void;
    webkitSetPresentationMode?: (mode: string) => void;
  };
  try {
    if (v.webkitEnterFullscreen) {
      v.webkitEnterFullscreen();
      return true;
    }
    if (v.webkitSetPresentationMode) {
      v.webkitSetPresentationMode("fullscreen");
      return true;
    }
    return await requestElementFullscreen(video);
  } catch {
    return false;
  }
}

export function subscribeViewportOrientation(onChange: () => void): () => void {
  const handler = () => onChange();

  window.addEventListener("orientationchange", handler);
  window.addEventListener("resize", handler);
  window.addEventListener("pageshow", handler);
  window.visualViewport?.addEventListener("resize", handler);

  const mq = window.matchMedia("(orientation: landscape)");
  mq.addEventListener("change", handler);

  const screenOrientation = window.screen?.orientation;
  screenOrientation?.addEventListener?.("change", handler);

  return () => {
    window.removeEventListener("orientationchange", handler);
    window.removeEventListener("resize", handler);
    window.removeEventListener("pageshow", handler);
    window.visualViewport?.removeEventListener("resize", handler);
    mq.removeEventListener("change", handler);
    screenOrientation?.removeEventListener?.("change", handler);
  };
}
