"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";

const AUTOPLAY_MS = 4000;

export default function HeroSlider({ images = [] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef(null);
  const count = images.length;

  const go = (i) => setIndex(((i % count) + count) % count);

  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [count, paused, index]);

  if (count === 0) return null;

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    setPaused(true);
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current !== null) {
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
    }
    touchStartX.current = null;
    setPaused(false);
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl aspect-[4/3]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="flex h-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {images.map((img, i) => (
          <div key={img.src} className="relative w-full h-full shrink-0">
            <Image
              src={img.src}
              alt={img.alt || ""}
              fill
              sizes="(min-width: 768px) 480px, 100vw"
              priority={i === 0}
              loading={i === 0 ? "eager" : "lazy"}
              className="object-cover"
            />
            {img.caption && (
              <p className="absolute inset-x-0 bottom-0 px-4 pt-8 pb-8 text-sm font-medium text-white bg-gradient-to-t from-black/70 to-transparent">
                {img.caption}
              </p>
            )}
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="আগের ছবি"
            onClick={() => go(index - 1)}
            className="absolute left-2 top-1/2 flex items-center justify-center w-9 h-9 text-2xl text-white -translate-y-1/2 rounded-full bg-black/30 hover:bg-black/50"
          >
            <MdChevronLeft />
          </button>
          <button
            type="button"
            aria-label="পরের ছবি"
            onClick={() => go(index + 1)}
            className="absolute right-2 top-1/2 flex items-center justify-center w-9 h-9 text-2xl text-white -translate-y-1/2 rounded-full bg-black/30 hover:bg-black/50"
          >
            <MdChevronRight />
          </button>

          <div className="absolute inset-x-0 flex justify-center gap-1.5 bottom-3">
            {images.map((img, i) => (
              <button
                key={img.src}
                type="button"
                aria-label={`ছবি ${i + 1}`}
                aria-current={i === index}
                onClick={() => go(i)}
                className={`h-2 rounded-full transition-all ${
                  i === index ? "w-5 bg-white" : "w-2 bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
