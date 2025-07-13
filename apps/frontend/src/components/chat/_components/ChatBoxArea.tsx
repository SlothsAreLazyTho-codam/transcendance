"use client";

import { Channel, DMChannel } from "@/api/channel/types";
import { useSession } from "@/lib/context/auth.context";
import { useEffect, useRef } from "react";
import { useChatService } from "../../../lib/context/chat.context";

interface chatBoxAreaProps {
  channel?: Channel;
  dmChannel?: DMChannel; // Optioneel, voor DM kanalen
}

export default function ChatBoxArea({ channel, dmChannel }: chatBoxAreaProps) {
  const { session } = useSession();
  const { sendMessage } = useChatService();
  const chatBoxAreaRef = useRef<HTMLDivElement>(null);

  const messages = channel
    ? channel.messages
    : dmChannel
    ? dmChannel.messages
    : [];

  useEffect(() => {
    const element = chatBoxAreaRef.current;
    if (element) {
      requestAnimationFrame(() => {
        element.scrollTop = element.scrollHeight;
      });
    }
  }, [channel?.messages, channel?.id, dmChannel?.messages, dmChannel?.vid]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Berichten Container */}
      <div
        ref={chatBoxAreaRef}
        className="flex-1 overflow-y-auto px-2 py-4 space-y-2"
      >
        <div className="flex p-2 mx-auto min-w-1/4 rounded-lg justify-center bg-black/15 shadow-sm shadow-black/50 mb-4">
          <h1>
            {messages.length >= 1
              ? "You are at the top ☝️"
              : "Be the first to send a message 🎉"}
          </h1>
        </div>

        {messages.map((message) => {
          const isSender = message.senderId === session?.user?.id;

          return (
           <div
             key={message.id}
             className={`flex ${isSender ? "justify-end" : "justify-start"} p-2 mt-0 mx-2`}
           >
             <div>
               <div className="flex flex-col text-3xl p-2 rounded-sm bg-transparent">
                 <h1 className={`text-2xl font-semibold truncate ${isSender ? "text-blue-500" : "text-green-500"}`}>
                   {message.sender?.username}
                 </h1>
                 <p className="text-md break-words text-white">{message.content}</p>
               </div>
             </div>
           </div>
         );
        })}
      </div>
    </div>
  );
}