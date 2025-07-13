"use server";

import { cookies } from "next/headers";
import { User } from "./types/user";
import { newServerAuthClient } from ".";
import { redirect } from "next/navigation";

export type Session = {
  user?: User;
  jwt?: string;
  error?: string;
};

async function getCookieValue(key: string) {
  const cookieJar = await cookies();
  const value = cookieJar.get(key)?.value;
  return value ? value : undefined;
}

export async function logout() {
  const token = await getCookieValue("token");

  if (!token) {
    return undefined;
  }

  const client = await newServerAuthClient();
  await client.post("/api/v1/auth/logout", {});

  const cookieJar = await cookies();
  cookieJar.set("token", "", { expires: new Date(0) });
}

export async function getAuthStatus(user: User) {
  const token = await getCookieValue("token");

  if (!token) {
    return "NOT_AUTHENTICATED";
  }

  try {
    const attempt = token?.split(".")[1].split(".")[0];
    const decoded = Buffer.from(attempt!, "base64").toString("utf-8");
    const object: { sub: { otp: string }; otp: boolean } = JSON.parse(decoded);

    if (!object) return "AUTHENTICATED_NO_2FA";
    if (user.otp && !object.otp) return "NOT_AUTHENTICATED";
    return "AUTHENTICATED";
  } catch (ex) {
    return "NOT_AUTHENTICATED";
  }
}

export async function getSession(): Promise<Session | undefined> {
  const token = await getCookieValue("token");

  if (!token) {
    redirect("/login");
  }

  let client = await newServerAuthClient({ jwt: token });
  let user: User | undefined;

  try {
    user = await client.getAs<User>("/api/v1/auth/me", {});
  } catch (err) {
    console.error("[auth.tsx]<getSession> Error fetching user:", err);
  }

  if (!user) {
    redirect("/login");
  }

  const authenticatedState = await getAuthStatus(user);

  if (authenticatedState == "NOT_AUTHENTICATED") {
    redirect("/login");
  }

  return {
    user: user,
    jwt: token,
  } as Session;
}
