import { motion } from "framer-motion";

interface ProfileAvatarProps {
  name: string;
  emoji: string;
  color: string;
  size?: "sm" | "md" | "lg" | "xl";
  selected?: boolean;
}

const sizes = {
  sm: "h-12 w-12 text-xl",
  md: "h-16 w-16 text-2xl",
  lg: "h-24 w-24 text-4xl",
  xl: "h-28 w-28 text-5xl sm:h-32 sm:w-32",
};

export function ProfileAvatar({
  name,
  emoji,
  color,
  size = "md",
  selected,
}: ProfileAvatarProps) {
  return (
    <motion.div
      className="flex flex-col items-center gap-3"
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <div
        className={`
          relative flex items-center justify-center rounded-2xl font-bold
          transition-shadow duration-300 ${sizes[size]}
          ${selected ? "ring-4 ring-white ring-offset-4 ring-offset-[#0a0e17]" : ""}
        `}
        style={{
          background: `linear-gradient(135deg, ${color}88, ${color})`,
          boxShadow: selected ? `0 0 40px ${color}66` : `0 8px 32px ${color}33`,
        }}
      >
        <span role="img" aria-hidden>
          {emoji}
        </span>
      </div>
      <span className="max-w-[100px] truncate text-center text-sm font-medium text-slate-200 sm:max-w-[120px] sm:text-base">
        {name}
      </span>
    </motion.div>
  );
}
