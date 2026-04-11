"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useRefresh } from "@/context/RefreshContext";

const PULL_THRESHOLD = 64; // px to pull before release triggers refresh

export function PullToRefresh() {
  const { triggerRefresh } = useRefresh();
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef<number | null>(null);
  const pullingRef = useRef(false);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startYRef.current = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (startYRef.current === null || isRefreshing) return;
      const delta = e.touches[0].clientY - startYRef.current;
      if (delta > 0 && window.scrollY === 0) {
        pullingRef.current = true;
        // Dampen the pull so it feels resistive
        setPullDistance(Math.min(delta * 0.4, PULL_THRESHOLD + 16));
      }
    };

    const onTouchEnd = () => {
      if (pullingRef.current && pullDistance >= PULL_THRESHOLD * 0.4) {
        setIsRefreshing(true);
        setPullDistance(PULL_THRESHOLD * 0.4);
        triggerRefresh();
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
        }, 800);
      } else {
        setPullDistance(0);
      }
      startYRef.current = null;
      pullingRef.current = false;
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [pullDistance, isRefreshing, triggerRefresh]);

  if (pullDistance === 0 && !isRefreshing) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
      style={{ transform: `translateY(${pullDistance - 40}px)`, transition: isRefreshing ? "transform 0.2s ease" : undefined }}
    >
      <div className="bg-background border border-border rounded-full p-2 shadow-md">
        <Loader2
          className="h-5 w-5 text-primary"
          style={{ animation: isRefreshing ? "spin 0.8s linear infinite" : undefined }}
        />
      </div>
    </div>
  );
}
