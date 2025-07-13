"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "@/lib/context/auth.context";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
  socket?: Socket;
  connected: boolean;
  emit: <T>(event: string, data?: any) => Promise<T>;
}

const socketContext = createContext<SocketContextType>({} as SocketContextType);

export default function SocketContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, client } = useSession();

  const [socket, setSocket] = useState<Socket | undefined>(undefined);
  const [connected, setConnected] = useState<boolean>(false);

  function emit<T>(event: string, data?: any): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      if (!connected || !socket) {
        reject(new Error("You are not connected!"));
      } else {
        if (data) {
          socket.emit(event, data);
        } else {
          socket.emit(event);
        }

        socket.once(event, (eventData) => {
          console.log("[Socket Event] [", event, "] Data received", eventData);
          resolve(eventData);
        });
      }
    });
  }

  const initConnection = (token: string) => {
    const connection = io(
      `${client.isSSL ? "wss" : "ws"}://${client.host}/ws/v1/chat`,
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
      console.error("[ChatSocket] connection failed:", error);
    });

    connection.on("connected", () => {
      setSocket(connection);
      setConnected(true);
    });

    connection.onAny((data, ...args) => {
      console.log("[ChatSocket] Incoming data: ", data, args);
    });

    connection.on("error", (_) => {
      setConnected(false);
    });

    connection.on("disconnect", (_) => {
      setConnected(false);
    });

    connection.on("exit", (_) => {
      setConnected(false);
    });
  };

  useEffect(() => {
    if (session?.jwt) {
      initConnection(session?.jwt!);
    }
  }, [session?.jwt]);

  return (
    <socketContext.Provider
      value={{
        socket,
        connected,
        emit,
      }}
    >
      {children}
    </socketContext.Provider>
  );
}

export const useSocket = () => useContext(socketContext);
