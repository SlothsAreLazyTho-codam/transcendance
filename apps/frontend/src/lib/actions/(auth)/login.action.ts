"use server";

import { redirect } from "next/navigation";

export default async function LoginAction(prevState: any, formData: FormData) {
  redirect("/api/v1/auth/42/callback");
  return { error: null };
}
