"use client";

import { useEffect, useState } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";

/** Simple classnames helper */
function cn(...args) {
  return args.filter(Boolean).join(" ");
}

/** Random noise generator */
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
function generateRandomString(length) {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return result;
}

const HoverGlowBackground = ({
  className,
  mousePosition,
  active = false,
  showTextNoise = true,
  showCursorText = true,
  cursorText = "Markify – Smarter Way to Save & Organize",
  centerFollowContent = null,
  parallaxFactor = 0.05,
  glowRadius = 180,
  spring = { stiffness: 200, damping: 30, mass: 0.6 },
  children,
}) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, spring);
  const smoothY = useSpring(mouseY, spring);

  const [noise, setNoise] = useState("");
  const [vw, setVw] = useState(0);
  const [vh, setVh] = useState(0);

  useEffect(() => {
    setNoise(generateRandomString(1500));
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setVw(window.innerWidth);
      setVh(window.innerHeight);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!mousePosition) return;
    mouseX.set(mousePosition.x);
    mouseY.set(mousePosition.y);
    setNoise(generateRandomString(1500));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mousePosition?.x, mousePosition?.y]);

  function onMouseMove(e) {
    if (mousePosition) return;
    const { left, top } = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
    setNoise(generateRandomString(1500));
  }

  const maskImage = useMotionTemplate`radial-gradient(${glowRadius}px at ${smoothX}px ${smoothY}px, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.5) 50%, transparent 75%)`;
  const maskStyle = { maskImage, WebkitMaskImage: maskImage };

  const isActive = active || Boolean(mousePosition);

  // Parallax offset for centered content
  const parallaxX = useTransform(smoothX, (v) =>
    vw ? (v - vw / 2) * parallaxFactor : 0
  );
  const parallaxY = useTransform(smoothY, (v) =>
    vh ? (v - vh / 2) * parallaxFactor : 0
  );

  return (
    <div
      onMouseMove={onMouseMove}
      className={cn(
        "fixed inset-0 w-screen h-screen overflow-hidden",
        "bg-gradient-to-br from-[#1b1300] via-[#231700] to-[#2e1e00]",
        "rounded-none",
        className
      )}
    >
      {/* Base layer */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0",
          "bg-gradient-to-b from-yellow-200/15 to-transparent",
          "transition-opacity duration-500",
          isActive ? "opacity-60" : "opacity-25"
        )}
      />

      {/* Soft glow following cursor */}
      <motion.div
        className={cn(
          "pointer-events-none absolute inset-0",
          "bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400",
          "backdrop-blur-md transition duration-500",
          isActive ? "opacity-90" : "opacity-0"
        )}
        style={maskStyle}
      />

      {/* Optional noise overlay */}
      {showTextNoise && (
        <motion.div
          className={cn(
            "pointer-events-none absolute inset-0 mix-blend-overlay transition duration-500",
            isActive ? "opacity-70" : "opacity-0"
          )}
          style={maskStyle}
        >
          <p className="absolute inset-x-0 text-[10px] leading-5 h-full break-words whitespace-pre-wrap text-yellow-100/70 font-mono font-bold">
            {noise}
          </p>
        </motion.div>
      )}

      {/* Floating label that follows cursor */}
      {showCursorText && (
        <motion.div
          className="pointer-events-none absolute left-0 top-0 z-20"
          style={{ x: smoothX, y: smoothY }}
        >
          <div className="transform -translate-x-1/2 -translate-y-1/2">
            <div className="px-4 py-2 rounded-full bg-amber-200/85 text-amber-900 text-sm md:text-base font-semibold shadow-md backdrop-blur-sm">
              {cursorText}
            </div>
          </div>
        </motion.div>
      )}

      {/* Center-following main content */}
      {centerFollowContent && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-4 text-center"
          style={{ x: parallaxX, y: parallaxY }}
        >
          <div className="pointer-events-auto">{centerFollowContent}</div>
        </motion.div>
      )}

      {/* Any extra children */}
      {children && <div className="relative z-10">{children}</div>}
    </div>
  );
};

export default HoverGlowBackground;
