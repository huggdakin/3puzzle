import type { ReactNode } from "react";
import { motion } from "motion/react";
import { MoonIcon, SunIcon } from "./Icons";
import { STRINGS, type Lang } from "../lib/i18n";
import type { Theme } from "../lib/prefs";
import { cn } from "../utils/cn";

const cut = (n = 8) => ({
  clipPath: `polygon(${n}px 0, 100% 0, 100% calc(100% - ${n}px), calc(100% - ${n}px) 100%, 0 100%, 0 ${n}px)`,
});

function Switch({
  checked,
  onToggle,
  left,
  right,
  label,
}: {
  checked: boolean;
  onToggle: () => void;
  left: ReactNode;
  right: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onToggle}
      style={cut(8)}
      className="relative grid h-9 w-[76px] shrink-0 grid-cols-2 items-center border border-line bg-ink/[0.08] p-1 transition-colors hover:border-grape/50"
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 520, damping: 32 }}
        style={cut(5)}
        className={cn(
          "pointer-events-none absolute bottom-1 top-1 w-[calc(50%-4px)] bg-gradient-to-r from-ember-300 via-ember-400 to-ember-500 shadow-[0_0_16px_rgba(255,176,58,0.65)]",
          checked ? "left-[calc(50%)]" : "left-1"
        )}
      />
      <span
        className={cn(
          "relative z-10 flex h-full w-full items-center justify-center font-display text-[10px] font-bold uppercase tracking-[0.06em] leading-none transition-colors",
          !checked ? "text-[#04030c]" : "text-muted"
        )}
      >
        {left}
      </span>
      <span
        className={cn(
          "relative z-10 flex h-full w-full items-center justify-center font-display text-[10px] font-bold uppercase tracking-[0.06em] leading-none transition-colors",
          checked ? "text-[#04030c]" : "text-muted"
        )}
      >
        {right}
      </span>
    </button>
  );
}

export function ThemeToggle({
  theme,
  onChange,
  lang,
}: {
  theme: Theme;
  onChange: (t: Theme) => void;
  lang: Lang;
}) {
  const dark = theme === "dark";
  const t = STRINGS[lang];
  return (
    <Switch
      checked={dark}
      onToggle={() => onChange(dark ? "light" : "dark")}
      label={dark ? t.toLight : t.toDark}
      left={<SunIcon size={14} />}
      right={<MoonIcon size={13} />}
    />
  );
}

export function LangToggle({
  lang,
  onChange,
}: {
  lang: Lang;
  onChange: (l: Lang) => void;
}) {
  const en = lang === "en";
  const t = STRINGS[lang];
  return (
    <Switch
      checked={en}
      onToggle={() => onChange(en ? "ru" : "en")}
      label={en ? t.switchToRu : t.switchToEn}
      left="RU"
      right="EN"
    />
  );
}
