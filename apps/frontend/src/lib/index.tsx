"use server";

import { env } from "@/env";
import { getSession } from "./auth";
import { newFetchClient } from "./http/api";
import { Session } from "./auth";

export const newServerAuthClient = async (useableSession?: Session) => {
  if (useableSession) {
    return newFetchClient(env.API_URL, useableSession?.jwt);
  }

  const session = await getSession();
  return newFetchClient(env.API_URL, session?.jwt);
};
