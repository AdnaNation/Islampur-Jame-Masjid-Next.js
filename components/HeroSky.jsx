"use client";

import { useEffect, useState } from "react";
import { skyState } from "@/lib/sky";

export default function HeroSky({ initial, timings, children }) {
  const [sky, setSky] = useState(initial);

  useEffect(() => {
    const tick = () =>
      setSky((prev) => {
        const next = skyState(timings);
        return next.phase === prev.phase &&
          next.sunX === prev.sunX &&
          next.sunY === prev.sunY
          ? prev
          : next;
      });
    tick(); // the page may be hours old: correct it straight away
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [timings]);

  const style =
    sky.sunX == null ? undefined : { "--sun-x": sky.sunX, "--sun-y": sky.sunY };

  return (
    <div
      className="hd-layer"
      aria-hidden="true"
      data-sky={sky.phase}
      style={style}
    >
      {/* sky colours: faded in/out with CSS, "night" is the normal green background */}
      <div className="sky-fx sky-dawn" />
      <div className="sky-fx sky-day" />
      <div className="sky-fx sky-afternoon" />
      <div className="sky-fx sky-sunset" />
      {sky.sunX != null && <span className="hd-sun" />}
      {children}
    </div>
  );
}
