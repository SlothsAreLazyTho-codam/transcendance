"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Channel, DMChannel } from "@/api/channel/types";
import { useSocket } from "./socket.context";
import { JoinChannelForm } from "../../components/chat/_form/JoinChannelFrom";
import { Socket } from "socket.io-client";
import { useSession } from "@/lib/context/auth.context";
import { useRouter } from "next/navigation";

export type ITextMessage = {
  id: number;
  receiverId: number;
  receiverType: "CHANNEL" | "USER";
  senderId: number;
  senderName: string;
  value: string;
};

export interface ChatContextType {
  userId: number | null;
  socket: Socket | undefined;
  channels: Channel[];
  allChannels: Channel[];
  setAllChannels: (channels: Channel[]) => void;
  DMChannels: DMChannel[];
  getCurrentChannel: Channel | undefined;
  getCurrentDMChannel: DMChannel | undefined;
  setChannel: (channel?: Channel) => void;
  getChannel: (id: number) => Channel | undefined;
  setDMChannel: (DMChannel?: DMChannel) => void;
  getDMChannel: (id: number) => DMChannel | undefined;
  sendMessage: (message: string, receiverType?: "CHANNEL" | "USER") => void;
  joinChannel: (id: number, password?: string) => void;
  leaveChannel: (id: number) => void;
  isChannelAdmin: () => boolean;
  toggleChannelAdmin: (userId: number) => void;
  banUser: (userId: number) => void;
  muteUser: (userId: number) => void;
  blockUser: (userId: number) => void;
  unblockUser: (userId: number) => void;
  isUserBlocked: (userId: number) => boolean;
  acceptMatch: (matchId: string) => void;
}

const chatContext = createContext<ChatContextType>({} as ChatContextType);

