const LABEL = "লোড হচ্ছে";

/* ───────────── small pieces ───────────── */

export const Spinner = ({ size = 16, className = "" }) => (
  <span
    role="status"
    aria-label={LABEL}
    style={{ width: size, height: size }}
    className={`inline-block shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
  />
);

export const DotsLoader = ({ className = "" }) => (
  <span
    role="status"
    aria-label={LABEL}
    className={`inline-flex items-end gap-1 ${className}`}
  >
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        style={{ animationDelay: `${i * 0.15}s` }}
        className="h-1.5 w-1.5 animate-bounce rounded-full bg-current"
      />
    ))}
  </span>
);

export const InlineLoader = ({ label = `${LABEL}...`, className = "" }) => (
  <span className={`inline-flex items-center gap-2 text-gray-400 ${className}`}>
    <Spinner size={14} />
    <span>{label}</span>
  </span>
);

export const BtnLoading = ({ text }) => (
  <span className="inline-flex items-center justify-center gap-2">
    <Spinner size={14} />
    {text}
  </span>
);

/* ───────────── brand loader (crescent + orbit ring) ───────────── */

export const CrescentLoader = ({ size = 72 }) => (
  <span
    role="status"
    aria-label={LABEL}
    className="relative inline-flex items-center justify-center"
    style={{ width: size, height: size }}
  >
    <span className="absolute inset-0 rounded-full border-[3px] border-emerald-100" />
    <span className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#0f3d2e] border-r-[#2f7d57] animate-spin" />
    <svg
      viewBox="0 0 24 24"
      width={size * 0.44}
      height={size * 0.44}
      className="loader-moon"
      fill="#0f3d2e"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
    <svg
      viewBox="0 0 24 24"
      width={size * 0.2}
      height={size * 0.2}
      className="absolute loader-star"
      style={{ top: size * 0.2, right: size * 0.2 }}
      fill="#c9a24b"
      aria-hidden="true"
    >
      <path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z" />
    </svg>
  </span>
);

export const PageLoader = ({ label = LABEL, className = "" }) => (
  <div
    className={`flex min-h-[60vh] flex-col items-center justify-center gap-4 print:hidden ${className}`}
  >
    <CrescentLoader size={76} />
    <div className="flex items-center gap-2 text-sm font-medium text-[#0f3d2e]">
      <span>{label}</span>
      <DotsLoader />
    </div>
  </div>
);

export const SectionLoader = ({
  label = `${LABEL}...`,
  progress = true,
  className = "",
}) => (
  <div
    className={`flex flex-col items-center justify-center gap-3 py-8 text-center print:hidden ${className}`}
  >
    <CrescentLoader size={44} />
    <p className="text-sm text-slate-500">{label}</p>
    {progress && (
      <span className="relative h-1 overflow-hidden rounded-full w-28 bg-emerald-100">
        <span className="loader-bar absolute inset-y-0 left-0 w-1/3 rounded-full bg-[#2f7d57]" />
      </span>
    )}
  </div>
);

/* ───────────── skeleton primitive + presets ───────────── */

export const Sk = ({ className = "" }) => (
  <div aria-hidden="true" className={`sk ${className}`} />
);

const SkWrap = ({ children, className = "" }) => (
  <div role="status" aria-label={LABEL} className={`print:hidden ${className}`}>
    {children}
  </div>
);

export const PrayerTimesSkeleton = () => (
  <SkWrap>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col items-center gap-2 p-4 border rounded-xl border-stone-200 bg-stone-50"
        >
          <Sk className="h-8 w-8 !rounded-full" />
          <Sk className="h-4 w-14" />
          <Sk className="w-20 h-5" />
        </div>
      ))}
    </div>
  </SkWrap>
);

export const QuranSkeleton = () => (
  <SkWrap className="space-y-3">
    <Sk className="w-40 h-6 mx-auto" />
    <Sk className="w-full h-5" />
    <Sk className="w-11/12 h-5" />
    <Sk className="w-full h-5" />
    <Sk className="w-2/3 h-5" />
    <Sk className="w-5/6 h-5" />
  </SkWrap>
);

export const HistorySkeleton = ({ groups = 2, rows = 3 }) => (
  <SkWrap className="space-y-3">
    {Array.from({ length: groups }).map((_, g) => (
      <div key={g} className="overflow-hidden border rounded-lg">
        <div className="flex items-center justify-between px-3 py-2 bg-gray-100">
          <Sk className="w-12 h-4" />
          <Sk className="w-20 h-4" />
        </div>
        <div className="divide-y">
          {Array.from({ length: rows }).map((_, r) => (
            <div
              key={r}
              className="flex items-start justify-between gap-3 px-3 py-2.5"
            >
              <div className="flex-1 space-y-1.5">
                <Sk className="h-3.5 w-1/2" />
                <Sk className="w-1/3 h-3" />
              </div>
              <Sk className="w-10 h-4" />
            </div>
          ))}
        </div>
      </div>
    ))}
  </SkWrap>
);

export const CardListSkeleton = ({ count = 4 }) => (
  <SkWrap className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-3 p-3 bg-white border rounded-lg shadow-sm"
      >
        <Sk className="h-10 w-10 shrink-0 !rounded-full" />
        <div className="flex-1 space-y-2">
          <Sk className="w-2/5 h-4" />
          <Sk className="w-3/5 h-3" />
        </div>
        <Sk className="h-6 w-14 !rounded-full" />
      </div>
    ))}
  </SkWrap>
);

export const EntryListSkeleton = ({ count = 6 }) => (
  <SkWrap className="space-y-2">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="flex items-start gap-3 p-3 bg-white border rounded-xl border-slate-200"
      >
        <Sk className="mt-0.5 h-10 w-1.5 shrink-0 !rounded-full" />
        <div className="flex-1 space-y-2">
          <Sk className="w-1/3 h-4" />
          <Sk className="w-2/3 h-3" />
          <Sk className="w-1/4 h-3" />
        </div>
        <div className="space-y-2">
          <Sk className="w-16 h-4 ml-auto" />
          <Sk className="w-10 h-3 ml-auto" />
        </div>
      </div>
    ))}
  </SkWrap>
);

/** Use inside <tbody>. */
export const TableRowsSkeleton = ({ rows = 5, cols = 4 }) =>
  Array.from({ length: rows }).map((_, r) => (
    <tr key={r} aria-hidden="true">
      {Array.from({ length: cols }).map((_, c) => (
        <td key={c}>
          <Sk className="h-4 w-full max-w-[7rem]" />
        </td>
      ))}
    </tr>
  ));

export const ChatListSkeleton = ({ count = 7 }) => (
  <SkWrap>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-3 px-3 py-3 border-b border-slate-100"
      >
        <Sk className="h-11 w-11 shrink-0 !rounded-full" />
        <div className="flex-1 space-y-2">
          <Sk className="w-1/2 h-4" />
          <Sk className="w-4/5 h-3" />
        </div>
        <Sk className="w-8 h-3" />
      </div>
    ))}
  </SkWrap>
);

export const ChatThreadSkeleton = () => (
  <SkWrap className="p-2 space-y-3">
    {[
      ["w-3/5", false],
      ["w-2/5", true],
      ["w-1/2", false],
      ["w-3/5", true],
      ["w-2/5", false],
    ].map(([w, mine], i) => (
      <div key={i} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
        <Sk className={`h-10 ${w} !rounded-2xl`} />
      </div>
    ))}
  </SkWrap>
);

export const ReportSkeleton = () => (
  <SkWrap className="max-w-3xl p-5 mx-auto space-y-4 bg-white border rounded-xl">
    <Sk className="w-1/2 h-6 mx-auto" />
    <Sk className="w-1/3 h-3 mx-auto" />
    <div className="pt-3 space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Sk className="w-1/6 h-4" />
          <Sk className="flex-1 h-4" />
          <Sk className="w-1/6 h-4" />
        </div>
      ))}
    </div>
  </SkWrap>
);
