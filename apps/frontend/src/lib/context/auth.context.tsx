"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

import { Session } from "../auth";
import { AvatarContextProvider } from "@/components/ui/avatar";
import FetchClient from "../http/api";

interface AuthContextType {
  session?: Session;
  client: FetchClient;
}

const authContext = createContext<AuthContextType>({} as AuthContextType);

export default function AuthContextProvider({
  session,
  url,
  children,
}: {
  session: Session;
  url: string;
  children: React.ReactNode;
}) {
  const [client] = useState<FetchClient>(
    new FetchClient({
      baseUrl: url,
      headers: {
        authorization: `bearer ${session?.jwt}`,
      },
    })
  );

  return (
    <authContext.Provider value={{ session, client }}>
      <AvatarContextProvider>{children}</AvatarContextProvider>
    </authContext.Provider>
  );
}

export const useSession = () => useContext(authContext);
