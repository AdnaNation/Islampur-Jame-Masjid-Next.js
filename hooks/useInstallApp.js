"use client";

import { useCallback, useEffect, useState } from "react";

const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches ||
  window.navigator.standalone === true; // iPhone

export default function useInstallApp() {
  const [ready, setReady] = useState(false);
  const [canPrompt, setCanPrompt] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());
    setIos(
      /iphone|ipad|ipod/i.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1),
    );

    setCanPrompt(!!window.__installPrompt);
    setReady(true);

    const onReady = () => setCanPrompt(!!window.__installPrompt);
    const onDone = () => {
      setInstalled(true);
      setCanPrompt(false);
    };
    window.addEventListener("installpromptready", onReady);
    window.addEventListener("installdone", onDone);
    return () => {
      window.removeEventListener("installpromptready", onReady);
      window.removeEventListener("installdone", onDone);
    };
  }, []);

  const install = useCallback(async () => {
    const evt = window.__installPrompt;
    if (!evt) return "manual";
    evt.prompt();
    const choice = await evt.userChoice.catch(() => ({}));
    window.__installPrompt = null;
    setCanPrompt(false);
    return choice.outcome || "dismissed";
  }, []);

  return { ready, canPrompt, installed, ios, install };
}
