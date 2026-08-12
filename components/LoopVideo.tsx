"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";

// Muted, looping ambient video — same lazy-on-scroll pattern the rest of
// this codebase uses for image sections (see FeaturedSpotlight,
// OperationsSection, etc.), applied to <video> instead of motion.div: the
// src is only attached once the element is within 200px of the viewport,
// so a video placed low on a long page (e.g. the product page) doesn't
// start downloading on initial load.
export default function LoopVideo({
  src,
  className = "",
}: {
  src: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const inView = useInView(ref, { once: true, margin: "200px" });

  return (
    <video
      ref={ref}
      src={inView ? src : undefined}
      autoPlay={inView}
      muted
      loop
      playsInline
      preload="none"
      className={className}
    />
  );
}
