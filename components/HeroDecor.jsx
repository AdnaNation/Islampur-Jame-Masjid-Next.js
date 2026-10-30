// Decorative artwork for the home-page hero: a mosque skyline, hanging lanterns,
// twinkling stars and a slowly turning geometric pattern.
// It is pure SVG + CSS (see "Hero decorations" in app/globals.css): no JavaScript is
// sent to the browser, it never changes the page layout, and it is hidden from
// screen readers. All movement stops for people who turn on "reduce motion".

// [left, top, size px, twinkle delay s] - only the upper part of the hero
const STARS = [
  ["8%", "30%", 9, 0],
  ["18%", "14%", 7, 1.1],
  ["27%", "42%", 6, 2.1],
  ["36%", "10%", 10, 0.6],
  ["47%", "24%", 7, 1.7],
  ["58%", "8%", 8, 2.6],
  ["66%", "30%", 6, 0.3],
  ["74%", "12%", 11, 1.4],
  ["83%", "38%", 7, 2.3],
  ["90%", "20%", 9, 0.9],
  ["95%", "50%", 6, 1.9],
  ["4%", "58%", 7, 2.8],
];

// Hanging ornaments along the top edge. w = width in px (a little larger on desktop),
// cord = extra string length, d = start delay, t = swing time. Change x to move one.
const HANGERS = [
  { kind: "lantern", x: "9%", w: 26, cord: 4, d: 0, t: 7.2, cls: "" },
  { kind: "star", x: "29%", w: 20, cord: 16, d: 0.6, t: 5.6, cls: "" },
  {
    kind: "lantern",
    x: "50%",
    w: 32,
    cord: 2,
    d: 0.3,
    t: 5.8,
    cls: "hidden md:block",
  },
  { kind: "crescent", x: "71%", w: 22, cord: 12, d: 0.9, t: 4.9, cls: "" },
  { kind: "lantern", x: "91%", w: 26, cord: 6, d: 0.5, t: 5.4, cls: "" },
];

const CRESCENT = "M25.7 8A17 17 0 1 0 40.5 32A14.2 14.2 0 1 1 25.7 8Z";

function Lantern() {
  return (
    <svg
      viewBox="0 0 40 64"
      focusable="false"
      style={{ overflow: "visible", display: "block" }}
    >
      <circle
        cx="20"
        cy="2.4"
        r="2"
        fill="none"
        stroke="#c9a24b"
        strokeWidth="1"
      />
      <path d="M20 4.4V9" stroke="#c9a24b" strokeWidth="1" />
      <circle
        cx="20"
        cy="33"
        r="23"
        fill="url(#hd-lglow)"
        className="hd-flame"
      />
      <path d="M10 20Q10 11 20 9Q30 11 30 20Z" fill="#c9a24b" />
      <rect x="9" y="20" width="22" height="2.6" rx="1" fill="#a97d2a" />
      <path
        d="M10.5 22.6H29.5L32 42Q20 49 8 42Z"
        fill="url(#hd-lg)"
        stroke="#c9a24b"
        strokeWidth="1"
      />
      <path
        d="M20 22.6V46M14.6 22.6L12 44M25.4 22.6L28 44"
        stroke="#a97d2a"
        strokeWidth=".8"
        fill="none"
      />
      <path d="M12 46H28L24.6 52H15.4Z" fill="#c9a24b" />
      <path d="M20 52V58" stroke="#c9a24b" strokeWidth="1" />
      <circle cx="20" cy="60.6" r="2.6" fill="#c9a24b" />
    </svg>
  );
}

function StarOrnament() {
  return (
    <svg viewBox="0 0 40 46" focusable="false" style={{ display: "block" }}>
      <polygon
        points="20.0,11.0 23.1,19.4 31.3,15.7 27.6,23.9 36.0,27.0 27.6,30.1 31.3,38.3 23.1,34.6 20.0,43.0 16.9,34.6 8.7,38.3 12.4,30.1 4.0,27.0 12.4,23.9 8.7,15.7 16.9,19.4"
        fill="#e8c97a"
      />
      <circle cx="20" cy="27" r="4.5" fill="#0f3d2e" fillOpacity=".55" />
    </svg>
  );
}

