const toMin = (s) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(s ?? "").trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};

export function dhakaMinutes(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (t) => Number(parts.find((p) => p.type === t)?.value);
  return get("hour") * 60 + get("minute");
}

export const NIGHT = { phase: "night", sunX: null, sunY: null };
export function skyState(timings, now = new Date()) {
  const t = timings || {};
  const sunrise = toMin(t.Sunrise);
  const sunset = toMin(t.Sunset);
  if (sunrise == null || sunset == null || sunrise >= sunset) return NIGHT;

  const fajr = toMin(t.Fajr) ?? sunrise - 75;
  const asr = toMin(t.Asr) ?? Math.round(sunrise + (sunset - sunrise) * 0.68);
  const maghrib = toMin(t.Maghrib) ?? sunset;
  const isha = toMin(t.Isha) ?? maghrib + 75;

  // hand-typed times in the wrong order? use only sunrise/sunset
  const ordered =
    fajr < sunrise && sunrise < asr && asr < maghrib && maghrib < isha;
  const m = dhakaMinutes(now);

  let phase;
  if (ordered) {
    if (m >= fajr && m < sunrise) phase = "dawn";
    else if (m >= sunrise && m < asr) phase = "day";
    else if (m >= asr && m < maghrib) phase = "afternoon";
    else if (m >= maghrib && m < isha) phase = "sunset";
    else phase = "night";
  } else {
    phase = m >= sunrise && m < sunset ? "day" : "night";
  }

  let sunX = null;
  let sunY = null;
  if (m >= sunrise && m <= sunset) {
    const p = (m - sunrise) / (sunset - sunrise); // 0 at sunrise .. 1 at sunset
    sunX = Math.round((12 + 76 * p) * 10) / 10; // left -> right
    sunY = Math.round((60 - 48 * Math.sin(Math.PI * p)) * 10) / 10; // an arc, highest at noon
  }
  return { phase, sunX, sunY };
}

// "16:45" -> "4:45 PM"
export function fmt12(hhmm) {
  const m = toMin(hhmm);
  if (m == null) return "";
  const h = Math.floor(m / 60);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m % 60).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
