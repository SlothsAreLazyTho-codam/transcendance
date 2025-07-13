"use client";

import { useEffect, useState } from "react";

export default function ColorEqualizer() {
  const gradients = [
    "from-red-400 to-red-500",
    "from-orange-400 to-orange-500",
    "from-amber-400 to-amber-500",
    "from-yellow-400 to-yellow-500",
    "from-lime-400 to-lime-500",
    "from-green-400 to-green-500",
    "from-emerald-400 to-emerald-500",
    "from-teal-400 to-teal-500",
    "from-cyan-400 to-cyan-500",
    "from-sky-400 to-sky-500",
    "from-blue-400 to-blue-500",
    "from-indigo-400 to-indigo-500",
    "from-violet-400 to-violet-500",
    "from-fuchsia-400 to-fuchsia-500",
    "from-pink-400 to-pink-500",
  ];

  const barWidthVW = 6.6;
  const [bars, setBars] = useState<{ grad: string; height: number }[]>([]);

  useEffect(() => {
    const barCount = Math.floor(100 / barWidthVW);
    const generated = Array.from({ length: barCount }, (_, i) => ({
      grad: gradients[i % gradients.length],
      height: 60,
    }));
    setBars(generated);

    const handleMouseMove = (e: MouseEvent) => {
      const vwX = (e.clientX / window.innerWidth) * 100;
      const index = Math.floor(vwX / barWidthVW);

      setBars((prev) =>
        prev.map((bar, i) => {
          const distance = Math.abs(i - index);
          const newHeight = Math.max(60, 200 - distance * 30);
          return { ...bar, height: newHeight };
        })
      );
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="fixed bottom-0 w-full h-screen z-0 pointer-events-none">
      <div className="w-full h-full flex justify-center items-end gap-[1px] py-1">
        {bars.map((bar, i) => (
          <div
            key={i}
            className={`transition-all duration-300 neon-border bg-gradient-to-t ${bar.grad}`}
            style={{
              width: `${barWidthVW}vw`,
              height: `${bar.height}px`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
