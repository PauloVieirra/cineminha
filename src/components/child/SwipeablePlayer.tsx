import { motion, type PanInfo } from "framer-motion";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SwipeablePlayerProps {
  children: ReactNode;
  onSwipePrev?: () => void;
  onSwipeNext?: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  hint?: string;
  hideHintOnLandscape?: boolean;
}

const SWIPE_THRESHOLD = 72;

export function SwipeablePlayer({
  children,
  onSwipePrev,
  onSwipeNext,
  hasPrev,
  hasNext,
  hint,
  hideHintOnLandscape = false,
}: SwipeablePlayerProps) {
  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_THRESHOLD && hasNext) onSwipeNext?.();
    else if (info.offset.x > SWIPE_THRESHOLD && hasPrev) onSwipePrev?.();
  };

  return (
    <div className="relative">
      {hasPrev ? (
        <button
          type="button"
          onClick={onSwipePrev}
          className="absolute left-2 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70 sm:flex"
          aria-label="Vídeo anterior"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      ) : null}
      {hasNext ? (
        <button
          type="button"
          onClick={onSwipeNext}
          className="absolute right-2 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70 sm:flex"
          aria-label="Próximo vídeo"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      ) : null}

      <motion.div
        drag={
          hasPrev || hasNext
            ? typeof document !== "undefined" &&
              document.documentElement.hasAttribute("data-landscape-player")
              ? false
              : "x"
            : false
        }
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        onDragEnd={handleDragEnd}
        className="touch-pan-y cursor-grab active:cursor-grabbing"
      >
        {children}
      </motion.div>

      {(hasPrev || hasNext) && hint ? (
        <p
          className={`mt-2 text-center text-xs text-slate-500 ${hideHintOnLandscape ? "swipe-hint-portrait-only" : ""}`}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}
