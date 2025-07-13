"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "@/lib/context/auth.context";
import { User } from "@/lib/types/user";

interface AvatarContextType {
  avatar: string;
  setAvatar: (avatar: string) => void;

  reloadAvatar: () => Promise<Blob | undefined>;
  uploadAvatar: (data: FormData) => Promise<Response | undefined>;
  loadAvatar: (id: string) => Promise<Blob | undefined>;
}

const avatarContext = createContext<AvatarContextType>({} as AvatarContextType);

export function AvatarContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, client } = useSession();
  const [avatar, setAvatar] = useState<string>("/default.jpg");

  const loadAvatar = async (id: string) => {
    if (!session && !client) return undefined;

    return client
      .get(`/api/v1/users/${id}/avatar`, {})
      .then((x) => (x.ok ? x.blob() : undefined))
      .then((x) => {
        if (!x) {
          setAvatar("/default.jpg");
          return undefined;
        }

        setAvatar(URL.createObjectURL(x));
        return x;
      });
  };

  const reloadAvatar = async () => {
    if (!session) return undefined;
    if (!session.user?.avatar) return undefined;

    return loadAvatar("me");
  };

  const uploadAvatar = async (
    data: FormData
  ): Promise<Response | undefined> => {
    if (!session) {
      return;
    }

    return client?.put(`/api/v1/users/me/avatar`, {
      body: data,
    });
  };

  return (
    <avatarContext.Provider
      value={{ avatar, setAvatar, reloadAvatar, uploadAvatar, loadAvatar }}
    >
      {children}
    </avatarContext.Provider>
  );
}

export function Avatar({
  className,
  user,
}: {
  className?: string;
  user?: User;
}) {
  const { avatar, loadAvatar, reloadAvatar } = useAvatar();

  useEffect(() => {
    if (!user) {
      reloadAvatar();
      return;
    }

    loadAvatar(`${user.id}`);
  }, [user]);

  return (
    <>
      {avatar && (
        <img
          src={avatar}
          className={
            className
              ? `${className} rounded-4xl object-cover`
              : "w-32 h-32 rounded-4xl object-cover"
          }
          width={128}
          height={128}
        />
      )}
    </>
  );
}

export const useAvatar = () => useContext(avatarContext);
