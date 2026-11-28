import type { CSSProperties } from "react";
import expeditionBg from "../assets/expedition-bg.jpg";

const MOTE_COLORS = ["#ffd166", "#6ef7d8", "#c3aaff", "#ffb03a", "#23e0b6"];

// Светлячки и искры света в палитре LUMEN (ember / sonar / myst)
const MOTES = Array.from({ length: 22 }, (_, i) => ({
  left: `${(i * 41 + 9) % 94}%`,
  top: `${(i * 29 + 11) % 88}%`,
  size: 2.5 + (i % 4),
  dur: 5.5 + ((i * 5) % 7),
  delay: -((i * 3) % 9),
  color: MOTE_COLORS[i % MOTE_COLORS.length],
}));

export default function BackgroundFX() {
  return (
    <div className="world-bg" aria-hidden="true">
      {/* Пейзажная подложка с глубоким неоновым тонированием LUMEN */}
      <div
        className="world-bg__img"
        style={{ backgroundImage: `url(${expeditionBg})` }}
      />

      {/* Световая вуаль глубины */}
      <div className="world-bg__veil" />

      {/* Слои живой подложки из LUMEN: вращающиеся лучи, диагональная штриховка и зерно */}
      <div className="layer-beams pointer-events-none absolute -inset-[35%] opacity-85" />
      <div className="layer-hatch pointer-events-none absolute inset-0" />
      <div className="layer-grain pointer-events-none absolute inset-0" />

      {/* Векторный неоновый слой: кольца тоннеля LUMEN + картографическая сетка */}
      <svg
        className="world-bg__topo"
        viewBox="0 0 1600 1000"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <defs>
          <linearGradient id="topo-line" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffd166" stopOpacity="0.26" />
            <stop offset="50%" stopColor="#23e0b6" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#8b62ff" stopOpacity="0.26" />
          </linearGradient>
          <linearGradient id="lumen-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffb03a" stopOpacity="0.22" />
            <stop offset="50%" stopColor="#23e0b6" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#8b62ff" stopOpacity="0.24" />
          </linearGradient>
          <linearGradient id="ridge-back" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#161238" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#080718" stopOpacity="0.82" />
          </linearGradient>
          <linearGradient id="ridge-front" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0d0b24" stopOpacity="0.68" />
            <stop offset="100%" stopColor="#04030c" stopOpacity="0.96" />
          </linearGradient>
        </defs>

        {/* Перспективные кольца светового тоннеля LUMEN */}
        <g stroke="url(#lumen-ring)" strokeWidth="1.15">
          <circle cx="800" cy="420" r="190" strokeDasharray="6 10" opacity="0.45" />
          <circle cx="800" cy="420" r="340" opacity="0.35" />
          <circle cx="800" cy="420" r="520" strokeDasharray="10 14" opacity="0.3" />
          <circle cx="800" cy="420" r="720" opacity="0.22" />
        </g>

        {/* Меридианы и параллели атласа */}
        <g stroke="url(#topo-line)" strokeWidth="1" strokeDasharray="4 8">
          <path d="M-100 220 Q 800 60 1700 220" />
          <path d="M-100 440 Q 800 300 1700 440" />
          <path d="M-100 680 Q 800 540 1700 680" />
          <path d="M320 -50 Q 460 500 320 1050" />
          <path d="M800 -50 L 800 1050" opacity="0.45" />
          <path d="M1280 -50 Q 1140 500 1280 1050" />
        </g>

        {/* Плавные топографические изолинии высот */}
        <g stroke="url(#topo-line)" strokeWidth="1.2">
          <path d="M-60 350 C 260 270, 520 410, 840 330 C 1160 250, 1380 370, 1660 290" />
          <path
            d="M-60 390 C 280 310, 540 450, 860 370 C 1180 290, 1400 410, 1660 330"
            opacity="0.65"
          />
          <path
            d="M-40 610 C 310 530, 620 670, 940 570 C 1220 480, 1440 590, 1660 520"
            opacity="0.55"
          />
        </g>

        {/* Неоновый компас-сонар в верхней правой части */}
        <g
          transform="translate(1360, 180)"
          stroke="url(#topo-line)"
          strokeWidth="1.25"
          opacity="0.78"
        >
          <circle cx="0" cy="0" r="88" />
          <circle cx="0" cy="0" r="64" strokeDasharray="3 6" />
          <circle cx="0" cy="0" r="6" fill="#ffd166" fillOpacity="0.4" />
          <path
            d="M0 -104 L10 -14 L0 -26 L-10 -14 Z"
            fill="#ffd166"
            fillOpacity="0.26"
          />
          <path d="M0 104 L10 14 L0 26 L-10 14 Z" />
          <path d="M-104 0 L-14 -10 L-26 0 L-14 10 Z" />
          <path d="M104 0 L14 -10 L26 0 L14 10 Z" />
          <path d="M-58 -58 L58 58 M58 -58 L-58 58" opacity="0.45" />
        </g>

        {/* Силуэты дальних хребтов внизу в тонах ink-900 / ink-950 */}
        <path
          d="M0 870 L140 805 L270 845 L430 765 L590 830 L740 785 L910 840 L1080 760 L1250 825 L1420 770 L1600 820 L1600 1000 L0 1000 Z"
          fill="url(#ridge-back)"
        />
        <path
          d="M0 915 L180 865 L350 905 L530 845 L720 910 L890 860 L1070 905 L1270 840 L1450 890 L1600 855 L1600 1000 L0 1000 Z"
          fill="url(#ridge-front)"
        />
      </svg>

      {/* Светлячки LUMEN */}
      {MOTES.map((m, i) => (
        <span
          key={i}
          className="fx-mote"
          style={
            {
              left: m.left,
              top: m.top,
              width: `${m.size}px`,
              height: `${m.size}px`,
              ["--dur" as string]: `${m.dur}s`,
              ["--delay" as string]: `${m.delay}s`,
              background: m.color,
              color: m.color,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
