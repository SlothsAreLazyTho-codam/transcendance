"use client";

import { UpdateUsername } from "@/lib/actions/(user)/user.action";
import { useSession } from "@/lib/context/auth.context";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/20/solid";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UpdateNameForm() {
  const { session, client } = useSession();
  const [message, setMessage] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const router = useRouter();

  return (
    <div className="flex flex-col justify-start">
      <form
        onSubmit={(e) => {
          "use client";

          e.preventDefault();
          const formData = new FormData(e.currentTarget);

          UpdateUsername(formData.get("username") as string).then((x) => {
            if (x) {
              setMessage("Username updated!");
              setError(undefined);
            } else {
              setMessage(undefined);
              setError("Couldn't update nickname!");
            }

            router.refresh();
          });
        }}
      >
        <label className="text-xl font-semibold">Your username</label>
        <div className="flex flex-row items-center gap-x-2">
          <div>
            <input
              className="p-2 text-2xl rounded-l-lg w-48 font-bold shadow-md transition-colors duration-300 bg-neutral-800 hover:bg-neutral-500 hover:text-black"
              type="text"
              name="username"
              maxLength={16}
              placeholder={session?.user?.username}
            />

            <button className="rounded-r-md py-2 px-6 text-2xl font-bold transition-colors duration-300 bg-blue-500/50 hover:bg-cyan-300/90 hover:text-black">
              Update
            </button>
          </div>

          <div>
            {message && (
              <div className="flex flex-row items-center gap-x-1">
                <CheckCircleIcon className="w-6 h-6 text-green-500" />
                <h1 className="text-green-500 text-xl">{message}</h1>
              </div>
            )}

            {error && (
              <div className="flex flex-row items-center gap-x-1">
                <XCircleIcon className="w-6 h-6 text-red-500" />
                <h1 className="text-red-500 text-xl">{error}</h1>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
