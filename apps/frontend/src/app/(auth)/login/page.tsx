"use client";

import LoginAction from "@/lib/actions/(auth)/login.action";
import { useActionState } from "react";

export default function Page() {
  const [state, formAction] = useActionState(LoginAction, { error: null });

  return (
    <div className="min-h-screen flex justify-center items-center animate-gradient bg-[length:1000%_1000%] bg-gradient-to-l from-purple-300 via-pink-300 to-orange-300 text-white text-center p-4">
      <div className="flex flex-col items-center p-2 relative">
        <h1 className="text-4xl font-semibold text-gray-900">
          <span
            className="bg-gradient-to-bl from-fuchsia-300 via-gray-900 to-fuchsia-300 bg-[length:50%_120%] animate-gradient bg-clip-text text-transparent"
            style={{ animationDuration: "4s" }}
          >
            Trans-&-dance
          </span>{" "}
          uses authentication in order to play!
        </h1>

        <h1 className="text-3xl text-gray-900">
          <form action={formAction}>
            Please click
            <button className="px-2 py-1 transition-colors duration-500 bg-green-400 hover:bg-pink-400 text-gray-900 rounded-md m-1">
              HERE
            </button>
            to login with 42 schools
          </form>
        </h1>
      </div>

      {process.env.NODE_ENV === "development" && (
        <div className="p-2 m-2 border-l-2 border-l-white/15 relative">
          <form
            className="flex flex-col gap-y-2 gap-x-1"
            method="POST"
            action={`/api/v1/auth/mock-login`}
          >
            <h1 className="text-2xl font-semibold text-purple-900">
              Login as Developer
            </h1>

            <input
              className="border-b text-gray-900 text-2xl"
              name="username"
              placeholder="Username"
            />
            <button
              className=" text-gray-900 text-2xl px-2 py-1 transition-colors duration-500 bg-purple-500 hover:bg-purple-900 rounded-md m-1"
              type="submit"
            >
              Login
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
