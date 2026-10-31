import HeroSky from "@/components/HeroSky";
import Skyline from "@/components/Skyline";

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

// Eid: bigger, faster sparkles
const STARS_EID = [
  ["14%", "22%", 15, 0.2],
  ["31%", "34%", 13, 1.0],
  ["52%", "16%", 16, 0.6],
  ["69%", "40%", 13, 1.5],
  ["88%", "28%", 15, 0.9],
  ["24%", "52%", 12, 1.9],
];

const HANGERS = [
  { kind: "lantern", x: "9%", w: 26, cord: 4, d: 0, t: 5.2, cls: "" },
  { kind: "star", x: "29%", w: 20, cord: 16, d: 0.6, t: 4.6, cls: "" },
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

// smaller set for page banners
const HANGERS_COMPACT = [
  { kind: "lantern", x: "8%", w: 20, cord: 2, d: 0, t: 5.2, cls: "" },
  {
    kind: "crescent",
    x: "50%",
    w: 18,
    cord: 8,
    d: 0.6,
    t: 4.8,
    cls: "hidden sm:block",
  },
  { kind: "lantern", x: "92%", w: 20, cord: 4, d: 0.4, t: 5.5, cls: "" },
];

// Ramadan / Eid: more lanterns
const HANGERS_FESTIVE = [
  { kind: "lantern", x: "19%", w: 22, cord: 12, d: 0.2, t: 5.0, cls: "" },
  {
    kind: "crescent",
    x: "39%",
    w: 20,
    cord: 22,
    d: 0.7,
    t: 4.7,
    cls: "hidden sm:block",
  },
  {
    kind: "lantern",
    x: "61%",
    w: 22,
    cord: 16,
    d: 0.4,
    t: 5.5,
    cls: "hidden sm:block",
  },
  { kind: "star", x: "81%", w: 18, cord: 10, d: 1.0, t: 4.4, cls: "" },
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

export default function HeroDecor({ variant = "hero", sky, timings, season }) {
  const compact = variant === "compact";
  const festive =
    season === "ramadan" || season === "eid-fitr" || season === "eid-adha";
  const eid = season === "eid-fitr" || season === "eid-adha";

  const hangers = compact
    ? HANGERS_COMPACT
    : festive
      ? [...HANGERS, ...HANGERS_FESTIVE]
      : HANGERS;
  const stars = compact ? STARS.slice(0, 7) : STARS;

  const art = (
    <>
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

      {/* moonlight + stars: they fade away in the daytime sky */}
      <div className="hd-night">
        <div className="hd-moonlight" />
        {stars.map(([left, top, size, delay], i) => (
          <span
            key={i}
            className="hd-star"
            style={{
              left,
              top,
              "--s": `${size}px`,
              animationDelay: `${delay}s`,
            }}
          />
        ))}
        {eid &&
          !compact &&
          STARS_EID.map(([left, top, size, delay], i) => (
            <span
              key={`e${i}`}
              className="hd-star hd-star-eid"
              style={{
                left,
                top,
                "--s": `${size}px`,
                animationDelay: `${delay}s`,
              }}
            />
          ))}
      </div>

      {hangers.map((h, i) => {
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
      <Skyline className="hd-skyline" hills={!compact} />
    </>
  );

  // the home page follows the real time of day; banners keep the night look
  if (!compact && sky) {
    return (
      <HeroSky initial={sky} timings={timings}>
        {art}
      </HeroSky>
    );
  }
  return (
    <div
      className={`hd-layer${compact ? " hd-compact" : ""}`}
      aria-hidden="true"
    >
      {art}
    </div>
  );
}
