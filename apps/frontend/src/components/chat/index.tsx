"use client";

import React, { useState } from "react";
import { useChatService } from "../../lib/context/chat.context";

import ChatBoxArea from "./_components/ChatBoxArea";
import { CreateChannelDialog } from "./_dialog/createchannel.dialog";
import { JoinChannelDialog } from "./_dialog/joinchannel.dialog";
import ChatInput from "./_components/ChatInput";
import ChannelMembersSidebar from "./_components/ChannelMembersSidebar";
import ChannelListSidebar from "./_components/ChannelListSidebar";

export default function ChatComponent() {
  const { getCurrentChannel, getCurrentDMChannel } = useChatService();

  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  return (
    <div className="relative h-[80vh] mx-4 my-8 bg-neutral-900 rounded-lg overflow-hidden flex flex-col shadow-lg border border-white/10">

      <ChannelListSidebar
        isOpen={leftSidebarOpen}
        onClose={() => setLeftSidebarOpen(false)}
      />

      <div className="flex items-center justify-between p-4 bg-neutral-900 border-b border-white/10">
        <button
          className="p-2 rounded-lg hover:bg-fuchsia-500/15 hover:text-fuchsia-400 focus:outline-none transition"
          onClick={() => setLeftSidebarOpen(true)}
          title="Open channel list"
        >
          <span className="text-2xl font-bold select-none">☰</span>
        </button>

        <h1 className="text-white font-bold text-2xl truncate max-w-[180px] md:max-w-xs text-center px-2">
          {getCurrentChannel?.name ||
            (getCurrentDMChannel?.user1?.username && getCurrentDMChannel?.user2?.username
              ? `${getCurrentDMChannel.user1.username} & ${getCurrentDMChannel.user2.username}`
              : "Chat")}
        </h1>
        <div className="w-8" />

        <button
          onClick={() => setRightSidebarOpen(true)}
          className="px-4 py-2 text-lg font-bold text-white rounded-lg transition hover:bg-fuchsia-500/20 hover:text-fuchsia-300 focus:outline-none"
          title="View channel members"
        >
          Channel Members
        </button>

        <ChannelMembersSidebar open={rightSidebarOpen} onClose={() => setRightSidebarOpen(false)} />
      </div>

      <p className="w-full h-[3px] bg-gradient-to-r from-fuchsia-500 via-cyan-500 to-lime-500 bg-[length:200%_100%] animate-[gradientShift_3s_ease_infinite]"></p>

      <div className="flex-1 flex flex-col overflow-y-auto p-4 bg-neutral-900">
        {getCurrentChannel ? (
          <ChatBoxArea channel={getCurrentChannel} />
        ) : getCurrentDMChannel ? (
          <ChatBoxArea dmChannel={getCurrentDMChannel} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="p-4 bg-black/20 rounded shadow shadow-black/40">
              <h1 className="text-lg text-white">Select a chat to start chatting! {":)"}</h1>
            </div>
            <h1 className="text-lg text-neutral-300 font-bold">OR</h1>
            <div className="flex flex-row space-x-4">
              <JoinChannelDialog />
              <CreateChannelDialog />
            </div>
          </div>
        )}
      </div>

      {getCurrentChannel || getCurrentDMChannel ? (
        <ChatInput />
      ) : (
        <div className="flex items-center justify-center p-4 bg-neutral-800 border-t border-white/10">
          <h1 className="text-lg text-white">Select a channel or DM to start chatting!</h1>
        </div>
      )}
    </div>
  );
}
