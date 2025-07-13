"use client";

import { VerifyCode } from "@/lib/actions/(auth)/2fa.action";
import { useActionState } from "react";

export default function Page() {
  const [state, formAction] = useActionState(VerifyCode, { error: null });

  return (
    <div className="min-h-screen flex justify-center items-center">
      <div className="flex flex-col bg-background/50 rounded-lg p-4 ring-2 ring-primary gap-y-8">
        <h1 className="text-4xl justify-center border-b border-white/50 text-center">
          Enter your 2FA code
        </h1>

        <form className="flex flex-col" action={formAction}>
          {state.error && (
            <label className="text-red-500 text-lg text-center">
              {state.error}
            </label>
          )}

          <input
            className="focus:outline-none border border-white/10 m-2 p-2 text-white text-center text-4xl"
            name="code"
            type="text"
            placeholder="Your OTP Code"
          />
          <button className="px-2 py-1 bg-primary rounded-lg text-4xl text-black font-semibold">
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}
