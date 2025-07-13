// _components/ChannelListSidebar.tsx
"use client";

import React from "react";
import { useChatService } from "../../../lib/context/chat.context";
import ChannelMenu from "./channelMenu"; // Assuming ChannelMenu is in the same _components directory

interface ChannelListSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChannelListSidebar({ isOpen, onClose }: ChannelListSidebarProps) {
  const { channels, getCurrentChannel, setChannel, getCurrentDMChannel, setDMChannel, DMChannels, userId } = useChatService();

  return (
    <>
      {/* Overlay (fades in/out) */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-500 z-20 ${
          isOpen ? "opacity-50" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sidebar (always rendered, toggle visibility via class) */}
      <div
        className={`
          fixed top-0 left-0 z-30 h-full w-64 bg-neutral-900 border-r border-white/10 shadow-md p-4 space-y-4
          transition-all duration-500 ease-in-out
          ${isOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10 pointer-events-none"}
        `}
      >
        <div className="flex justify-between items-center pb-2 mb-4">
          <h2 className="text-3xl font-bold text-white">All Channels</h2>
          <button className="text-white text-sm hover:text-red-400" onClick={onClose}>
            ✕
          </button>
        </div>
          <p className="w-full h-[3px] bg-gradient-to-r from-fuchsia-500 via-cyan-500 to-lime-500 bg-[length:200%_100%] animate-[gradientShift_3s_ease_infinite]"></p>

        <div className="space-y-4">
          <div>
            <h3 className="text-2xl font-semibold mb-2 text-white">DM's</h3>
            <div className="space-y-2">
              
            </div>
            {DMChannels.map((dm) => (
              <div
                key={`dm-${dm.user1Id}-${dm.user2Id}`}
                className="flex items-center justify-between w-full px-2 py-1"
              >
                <button
                  className="flex-1 text-left px-2 py-2 text-2xl text-neutral-300 transition-colors duration-300 hover:bg-lime-300 hover:text-black rounded-md"
                  onClick={(e) => {
                    e.preventDefault();
                    onClose(); // Close sidebar on DM selection
                    setDMChannel(dm);
                  }}
                >
                  {dm.user1Id === userId ? dm.user2?.username : dm.user1?.username}
                </button>
                {/* <ChannelMenu channel={dm} /> */}
              </div>
            ))}
          </div>

          <p className="w-full h-[3px] bg-gradient-to-r from-fuchsia-500 via-cyan-500 to-lime-500 bg-[length:200%_100%] animate-[gradientShift_3s_ease_infinite]"></p>

          <div>
            <h3 className="text-2xl font-semibold mb-2 text-white">Channels</h3>
            <div className="space-y-2">
              {channels?.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between w-full px-2 py-1  rounded transition-colors duration-300"
                >
                  <button
                    className="flex-1 text-left px-2 py-2 text-2xl text-neutral-300 transition-colors duration-300 hover:bg-lime-300 hover:text-black rounded-md"
                    onClick={(e) => {
                      e.preventDefault();
                      onClose();
                      if (c.id === getCurrentChannel?.id) {
                        setChannel(undefined);
                      } else {
                        setChannel(c);
                      }
                    }}
                  >
                    {c.name}
                  </button>
                  <ChannelMenu channel={c} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}