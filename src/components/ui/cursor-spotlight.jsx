"use client";

import { useEffect } from "react";

const CursorSpotlight = () => {
  useEffect(() => {
    const root = document.documentElement;

    const setVar = (name, value) => root.style.setProperty(name, value);
    setVar("--cursor-size", "320px");
    setVar("--cursor-opacity", "0");
    setVar("--cursor-x", "50%");
    setVar("--cursor-y", "50%");

    let raf = 0;
    let lastX = window.innerWidth / 2;
    let lastY = window.innerHeight / 2;

    const updatePosition = () => {
      setVar("--cursor-x", `${lastX}px`);
      setVar("--cursor-y", `${lastY}px`);
      raf = 0;
    };

    const onMove = (event) => {
      lastX = event.clientX;
      lastY = event.clientY;
      if (!raf) raf = requestAnimationFrame(updatePosition);
      setVar("--cursor-opacity", "1");
    };

    const onEnter = () => setVar("--cursor-opacity", "1");
    const onLeave = () => setVar("--cursor-opacity", "0");

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerenter", onEnter);
    document.addEventListener("pointerleave", onLeave);

    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerenter", onEnter);
      document.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="cursor-spotlight"
      style={{ opacity: "var(--cursor-opacity)", pointerEvents: "none" }}
    />
  );
};

export default CursorSpotlight;
