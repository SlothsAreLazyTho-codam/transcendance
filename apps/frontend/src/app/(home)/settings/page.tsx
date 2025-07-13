"use client";

export const dynamic = "force-dynamic";

import UpdateImageForm from "./_forms/UpdateImageForm";
import UpdateNameForm from "./_forms/UpdateNameForm";

import { logout } from "@/lib/auth";

import Update2FAForm from "./_forms/Update2FAForm";
import { CheckCircleIcon, TrashIcon } from "@heroicons/react/20/solid";
import { DisableTwoFactorAuthentication } from "@/lib/actions/(auth)/2fa.action";
import { useSession } from "@/lib/context/auth.context";
import { useRouter } from "next/navigation";

export default function Page() {
  const { session } = useSession();
  const router = useRouter();

  return (
    <div className="bg-neutral-900 p-4 rounded-lg neon-border relative">
      <div className="flex flex-col lg:flex-row w-full gap-6">
        <div className="w-full flex flex-col gap-y-4">
          <h1 className="text-4xl font-bold">
            Here you find the settings of your profile!
          </h1>

          <div className="w-full h-[3px] bg-gradient-to-r from-fuchsia-500 via-cyan-500 to-lime-500 bg-[length:200%_100%] animate-[gradientShift_3s_ease_infinite]" />

          <div className="p-2 rounded-lg bg-neutral-900">
            <h1 className="text-2xl font-semibold">Upload your own avatar</h1>
            <UpdateImageForm />
          </div>

          <div className="flex flex-col gap-y-2 p-2 rounded-lg bg-neutral-900">
            <h1 className="text-2xl font-semibold">Change your nickname</h1>
            <UpdateNameForm />
          </div>

          <div className="flex flex-col gap-y-2 bg-black/15 p-2 rounded-lg">
            <h1 className="text-2xl font-semibold">2 Factor Authentication</h1>
            {session?.user?.otp ? (
              <div className="flex flex-row items-center gap-x-4">
                <div className="flex flex-row items-center">
                  <CheckCircleIcon className="text-green-500 m-2 w-6 h-6" />
                  <h1 className="text-2xl text-green-500">
                    2FA is enabled on this account
                  </h1>
                </div>

                <div>
                  <button
                    className="p-2 bg-red-500 rounded-lg text-white hover:bg-red-500/25 transition-colors duration-150"
                    onClick={() => {
                      "use client";
                      DisableTwoFactorAuthentication();
                      router.refresh();
                    }}
                  >
                    <TrashIcon className="w-8 h-8" />
                  </button>
                </div>
              </div>
            ) : (
              <Update2FAForm />
            )}
          </div>

          <div className="w-full h-[3px] bg-gradient-to-r from-fuchsia-500 via-cyan-500 to-lime-500 bg-[length:200%_100%] animate-[gradientShift_3s_ease_infinite]" />

          <div className="flex flex-col gap-y-2 bg-black/15 p-4 rounded-lg">
            <div className="flex flex-row gap-x-4">
              <button
                className="px-6 py-2 font-bold transition-colors duration-300 bg-rose-600/50 hover:bg-rose-600 hover:text-black rounded-md"
                onClick={async () => {
                  await logout(); //Doesn't work!
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