function CrescentOrnament() {
  return (
    <svg viewBox="0 0 40 46" focusable="false" style={{ display: "block" }}>
      <path d={CRESCENT} fill="#f3d98b" />
      <polygon
        points="33.5,15.1 34.9,18.6 38.6,18.8 35.7,21.2 36.7,24.9 33.5,22.8 30.3,24.9 31.3,21.2 28.4,18.8 32.1,18.6"
        fill="#f3d98b"
      />
    </svg>
  );
}

const ORNAMENT = {
  lantern: Lantern,
  star: StarOrnament,
  crescent: CrescentOrnament,
};

// small crescent on top of a dome / minaret
const Finial = ({ x, y, k }) => (
  <path d={CRESCENT} transform={`translate(${x} ${y}) scale(${k})`} />
);

// a lit window that flickers (delay in seconds)
const Win = ({ d, delay = 0 }) => (
  <path
    d={d}
    fill="#ffd978"
    className="hd-window"
    style={{ animationDelay: `${delay}s` }}
  />
);

function Minaret({ cx }) {
  return (
    <>
      <rect x={cx - 9} y="70" width="18" height="118" />
      <rect x={cx - 15} y="92" width="30" height="5" />
      <rect x={cx - 14} y="128" width="28" height="4" />
      <path d={`M${cx - 11} 70L${cx} 40L${cx + 11} 70Z`} />
      <rect x={cx - 0.8} y="26" width="1.6" height="16" />
      <Finial x={cx - 9.6} y={12} k={0.4} />
      <rect
        x={cx - 1.5}
        y="106"
        width="3"
        height="14"
        fill="#ffd978"
        className="hd-window"
      />
      <rect
        x={cx - 1.5}
        y="142"
        width="3"
        height="14"
        fill="#ffd978"
        className="hd-window"
      />
    </>
  );
}

