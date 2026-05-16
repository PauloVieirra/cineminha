export function isMobileLikeDevice(): boolean {
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const narrow = Math.min(window.innerWidth, window.innerHeight) < 900;
  const uaMobile = /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry/i.test(
    navigator.userAgent
  );
  return (coarse && narrow) || uaMobile;
}

export function isLandscapeOrientation(): boolean {
  if (window.screen?.orientation?.type) {
    return window.screen.orientation.type.startsWith("landscape");
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
