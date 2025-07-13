"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useRef , useState} from "react";
import { useSearchParams, useRouter } from "next/navigation";
// import PhaserGame from "@/components/Game.backup";
import PhaserGame from "@/components/game/Game";
import { CANVAS_RES } from "@/components/game/Constantsts"; 
import { GameMode, useGameSocket } from "@/lib/context/game.context";

const Game = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const matchData = searchParams.get("matchData");

  const [decodedData, setDecodedData] = useState<{ matchId: string, gameMode: GameMode } | null>(null);
  const { connected, socket } = useGameSocket();
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<PhaserGame | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Decode match data from URL
  useEffect(() => {
    if (!matchData) {
      router.push("/");
      return;
    }
    if (matchData) {
      try {
        const decoded = JSON.parse(Buffer.from(matchData, 'base64').toString());
        setDecodedData(decoded);
      } catch (error) {
        console.error("Failed to decode match data:", error);
        router.push("/");
      }
    }
  }, [matchData, router]);

  // Step 2: Initialize the game when connection is ready
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!decodedData?.matchId || !decodedData?.gameMode || !connected || !socket || isJoining) return;

    console.log(`Game connection ready. Initializing Phaser with socket.`);
    setIsJoining(true);

    if (gameContainerRef.current && !gameRef.current) {
      try {
        // Pass matchId and gameMode to PhaserGame
        gameRef.current = new PhaserGame(
          gameContainerRef.current,
          socket,
          () => setIsLoaded(true),
          {
            matchId: decodedData.matchId,
            gameMode: decodedData.gameMode
          }
        );
        console.log("Phaser game initialized:", gameRef.current);
      } catch (err) {
        console.error("Error initializing game:", err);
        setError("Failed to initialize game");
      } finally {
        setIsJoining(false);
      }
    } else {
      console.warn("Game container or game instance already exists, or gameContainerRef is null.");
      setIsJoining(false);
    }

    return () => {
      console.log("Destroying Phaser game...");
      if (gameRef.current) {
        gameRef.current.destroy();
        console.log("Phaser game destroyed.");
      }
    };
  }, [decodedData, socket, connected]);

  // Component rendering...
  return (
    <div
      className="relative mx-auto"
      style={{
        width: `${CANVAS_RES.width}px`,
        height: `${CANVAS_RES.height}px`,
      }}
    >
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <span className="text-gray-500 animate-pulse">
            {!connected 
              ? "Connecting to game server..." 
              : error 
                ? `Error: ${error}` 
                : isJoining 
                  ? "Joining game..." 
                  : "Game loading..."}
          </span>
        </div>
      )}
      <div
        ref={gameContainerRef}
        className={isLoaded ? "opacity-100" : "opacity-0"}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};

export default Game;
