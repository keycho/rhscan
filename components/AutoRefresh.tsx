"use client";

// re-runs the current route's server render after a short delay, used while a
// token's holder snapshot is still building. router.refresh() re-triggers the
// server component (and its on-view hydration) without a full page reload or
// losing scroll position.

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AutoRefresh({ seconds = 4 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setTimeout(() => router.refresh(), seconds * 1000);
    return () => clearTimeout(id);
  }, [router, seconds]);
  return null;
}
