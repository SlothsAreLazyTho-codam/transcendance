"use server";

import { env } from "@/env";
import { newServerAuthClient } from "@/lib";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

async function readTokenFromCookies() {
  return cookies().then((cookieJar) => cookieJar.get("token"));
}

async function updateTokenInCookies(token: string) {
  cookies().then((jar) =>
    jar.set("token", token, {
      domain: new URL(env.API_URL).hostname,
      httpOnly: true,
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
      sameSite: "lax",
    })
  );
}

async function submitOtpCode(token: string, code: string) {
  return newServerAuthClient({ jwt: token }).then((client) =>
    client.postJSON(
      "/api/v1/auth/otp",
      {
        token: token,
        code: code,
      },
      {}
    )
  );
}

export async function VerifyCode(prevState: any, data: FormData) {
  const token = await readTokenFromCookies();
  const code = data.get("code") as string;

  if (!token || !code) {
    return { error: "Invalid code" };
  }

  const response = await submitOtpCode(token.value, code);
  const body: { success: boolean } = await response.json();

  if (!body.success) {
    return { error: "Invalid code, or expired." };
  }

  response.headers.getSetCookie().find((cookie) => {
    if (cookie.startsWith("token")) {
      try {
        const token = cookie.split("token=")[1].split(";")[0];
        updateTokenInCookies(token);
      } catch {
        return { error: "Unknown error occured" };
      }
    }
  });

  redirect("/settings");
  return { error: null };
}

export async function SetupTwoFactorAuthentication(
  prevState: any,
  data: FormData
) {
  const otpCode = data.get("otp");

  if (!otpCode) {
    return { error: "Invalid code, or expired" };
  }

  const client = await newServerAuthClient();
  const response = await client.postJSON(
    "/api/v1/auth/2fa",
    { code: otpCode },
    {}
  );

  if (!response.ok) {
    return { error: "Invalid code, or expired" };
  }

  redirect("/settings");
  return { error: null };
}

export async function DisableTwoFactorAuthentication() {
  const client = await newServerAuthClient();
  const response = await client.delete("/api/v1/auth/2fa", {});
  return response.ok;
}
