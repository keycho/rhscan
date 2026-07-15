"use client";

// overlays a curated token logo on top of the generated monogram. a plain <img>
// (not next/image) so there is no server-side optimization fetch — the browser
// lazy-loads it with zero added render latency. on any load failure it removes
// itself, revealing the monogram underneath. only rendered for tokens that have a
// curated logo, so memecoins add no client component at all.

import { useState } from "react";

export function TokenLogoImg({ src, alt = "" }: { src: string; alt?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="absolute inset-0 h-full w-full rounded-full bg-white object-cover"
    />
  );
}
