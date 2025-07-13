"use client";

import { useEffect, useState } from "react";
import { useSocket } from "../../lib/context/socket.context";

const GAME_OPTIONS = [
  { value: "pong_1v1", label: "PINGPONG 1 vs 1" },
  { value: "bong_1v1", label: "BINGBONG 1 vs 1" },
];

export default function QueueSelectorButton() {
  const { socket, connected } = useSocket();

  const [selectedGameMode, setSelectedGameMode] = useState("pong_1v1");
  const [activeGameMode, setActiveGameMode] = useState<string | null>(null);
  const isWaiting = activeGameMode === selectedGameMode;

  console.log("Socket ID:", socket?.id);
  console.log("Socket connected:", socket?.connected);

  useEffect(() => {
    if (!connected) return;

    socket!.once("match_found", (data: any) => {
      if (data.gameMode !== selectedGameMode) return;
      console.log("Match Found!:", data);
      setActiveGameMode(null);
    });
  }, [selectedGameMode, connected, socket]);

  const handleClick = () => {
    console.log("Sending via ChatProvider socket:", socket);

    if (!connected) return;

    if (isWaiting) {
      socket!.emit(
        "leave_queue",
        { gameMode: selectedGameMode },
        (response: { status: string }) => {
          console.log("Left queue response:", response.status === "ok");
          if (response?.status === "ok") {
            setActiveGameMode(null);
          }
        }
      );
    } else {
      if (activeGameMode && activeGameMode !== selectedGameMode) {
        socket!.emit(
          "leave_queue",
          { gameMode: activeGameMode },
          (response: { status: string }) => {
            console.log(
              "Left previous queue response:",
              response.status === "ok"
            );
          }
        );
      }

      socket!.emit(
        "join_queue",
        { gameMode: selectedGameMode },
        (response: { status: string }) => {
          console.log("Join queue response:", (response.status = "ok"));
          if (response?.status === "ok") {
            setActiveGameMode(selectedGameMode);
          }
        }
      );
    }
  };

  return (
    <div className="p-6 space-y-4">
      <select
        className="p-3 text-2xl rounded bg-neutral-900/70 text-neutral-300 font-bold transition-colors duration-300 hover:bg-neutral-900/50"
        value={selectedGameMode}
        onChange={(e) => setSelectedGameMode(e.target.value)}
        disabled={!!activeGameMode && !isWaiting}
      >
        {GAME_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <button
        onClick={handleClick}
        className={`p-3 w-full rounded-md text-2xl font-bold text-neutral-300 transition ${
          isWaiting
            ? "transition-colors duration-300 bg-rose-600/50 hover:bg-rose-600 hover:text-black"
            : "transition-colors duration-300 bg-blue-500/50 hover:bg-cyan-300/90 hover:text-black"
        }`}
      >
        {isWaiting ? "Cancel queue" : "Join queue"}
      </button>
    </div>
  );
}
