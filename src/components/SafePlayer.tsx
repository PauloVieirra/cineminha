import { Maximize2, Minimize2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useMobileLandscapeFullscreen } from "../hooks/useMobileLandscapeFullscreen";
import { parseVideoUrl, vimeoEmbedParams, youtubeEmbedParams } from "../lib/video-url";
import type { Video } from "../types";

const CONTROLS_HIDE_MS = 3000;

interface SafePlayerProps {
  video: Video;
  onProgress?: (seconds: number) => void;
  onComplete?: () => void;
  landscapeFullscreen?: boolean;
}

export function SafePlayer({
  video,
  onProgress,
  onComplete,
  landscapeFullscreen = false,
}: SafePlayerProps) {
  const parsed = parseVideoUrl(video.url);
  const innerVideoRef = useRef<HTMLVideoElement>(null);
  const iframeSrcRef = useRef<string | null>(null);
  const embedKey = `${video.id}-${video.embedId ?? ""}`;
  const startRef = useRef(Date.now());
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  const { shellRef, isImmersive, toggleImmersive, exitImmersive } = useMobileLandscapeFullscreen({
    enabled: landscapeFullscreen,
  });

  const setShellRef = useCallback(
    (node: HTMLDivElement | null) => {
      shellRef.current = node;
    },
    [shellRef]
  );

  const scheduleHideControls = useCallback(() => {
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    if (!isImmersive) return;
    hideControlsTimer.current = setTimeout(() => {
      setControlsVisible(false);
    }, CONTROLS_HIDE_MS);
  }, [isImmersive]);

  const revealControls = useCallback(() => {
    setControlsVisible(true);
    scheduleHideControls();
  }, [scheduleHideControls]);

  useEffect(() => {
    if (isImmersive) {
      setControlsVisible(false);
      scheduleHideControls();
    } else {
      setControlsVisible(true);
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    }
    return () => {
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    };
  }, [isImmersive, scheduleHideControls]);

  const shellClass = [
    "safe-player-shell",
    isImmersive ? "safe-player-shell--immersive" : "",
    controlsVisible ? "safe-player-shell--controls-visible" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const reportProgress = useCallback(() => {
    const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
    onProgress?.(elapsed);
  }, [onProgress]);

  useEffect(() => {
    iframeSrcRef.current = null;
  }, [embedKey]);

  useEffect(() => {
    startRef.current = Date.now();
    tickRef.current = setInterval(reportProgress, 5000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [video.id, reportProgress]);

  const shell = (content: ReactNode) => (
    <div
      ref={setShellRef}
      className={shellClass}
      onMouseMove={isImmersive ? revealControls : undefined}
    >
      {content}
      {isImmersive ? (
        <div
          className="safe-player-reveal-layer"
          aria-hidden
          onPointerDown={revealControls}
          onTouchStart={revealControls}
        />
      ) : null}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (isImmersive) {
            exitImmersive();
            setControlsVisible(true);
          } else {
            toggleImmersive();
            revealControls();
          }
        }}
        className="safe-player-fs-btn"
        aria-label={isImmersive ? "Sair da tela cheia" : "Tela cheia"}
      >
        {isImmersive ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
        {isImmersive ? <span className="safe-player-fs-label">Sair</span> : null}
      </button>
    </div>
  );

  if (!parsed) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl bg-slate-900 text-slate-400">
        Vídeo indisponível
      </div>
    );
  }

  if (parsed.platform === "youtube" && parsed.embedId) {
    const src = `${parsed.embedUrl}?${youtubeEmbedParams()}`;
    if (iframeSrcRef.current !== src) iframeSrcRef.current = src;
    return shell(
      <iframe
        key={video.embedId}
        title={video.title}
        src={iframeSrcRef.current}
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-scripts allow-same-origin allow-presentation"
      />
    );
  }

  if (parsed.platform === "vimeo" && parsed.embedId) {
    const src = `${parsed.embedUrl}?${vimeoEmbedParams()}`;
    if (iframeSrcRef.current !== src) iframeSrcRef.current = src;
    return shell(
      <iframe
        key={video.embedId}
        title={video.title}
        src={iframeSrcRef.current}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-scripts allow-same-origin allow-presentation"
      />
    );
  }

  if (parsed.platform === "direct" && parsed.embedUrl) {
    return shell(
      <video
        ref={innerVideoRef}
        key={parsed.embedUrl}
        src={parsed.embedUrl}
        controls
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        playsInline
        className="h-full w-full"
        onTimeUpdate={() => {
          const el = innerVideoRef.current;
          if (el) onProgress?.(Math.floor(el.currentTime));
        }}
        onEnded={() => onComplete?.()}
      />
    );
  }

  return (
    <div className="flex aspect-video flex-col items-center justify-center gap-4 rounded-2xl bg-slate-900 p-6 text-center">
      <p className="text-slate-400">
        Este tipo de link não pode ser reproduzido com segurança. Peça ao gestor para usar
        YouTube, Vimeo ou um arquivo de vídeo direto (.mp4).
      </p>
      {blocked ? null : (
        <button
          type="button"
          className="text-sm text-emerald-400 underline"
          onClick={() => setBlocked(true)}
        >
          Entendi
        </button>
      )}
    </div>
  );
}