export default function ChatContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { socket, connected, emit } = useSocket();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelId, setChannelId] = useState<number>(-1);
  const [DMChannels, setDMChannels] = useState<DMChannel[]>([]);
  const [DMChannelId, setDMChannelId] = useState<number>(-1);
  const [allChannels, setAllChannels] = useState<Channel[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<number[]>([]);
  const { session } = useSession();

  // --- Helpers ---
  function isUserBlocked(userId: number): boolean {
    return blockedUsers.includes(userId);
  }
  function fetchBlockedUsers() {
    if (!session?.user?.id) return;
    fetch("/api/v1/users/me", {
      headers: { Authorization: `Bearer ${session.jwt}` },
    })
      .then((res) => res.json())
      .then((userData) => {
        if (userData.blockedUsers) {
          setBlockedUsers(
            userData.blockedUsers.map((block: any) => block.blockedId)
          );
        }
      })
      .catch(console.error);
  }
  function blockUser(userId: number) {
    if (!session?.user?.id || userId === session.user.id) return;
    fetch(`/api/v1/users/me/block/${userId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${session.jwt}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((updatedBlockedUsers: number[]) =>
        setBlockedUsers(updatedBlockedUsers)
      )
      .catch(console.error);
  }
  function unblockUser(userId: number) {
    if (!session?.user?.id) return;
    fetch(`/api/v1/users/me/block/${userId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${session.jwt}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((updatedBlockedUsers: number[]) =>
        setBlockedUsers(updatedBlockedUsers)
      )
      .catch(console.error);
  }
  function filterBlockedMessages(messages: any[]) {
    return messages.filter((msg) => !isUserBlocked(msg.senderId));
  }
  function filterBlockedDMChannels(dmChannels: DMChannel[]) {
    if (!session?.user?.id) return [];
    return dmChannels.filter(
      (dm) =>
        !isUserBlocked(
          dm.user1Id === session?.user?.id ? dm.user2Id : dm.user1Id
        )
    );
  }
  function fetchChannels() {
    emit<Channel[]>("channelMe").then((data) => {
      const filtered = data.map((channel) => ({
        ...channel,
        messages: filterBlockedMessages(channel.messages ?? []),
      }));
      setChannels(filtered);
    });
  }
  function fetchAllChannels() {
    emit<Channel[]>("channelAll").then((data) => {
      setAllChannels(data);
    });
  }
  function fetchDmChannels() {
    emit<DMChannel[]>("channelMeDM").then((data) => {
      if (Array.isArray(data)) {
        const filtered = filterBlockedDMChannels(
          data.map((dm) => ({
            ...dm,
            messages: filterBlockedMessages(dm.messages ?? []),
          }))
        );
        setDMChannels(filtered);
      }
    });
  }

  // --- Setters/selectors ---
  const updateAllChannels = (channels: Channel[]) => setAllChannels(channels);
  const setDMChannel = (dmChannel?: DMChannel) =>
    setDMChannelId(dmChannel ? dmChannel.vid : -1);
  const getDMChannel = (id: number) => DMChannels.find((c) => c.vid == id);
  const getCurrentDMChannel = useMemo(
    () => DMChannels.find((c) => c.vid === DMChannelId) || undefined,
    [DMChannels, DMChannelId]
  );
  const setChannel = (channel?: Channel) =>
    setChannelId(channel ? channel.id : -1);
  const getChannel = (id: number) => channels.find((c) => c.id == id);
  const getCurrentChannel = useMemo(
    () => channels.find((c) => c.id === channelId) || undefined,
    [channels, channelId]
  );

  // --- Send message ---
  function sendMessage(
    message: string,
    receiverType: "CHANNEL" | "USER" = "CHANNEL"
  ) {
    if (!socket || !connected) return;
    if (receiverType === "CHANNEL" && getCurrentChannel) {
      socket.emit("text", {
        receiverId: channelId,
        receiverType,
        value: message,
      });
    }
    if (receiverType === "USER" && getCurrentDMChannel) {
      socket.emit("text", {
        receiverId:
          session?.user?.id === getCurrentDMChannel.user1Id
            ? getCurrentDMChannel.user2Id
            : getCurrentDMChannel.user1Id,
        receiverType,
        value: message,
      });
    }
  }

  // --- Admin/ban/mute/queue ---
  function isChannelAdmin() {
    if (!session) return false;
    if (
      session.user?.id === getCurrentChannel?.ownerId ||
      getCurrentChannel?.members.some(
        (m) => m.userId === session.user?.id && m.isAdmin
      )
    )
      return true;
    return false;
  }
  function toggleChannelAdmin(userId: number) {
    if (!socket || !connected) return;
    if (!session) return;
    const member = getCurrentChannel?.members.find((m) => m.userId === userId);
    if (!member) return;
    socket.emit("admin", {
      user: member.user,
      channel: getCurrentChannel,
    });
  }
  function joinChannel(id: number, password?: string) {
    if (!connected || getChannel(id)) return;
    const form: JoinChannelForm = {
      id,
      type: password ? "PRIVATE" : "PUBLIC",
    };
    if (password) form.password = password;
    emit<{ error?: string }>("join", form).then((data) => {
      if (data.error) alert(data.error);
    });
  }
  function leaveChannel(id: number) {
    if (!connected || !getChannel(id)) return;
    emit("leave", { id }).then(() => {
      setChannels((prev) => prev.filter((c) => c.id !== id));
      if (channelId === id) setChannelId(-1);
    });
    fetchChannels();
  }
  function banUser(userId: number) {
    if (!socket || !connected || !getCurrentChannel) return;
    socket.emit("ban", {
      playerToBan: userId,
      channel: getCurrentChannel,
    });
    fetchChannels();
  }
  function muteUser(userId: number) {
    if (!socket || !connected || !getCurrentChannel) return;
    socket.emit("mute", {
      userId,
      channelId: getCurrentChannel.id,
    });
  }
  function acceptMatch(matchId: string) {
    if (!socket || !connected) return;
    socket.emit("accept_match", { matchId, status: "ACCEPTED" });
  }

  // -------- useEffects gesplitst --------

  // 1. Bloklijst ophalen als user wijzigt
  useEffect(() => {
    if (connected && socket && session?.user?.id) {
      fetchBlockedUsers();
    }
  }, [connected, socket, session?.user?.id]);

  // 2. Kanalen en DM's refetchen als blocklist verandert
  useEffect(() => {
    if (connected && socket && session?.user?.id) {
      fetchChannels();
      fetchAllChannels();
      fetchDmChannels();
    }
  }, [connected, socket, session?.user?.id, blockedUsers]);

  // 3. Socket listeners (uniek: zonder blocklist in deps)
  useEffect(() => {
    if (connected && socket && session?.user?.id) {
      socket.off("joinDM");
      socket.on("joinDM", (data: { error?: string; status?: string }) => {
        if (data.status === "ok") fetchDmChannels();
      });

      socket.off("text");
      socket.on("text", (data: ITextMessage) => {
        if (isUserBlocked(data.senderId)) return;

        if (data.receiverType === "CHANNEL") {
          setChannels((prev) =>
            prev.map((c) =>
              c.id === data.receiverId
                ? {
                    ...c,
                    messages: [
                      ...c.messages,
                      {
                        id: data.id,
                        channelId: data.receiverId,
                        content: data.value,
                        senderId: data.senderId,
                        sender: {
                          id: data.senderId,
                          username: data.senderName,
                        },
                      },
                    ],
                  }
                : c
            )
          );
        }
        if (data.receiverType === "USER") {
          // Als de DM met deze user verborgen is, voeg geen bericht toe
          const blockedDM = DMChannels.find(
            (dm) =>
              (dm.user1Id === data.senderId || dm.user2Id === data.senderId) &&
              isUserBlocked(data.senderId)
          );
          if (blockedDM) return;

          setDMChannels((prev) =>
            prev.map((dm) =>
              dm.vid === data.receiverId
                ? {
                    ...dm,
                    messages: [
                      ...dm.messages,
                      {
                        id: data.id,
                        content: data.value,
                        dmUser1Id: dm.user1Id,
                        dmUser2Id: dm.user2Id,
                        senderId: data.senderId,
                        sender: {
                          id: data.senderId,
                          username: data.senderName,
                        },
                      },
                    ],
                  }
                : dm
            )
          );
        }
      });

      // De rest van je socket events (ban, kick, update, mute, etc) ongewijzigd:
      socket.off("ban");
      socket.on("ban", (data: { reason: string; channelId: number }) => {
        alert(data.reason);
        setChannels((prev) => prev.filter((c) => c.id !== data.channelId));
        if (channelId === data.channelId) setChannelId(-1);
      });

      socket.off("youWereKicked");
      socket.on(
        "youWereKicked",
        (data: { channelId: number; channelName: string; reason: string }) => {
          alert(data.reason + ` from ${data.channelName}.`);
          setChannels((prev) => prev.filter((c) => c.id !== data.channelId));
          if (channelId === data.channelId) setChannelId(-1);
        }
      );

      socket.off("channelUpdate");
      socket.on(
        "channelUpdate",
        (data: {
          channelId: number;
          mutedMembers?: any[];
          members?: any[];
          message?: string;
          action?: string;
          kickedUserId?: number;
          channel?: Channel;
        }) => {
          setChannels((prev) =>
            prev.map((c) => {
              if (c.id === data.channelId) {
                if (data.channel) {
                  return {
                    ...data.channel,
                    messages: filterBlockedMessages(
                      data.channel.messages ?? []
                    ),
                  };
                }
                const updatedChannel = { ...c };
                if (data.mutedMembers !== undefined) {
                  updatedChannel.mutedMembers = data.mutedMembers;
                }
                if (data.members !== undefined) {
                  updatedChannel.members = data.members;
                }
                return updatedChannel;
              }
              return c;
            })
          );
          if (
            data.action === "joined" &&
            data.channel &&
            !getChannel(data.channel.id)
          ) {
            setChannels((prev) => [...prev, data.channel!]);
          }
        }
      );

      socket.off("kickSuccessful");
      socket.on(
        "kickSuccessful",
        (data: {
          channelId: number;
          kickedUsername: string;
          message: string;
        }) => {
          console.log(`KICK SUCCESSFUL: ${data.message}`);
        }
      );

      socket.off("muteStatus");
      socket.on(
        "muteStatus",
        (data: { channelId: number; isMuted: boolean }) => {
          if (data.isMuted) {
            alert("You have been muted in this channel.");
          } else {
            alert("You have been unmuted in this channel.");
          }
        }
      );

      socket.off("match_found");
      socket.on("match_found", (data: any) => {
        const accept = window.confirm(
          `Match found for ${data.gameMode}. Players: ${data.players
            .map((p: any) => p.username)
            .join(", ")}. Accept?`
        );
        if (accept) acceptMatch(data.matchId);
      });

      socket.off("match_start");
      socket.on("match_start", (data: any) => {
        window.location.href = `/game?matchId=${data.matchId}`;
      });

      socket.off("match_canceled");
      socket.on("match_canceled", (data: any) => {
        alert(`Match ${data.matchId} was canceled: ${data.reason}`);
      });

      return () => {
        socket.off("joinDM");
        socket.off("text");
        socket.off("ban");
        socket.off("youWereKicked");
        socket.off("channelUpdate");
        socket.off("kickSuccessful");
        socket.off("muteStatus");
        socket.off("match_found");
        socket.off("match_start");
        socket.off("match_canceled");
      };
    }
  }, [connected, socket, session?.user?.id, channelId, DMChannels]); // channelId voor 'ban' & 'youWereKicked'

  // ---- Provide context value ----
  return (
    <chatContext.Provider
      value={{
        userId: session?.user?.id ?? null,
        socket,
        channels,
        allChannels,
        setAllChannels: updateAllChannels,
        DMChannels,
        getCurrentChannel,
        getCurrentDMChannel,
        setDMChannel,
        getDMChannel,
        setChannel,
        getChannel,
        sendMessage,
        joinChannel,
        leaveChannel,
        isChannelAdmin,
        toggleChannelAdmin,
        banUser,
        muteUser,
        blockUser,
        unblockUser,
        isUserBlocked,
        acceptMatch,
      }}
    >
      {children}
    </chatContext.Provider>
  );
}

export const useChatService = () => useContext(chatContext);
