import { bn } from "@/lib/accountReport";

// ---- edit the text / colour / logo here ------------------------------------
export const LETTERHEAD = {
  name: "ইসলামপুর জামে মসজিদ",
  address: "দক্ষিণ চন্ডিপুর, ইসলামপুর, দাগনভূঞা, ফেনী।",
  established: "স্থাপিতঃ ১৯৪০ খ্রিঃ",
  color: "#1f2a6b",
  logoSrc: "/logo.jpg",
};
// -----------------------------------------------------------------------------

function MosqueMark({ color }) {
  return (
    <svg viewBox="0 0 130 100" width="92" height="71" aria-hidden="true">
      <g fill={color}>
        {/* ground */}
        <rect x="2" y="90" width="126" height="5" />
        {/* hall */}
        <rect x="32" y="62" width="66" height="28" />
        {/* main dome + finial */}
        <path d="M40 62 A25 25 0 0 1 90 62 Z" />
        <rect x="64" y="26" width="2" height="12" />
        <circle cx="65" cy="24" r="3" />
        {/* small side domes */}
        <path d="M33 64 A8 8 0 0 1 49 64 Z" />
        <path d="M81 64 A8 8 0 0 1 97 64 Z" />
        {/* left minaret */}
        <rect x="10" y="44" width="12" height="46" />
        <rect x="8" y="52" width="16" height="3" />
        <path d="M10 44 Q16 22 22 44 Z" />
        <rect x="15" y="22" width="2" height="14" />
        {/* right minaret */}
        <rect x="108" y="44" width="12" height="46" />
        <rect x="106" y="52" width="16" height="3" />
        <path d="M108 44 Q114 22 120 44 Z" />
        <rect x="113" y="22" width="2" height="14" />
      </g>
      {/* arched doors / windows */}
      <g fill="#fff">
        <path d="M58 90 V76 A7 7 0 0 1 72 76 V90 Z" />
        <path d="M38 90 V80 A4 4 0 0 1 46 80 V90 Z" />
        <path d="M84 90 V80 A4 4 0 0 1 92 80 V90 Z" />
        <rect x="13" y="62" width="6" height="12" rx="3" />
        <rect x="111" y="62" width="6" height="12" rx="3" />
      </g>
    </svg>
  );
}

export default function Letterhead({ refNo = "", dateYmd = "" }) {
  const { name, address, established, color, logoSrc } = LETTERHEAD;
  const [y, m, d] = (dateYmd || "").split("-");
  const dateText = y ? `${bn(d)}/${bn(m)}/${bn(y)} ইং` : "";
  const dotted = { borderBottom: `1.5px dotted ${color}` };

  return (
    <header className="mb-5" style={{ color }}>
      <div className="flex items-center gap-3">
        <div className="shrink-0">
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoSrc} alt="" width={92} className="object-contain" />
          ) : (
            <MosqueMark color={color} />
          )}
        </div>
        <div className="flex-1 min-w-0 text-center">
          <h1
            className="text-[40px] font-extrabold leading-tight"
            style={{ textShadow: "2px 2px 0 #cfd3e6" }}
          >
            {name}
          </h1>
          <p className="text-[12px] font-semibold leading-snug">{address}</p>
          <p className="text-[12px] font-semibold leading-snug">
            {established}
          </p>
        </div>
      </div>

      {/* double rule: thick + thin */}
      <div className="mt-2" style={{ borderTop: `3px solid ${color}` }} />
      <div className="mt-[2px]" style={{ borderTop: `1px solid ${color}` }} />

      <div className="flex items-end justify-between gap-4 mt-3 text-[12px] font-semibold">
        <span className="min-w-[160px]">
          সূত্রঃ{" "}
          <span className="inline-block min-w-[110px] px-1" style={dotted}>
            {refNo || "\u00A0"}
          </span>
        </span>
        <span>
          তারিখঃ{" "}
          <span
            className="inline-block min-w-[130px] px-1 text-center"
            style={dotted}
          >
            {dateText || "\u00A0"}
          </span>
        </span>
      </div>
    </header>
  );
}
