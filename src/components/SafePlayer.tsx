import { useCallback, useEffect, useRef, useState } from "react";
import { useMobileLandscapeFullscreen } from "../hooks/useMobileLandscapeFullscreen";
import { parseVideoUrl, vimeoEmbedParams, youtubeEmbedParams } from "../lib/video-url";
import type { Video } from "../types";

interface SafePlayerProps {
  video: Video;
  onProgress?: (seconds: number) => void;
  onComplete?: () => void;
  /** Ativa fullscreen automático em mobile horizontal */
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
  const startRef = useRef(Date.now());
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [blocked, setBlocked] = useState(false);

  const resetKey = `${video.id}-${video.embedId ?? ""}`;
  const { shellRef, bindVideoRef, isLandscapeMobile } = useMobileLandscapeFullscreen({
    enabled: landscapeFullscreen,
    resetKey,
  });

  const setShellRef = useCallback(
    (node: HTMLDivElement | null) => {
      shellRef.current = node;
    },
    [shellRef]
  );

  const setVideoRef = useCallback(
    (node: HTMLVideoElement | null) => {
      innerVideoRef.current = node;
      bindVideoRef(node);
    },
    [bindVideoRef]
  );

  const shellClass = [
    "safe-player-shell",
    isLandscapeMobile ? "safe-player-shell--immersive" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const reportProgress = useCallback(() => {
    const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
    onProgress?.(elapsed);
  }, [onProgress]);

  useEffect(() => {
    startRef.current = Date.now();
    tickRef.current = setInterval(reportProgress, 5000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [video.id, reportProgress]);

  useEffect(() => {
    const blockKeys = (e: KeyboardEvent) => {
      if (e.key === "F11" || (e.ctrlKey && e.key === "f")) e.preventDefault();
    };
    window.addEventListener("keydown", blockKeys);
    return () => window.removeEventListener("keydown", blockKeys);
  }, []);

  if (!parsed) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl bg-slate-900 text-slate-400">
        Vídeo indisponível
      </div>
    );
  }

  if (parsed.platform === "youtube" && parsed.embedId) {
    const src = `${parsed.embedUrl}?${youtubeEmbedParams()}`;
    return (
      <div ref={setShellRef} className={shellClass}>
        <iframe
          title={video.title}
          src={src}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-presentation"
        />
        {!isLandscapeMobile ? (
          <div className="safe-player-overlay absolute inset-0" aria-hidden />
        ) : null}
      </div>
    );
  }

  if (parsed.platform === "vimeo" && parsed.embedId) {
    const src = `${parsed.embedUrl}?${vimeoEmbedParams()}`;
    return (
      <div ref={setShellRef} className={shellClass}>
        <iframe
          title={video.title}
          src={src}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-presentation"
        />
      </div>
    );
  }

  if (parsed.platform === "direct" && parsed.embedUrl) {
    return (
      <div ref={setShellRef} className={shellClass}>
        <video
          ref={setVideoRef}
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
      </div>
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
