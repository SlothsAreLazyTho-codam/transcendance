"use client";

import GameSocketProvider from "@/lib/context/game.context";

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GameSocketProvider>
      {children}
    </GameSocketProvider>
  );
}
