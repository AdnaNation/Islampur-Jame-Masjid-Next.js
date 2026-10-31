import { fmt12 } from "@/lib/sky";

const Crescent = () => (
  <svg
    viewBox="0 0 48 48"
    width="14"
    height="14"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M25.7 6A18 18 0 1 0 42 33A15 15 0 1 1 25.7 6Z"
      fill="currentColor"
    />
  </svg>
);

export default function SeasonRibbon({ season, timings }) {
  if (!season) return null;

  let title = "জুমআ মুবারক";
  let note = timings?.Jummah ? `জামাআত ${fmt12(timings.Jummah)}` : "";
  let href = "";

  if (season === "ramadan") {
    title = "রমজান মুবারক";
    note = "সময়সূচি দেখুন";
    href = "#salat"; // jumps to the prayer-times card
  } else if (season === "eid-fitr" || season === "eid-adha") {
    title = "ঈদ মুবারক";
    note = "";
  }

  const body = (
    <>
      <Crescent />
      <b>{title}</b>
      {note && <span className="opacity-80">· {note}</span>}
    </>
  );

  return (
    <p className="mb-3 text-center hd-in md:text-left" style={{ "--d": "0s" }}>
      {href ? (
        <a href={href} className="hd-ribbon">
          {body}
        </a>
      ) : (
        <span className="hd-ribbon">{body}</span>
      )}
    </p>
  );
}
