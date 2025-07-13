"use client";

import ChatContextProvider from "../../../lib/context/chat.context";
import SocketContextProvider from "../../../lib/context/socket.context";

export default function ChatProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SocketContextProvider>
      <ChatContextProvider>{children}</ChatContextProvider>
    </SocketContextProvider>
  );
}
