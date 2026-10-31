const CRESCENT = "M25.7 8A17 17 0 1 0 40.5 32A14.2 14.2 0 1 1 25.7 8Z";

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

export default function Skyline({
  color = "#071f16",
  fillOpacity = 0.92,
  hills = false,
  lit = true,
  className = "",
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 1400 210"
      focusable="false"
      aria-hidden="true"
    >
      {hills && (
        <>
          <defs>
            <linearGradient id="hd-hill" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#0b3a2a" stopOpacity="0" />
              <stop offset=".18" stopColor="#0b3a2a" stopOpacity=".8" />
              <stop offset=".82" stopColor="#0b3a2a" stopOpacity=".8" />
              <stop offset="1" stopColor="#0b3a2a" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0 160C180 140 320 170 560 152C760 136 900 168 1100 150C1250 140 1330 156 1400 150V210H0Z"
            fill="url(#hd-hill)"
          />
        </>
      )}
      <g fill={color} fillOpacity={fillOpacity}>
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

      {lit && (
        <>
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
        </>
      )}
    </svg>
  );
}
