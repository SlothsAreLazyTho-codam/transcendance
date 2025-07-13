"use client";

import { useEffect, useRef, useState } from "react";
import { useChatService } from "../../../lib/context/chat.context";

interface ChannelMembersSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function ChannelMembersSidebar({ open, onClose }: ChannelMembersSidebarProps) {
  const { getCurrentChannel, userId, socket, isChannelAdmin, toggleChannelAdmin, banUser } = useChatService();
  const [openMenuUserId, setOpenMenuUserId] = useState<number | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const members = getCurrentChannel?.members || [];
  const ownerId = getCurrentChannel?.ownerId;
  const currentMember = members.find((m) => m.user.id === userId);
  const isChannelOwner = ownerId === currentMember?.user.id;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (open && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        onClose();
        setOpenMenuUserId(null);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, onClose]);

  const handleAction = (action: string, targetUserId: number) => {
    if (socket) {
      socket.emit(action, {
        userId: targetUserId,
        channelId: getCurrentChannel?.id,
        playerToBan: targetUserId,
      });
    }
    setOpenMenuUserId(null);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-500 z-40 ${
          open ? "opacity-50" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`
          fixed top-0 right-0 z-50 h-full w-72 bg-neutral-900 border-l border-white/10 shadow-md p-4 flex flex-col transition-all duration-500 ease-in-out
          ${open ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10 pointer-events-none"}
        `}
      >
        <div className="flex justify-between items-center pb-2 mb-4">
          <h2 className="text-3xl font-bold text-white">Channel Members</h2>
          <button
            className="text-white text-sm hover:text-red-400"
            onClick={onClose}
            title="Close"
          >
            ✕
          </button>
        </div>
        <p className="w-full h-[3px] bg-gradient-to-r from-fuchsia-500 via-cyan-500 to-lime-500 bg-[length:200%_100%] animate-[gradientShift_3s_ease_infinite] mb-4"></p>

        <div className="overflow-y-auto flex-1 pr-2 space-y-2">
          {members.map((member) => {
            const role =
              member.user.id === ownerId
                ? "Owner"
                : member.isAdmin
                ? "Admin"
                : "Member";

            const canModerate = isChannelAdmin();

            return (
              <div
                key={member.user.id}
                className="flex items-center justify-between w-full px-2 py-1 text-neutral-300 transition-colors duration-300 hover:bg-fuchsia-500 hover:text-black rounded-md relative"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate font-semibold text-4xl text-white">{member.user.username}</span>
                  {getCurrentChannel?.mutedMembers?.some((m: typeof member) => m.user.id === member.user.id) && (
                    <span className="text-rose-400 text-xs px-2 py-0.5 rounded bg-rose-900/30 font-bold ml-2">Muted</span>
                  )}
                  <span
                    className={`text-lg px-2 py-0.5 rounded font-bold ml-1
                      ${role === "Owner"
                        ? "bg-fuchsia-500 text-black"
                        : role === "Admin"
                        ? "bg-cyan-800/80 text-cyan-200"
                        : "bg-neutral-800 text-gray-300"
                      }`}
                  >
                    {role}
                  </span>
                </div>
                <button
                  className="px-2 py-1 text-lg text-neutral-300 transition-colors duration-300 hover:bg-lime-300 hover:text-black rounded-md"
                  onClick={() =>
                    setOpenMenuUserId(openMenuUserId === member.user.id ? null : member.user.id)
                  }
                >
                  ⋮
                </button>
                {openMenuUserId === member.user.id && (
                  <div className="absolute right-0 top-full mt-1 min-w-[140px] bg-neutral-900 border border-white/10 text-white rounded-lg shadow-lg z-50">
                    <button
                      className="w-full text-left px-4 py-2 rounded-t-lg hover:bg-cyan-700/20 hover:text-cyan-300 transition"
                      onClick={() => {
                        if (socket) {
                          socket.emit("joinDM", {
                            id: member.user.id,
                          });
                        }
                        setOpenMenuUserId(null);
                      }}
                    >
                      DM
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 hover:bg-lime-700/15 hover:text-lime-300 transition"
                      onClick={() => {
                        setOpenMenuUserId(null);
                      }}
                    >
                      Invite
                    </button>
                    {canModerate && (
                      <>
                        <button
                          className="w-full text-left px-4 py-2 hover:bg-amber-700/20 hover:text-amber-300 transition"
                          onClick={() => handleAction("mute", member.user.id)}
                        >
                          Mute
                        </button>
                        <button
                          className="w-full text-left px-4 py-2 hover:bg-rose-800/40 hover:text-rose-300 transition"
                          onClick={() => handleAction("kick", member.user.id)}
                        >
                          Kick
                        </button>
                        <button
                          className="w-full text-left px-4 py-2 rounded-b-lg hover:bg-rose-700/50 hover:text-rose-200 transition"
                          onClick={() => banUser(member.user.id)}
                        >
                          Ban
                        </button>
                      </>
                    )}
                    {isChannelOwner && (
                      <button
                        className="w-full text-left px-4 py-2 hover:bg-fuchsia-800/40 hover:text-fuchsia-200 transition"
                        onClick={() => toggleChannelAdmin(member.user.id)}
                      >
                        Toggle admin
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
