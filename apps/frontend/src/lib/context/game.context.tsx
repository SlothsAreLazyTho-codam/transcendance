//CodeOwner: @nikander100

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "@/lib/context/auth.context";
import { io, Socket } from "socket.io-client";

// Game-specific types matching your gateway implementation
export type PlayerRole = "player1" | "player2";

export type GameState = {
  ball: { x: number; y: number; vx: number; vy: number };
  paddles: { player1: { y: number }; player2: { y: number } };
  scores: { player1: number; player2: number };
};

export enum GameMode {
  CLASSIC = 'CLASSIC',
  SPECIAL = 'SPECIAL'
}

// Interface for the game socket context
interface GameSocketContextType {
  socket?: Socket;
  connected: boolean;
  playerRole: PlayerRole | undefined;
  matchId: string | undefined;
  inGame: boolean;

  // Socket operations
  emit: <T>(event: string, data?: any) => Promise<T>;

  // Game-specific methods
}

const gameSocketContext = createContext<GameSocketContextType>(
  {} as GameSocketContextType
);

export default function GameSocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, client } = useSession();

  const [socket, setSocket] = useState<Socket | undefined>();
  const [connected, setConnected] = useState<boolean>(false);
  const [inGame, setInGame] = useState<boolean>(false);
  const [playerRole, setPlayerRole] = useState<PlayerRole | undefined>();
  const [matchId, setMatchId] = useState<string | undefined>();

  // Generic emit function similar to your socket context
  function emit<T>(event: string, data?: any): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      if (!connected || !socket) {
        reject(new Error("Game socket not connected"));
      } else {
        if (data) {
          socket.emit(event, data);
        } else {
          socket.emit(event);
        }

        socket.once(event, (eventData) => {
          console.log("[Event]", event, "Data:", eventData);
          resolve(eventData);
        });
      }
    });
  }

  // // Game-specific methods
  // async function joinGameRoom(matchId: string, gameMode: GameMode): Promise<void> {
  //   if (!connected || !socket) {
  //     throw new Error("Game socket not connected");
  //   }
    
  //   try {
  //     const response = await emit<{
  //       status: string;
  //       message: string;
  //       role?: PlayerRole;
  //     }>("join_game_room", { matchId, gameMode });
      
  //     if (response.status === "ok") {
  //       setMatchId(matchId);
  //       if (response.role) {
  //         setPlayerRole(response.role);
  //       }
  //       console.log(`Joined game room ${matchId} as ${response.role}`);
  //     } else {
  //       console.error("Failed to join game room:", response.message);
  //     }
  //   } catch (error) {
  //     console.error("Error joining game room:", error);
  //     throw error;
  //   }
  // }

  // function movePaddle(y: number) {
  //   if (!connected || !socket || !matchId) return;
    
  //   socket.emit("move_paddle", { matchId, y });
  // }

  // function updateBall(x: number, y: number, vx: number, vy: number) {
  //   if (!connected || !socket || !matchId || playerRole !== 'player1') return;
    
  //   socket.emit("ball_update_from_client", { 
  //     matchId, 
  //     x, 
  //     y, 
  //     vx, 
  //     vy 
  //   });
  // }

  // function scorePoint(scoringPlayerRole: PlayerRole) {
  //   if (!connected || !socket || !matchId) return;
    
  //   socket.emit("score_point", { 
  //     matchId, 
  //     scoringPlayerRole 
  //   });
  // }

  // Initialize socket connection
  const initConnection = (token: string) => {
    console.log(
      "connecting to",
      `${client.isSSL ? "wss" : "ws"}://${client.host}/ws/v1/gameserver`
    ); // TODO: both with or without port dont work
    const connection = io(
      `${client.isSSL ? "wss" : "ws"}://${client.host}/ws/v1/gameserver`, // TODO: both with or without port dont work
      {
        auth: {
          token: `bearer ${token}`,
        },
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
      }
    );

    // Handle connection error
    connection.on("connect_error", (error) => {
      console.error("[GameSocket] connection failed:", error);
    });

    connection.on("connected", (data) => {
      console.log(`[GameSocket] connected: ${data.message}`);
      setSocket(connection);
      setConnected(true);
    });

    // connection.on("auth_error", (error) => {
    //   console.error(`[GameSocket] authentication error: ${error}`);
    //   setConnected(false);
    // });

    // connection.on("playerRole", (role: PlayerRole) => {
    //   console.log(`[GameSocket] assigned role: ${role}`);
    //   setPlayerRole(role);
    // });

    // connection.on("joined_room", (data) => {
    //   console.log(`[GameSocket] joined room: ${data}`);
    //   setMatchId(data.matchId);
    //   setPlayerRole(data.role);
    // });

    // connection.on("gameStart", () => {
    //   console.log(`[GameSocket] game started`);
    //   setInGame(true);
    // });

    // connection.on("gameOver", () => {
    //   console.log(`[GameSocket] game over`);
    //   setInGame(false);
    // });

    // connection.on("error", (error) => {
    //   console.error(`[GameSocket] error: ${error}`);
    // });

    connection.on("disconnect", () => {
      console.log(`[GameSocket] disconnected`);
      setConnected(false);
      setInGame(false);
      setMatchId(undefined);
      setPlayerRole(undefined);
    });

    connection.onAny((event, ...args) => {
      console.log(`[GameSocket Event] [${event}]`, args);
    });

    return connection;
  };

  // Set up socket when session is available and clean up on unmount
  useEffect(() => {
    let gameSocket: Socket | undefined;

    if (session?.jwt) {
      gameSocket = initConnection(session.jwt);
    }

    return () => {
      if (gameSocket) {
        console.log("Cleaning up game socket");
        gameSocket.disconnect();
        setSocket(undefined);
        setConnected(false);
        setInGame(false);
        setMatchId(undefined);
        setPlayerRole(undefined);
      }
    };
  }, [session?.jwt]);

  return (
    <gameSocketContext.Provider
      value={{
        socket,
        connected,
        emit,
        playerRole,
        matchId,
        inGame,
      }}
    >
      {children}
    </gameSocketContext.Provider>
  );
}

export const useGameSocket = () => useContext(gameSocketContext);
