"use client";

import { Channel } from "@/api/channel/types";
import { useChatService } from "../../../lib/context/chat.context";
import { useEffect, useRef, useState } from "react";
import ChangePasswordDialog from "@/components/chat/_dialog/changepassword.dialog";

export default function ChannelMenu({ channel }: { channel: Channel }) {
  const { userId, getCurrentChannel, setChannel, joinChannel, leaveChannel, channels } =
    useChatService();
  const [open, setOpen] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isJoined = channels.some((c) => c.id === channel.id);
  const isOwner = channel.ownerId === userId;

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="ml-2 flex items-center px-2 py-1 text-lg font-extrabold rounded-lg hover:bg-fuchsia-500/10 hover:text-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40 transition"
        onClick={() => setOpen((prev) => !prev)}
        title="Channel options"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="select-none" style={{fontSize: "1.3em"}}>⋮</span>
      </button>
      {open && (
        <div
          className="
            absolute z-30 right-0 mt-2 min-w-[170px] bg-neutral-900/95
            border border-fuchsia-600/40
            shadow-xl
            rounded-xl
            animate-fadeIn
            py-2
            neon-border
          "
          role="menu"
        >
          {!isJoined ? (
            <button
              className="
                w-full px-5 py-2
                text-left font-semibold
                rounded-md transition
                text-white
                hover:bg-fuchsia-700/25 hover:text-fuchsia-300
                focus:outline-none
              "
              onClick={() => {
                joinChannel(channel.id);
                setChannel(channel);
                setOpen(false);
              }}
            >
              Join
            </button>
          ) : (
            <>
              <button
                className="
                  w-full px-5 py-2
                  text-left font-semibold
                  rounded-md transition
                  text-white
                  hover:bg-rose-700/30 hover:text-rose-300
                  focus:outline-none
                "
                onClick={() => {
                  leaveChannel(channel.id);
                  setOpen(false);
                }}
              >
                {isOwner ? "Delete channel" : "Leave"}
              </button>
              {isOwner && (
                <button
                  className="
                    w-full px-5 py-2
                    text-left font-semibold
                    rounded-md transition
                    text-white
                    hover:bg-fuchsia-500/20 hover:text-fuchsia-300
                    focus:outline-none
                  "
                  onClick={() => {
                    setOpen(false);
                    setShowPasswordDialog(true);
                  }}
                >
                  Manage password
                </button>
              )}
            </>
          )}
        </div>
      )}

      <ChangePasswordDialog
        channel={channel}
        open={showPasswordDialog}
        onClose={() => setShowPasswordDialog(false)}
      />
    </div>
  );
}