export default function HeroDecor() {
  return (
    <div className="hd-layer" aria-hidden="true">
      {/* shared gradients + the pattern tile (zero size, never drawn by itself) */}
      <svg
        width="0"
        height="0"
        focusable="false"
        style={{ position: "absolute" }}
      >
        <defs>
          <linearGradient id="hd-lg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffe9a8" />
            <stop offset="1" stopColor="#f0a93b" />
          </linearGradient>
          <radialGradient id="hd-lglow">
            <stop offset="0" stopColor="#ffd978" stopOpacity=".6" />
            <stop offset="1" stopColor="#ffd978" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="hd-hill" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#0b3a2a" stopOpacity="0" />
            <stop offset=".18" stopColor="#0b3a2a" stopOpacity=".8" />
            <stop offset=".82" stopColor="#0b3a2a" stopOpacity=".8" />
            <stop offset="1" stopColor="#0b3a2a" stopOpacity="0" />
          </linearGradient>
          <pattern
            id="hd-khatam"
            width="80"
            height="80"
            patternUnits="userSpaceOnUse"
          >
            <g fill="none" stroke="#e8c97a" strokeWidth="1">
              <rect x="20" y="20" width="40" height="40" />
              <rect
                x="20"
                y="20"
                width="40"
                height="40"
                transform="rotate(45 40 40)"
              />
              <circle cx="40" cy="40" r="7" />
              <path d="M0 0L12 12M80 0L68 12M0 80L12 68M80 80L68 68" />
            </g>
          </pattern>
        </defs>
      </svg>

      {/* slowly turning geometric pattern */}
      <div className="hd-pattern">
        <svg
          width="1500"
          height="1500"
          viewBox="0 0 1500 1500"
          focusable="false"
        >
          <rect width="1500" height="1500" fill="url(#hd-khatam)" />
        </svg>
      </div>

      <div className="hd-moonlight" />

      {STARS.map(([left, top, size, delay], i) => (
        <span
          key={i}
          className="hd-star"
          style={{ left, top, "--s": `${size}px`, animationDelay: `${delay}s` }}
        />
      ))}

      {HANGERS.map((h, i) => {
        const Ornament = ORNAMENT[h.kind];
        return (
          <div
            key={i}
            className={`absolute top-0 -translate-x-1/2 ${h.cls}`}
            style={{ left: h.x, "--w": `${h.w}px` }}
          >
            <div
              className="hd-hang hd-sway"
              style={{
                animationDelay: `${h.d}s`,
                animationDuration: `${h.t}s`,
              }}
            >
              <i className="hd-cord" style={{ height: h.cord }} />
              <Ornament />
            </div>
          </div>
        );
      })}

      {/* mosque skyline: flat ground fills any extra width, the mosque stays centred */}
      <div className="hd-ground" />
      <svg className="hd-skyline" viewBox="0 0 1400 210" focusable="false">
        <path
          d="M0 160C180 140 320 170 560 152C760 136 900 168 1100 150C1250 140 1330 156 1400 150V210H0Z"
          fill="url(#hd-hill)"
        />
        <g fill="#071f16" fillOpacity=".92">
          <rect x="0" y="186" width="1400" height="24" />
          {/* main hall and dome */}
          <rect x="590" y="128" width="220" height="60" />
          <path d="M600 128C600 82 645 56 700 56C755 56 800 82 800 128Z" />
          <rect x="699.2" y="34" width="1.6" height="24" />
          <Finial x={688.8} y={16.3} k={0.467} />
          {/* side domes */}
          <rect x="520" y="140" width="70" height="48" />
          <path d="M520 140C520 118 540 108 555 108C570 108 590 118 590 140Z" />
          <rect x="810" y="140" width="70" height="48" />
          <path d="M810 140C810 118 830 108 845 108C860 108 880 118 880 140Z" />
          {/* minarets */}
          <Minaret cx={470} />
          <Minaret cx={930} />
          {/* lower buildings on both sides */}
          <rect x="230" y="152" width="210" height="36" />
          <path d="M299 152C299 137.7 316.4 126 330 126C343.6 126 361 137.7 361 152Z" />
          <rect x="960" y="152" width="210" height="36" />
          <path d="M1039 152C1039 137.7 1056.4 126 1070 126C1083.6 126 1101 137.7 1101 152Z" />
          <rect x="150" y="166" width="70" height="22" />
          <rect x="1180" y="166" width="70" height="22" />
          <rect x="60" y="172" width="80" height="16" />
          <rect x="1260" y="172" width="80" height="16" />
        </g>

        {/* lit windows (they flicker softly) */}
        <Win d="M610 172V152A6 6 0 0 1 622 152V172Z" delay={0} />
        <Win d="M634 172V152A6 6 0 0 1 646 152V172Z" delay={1.2} />
        <Win d="M658 172V152A6 6 0 0 1 670 152V172Z" delay={0.6} />
        <Win d="M730 172V152A6 6 0 0 1 742 152V172Z" delay={0.9} />
        <Win d="M754 172V152A6 6 0 0 1 766 152V172Z" delay={0.3} />
        <Win d="M778 172V152A6 6 0 0 1 790 152V172Z" delay={1.5} />
        <Win d="M684 188V166A16 16 0 0 1 716 166V188Z" delay={0.4} />
        <Win d="M536 180V163A5 5 0 0 1 546 163V180Z" delay={0.7} />
        <Win d="M554 180V163A5 5 0 0 1 564 163V180Z" delay={1.4} />
        <Win d="M836 180V163A5 5 0 0 1 846 163V180Z" delay={0.2} />
        <Win d="M854 180V163A5 5 0 0 1 864 163V180Z" delay={1.1} />
      </svg>
    </div>
  );
}
