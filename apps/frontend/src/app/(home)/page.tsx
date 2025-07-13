export const dynamic = 'force-dynamic';

import Leaderboard from "@/components/ui/leaderboard";
import { createChannel } from "@/api/channel";
import { getSession, logout } from "@/lib/auth";
import QueueSelectorButton from "@/components/ui/queuebutton";

export default async function Home() {
  const session = await getSession();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full relative">
      <div className="p-8 bg-neutral-900 rounded-lg shadow-lg w-full col-span-1 sm:col-span-2 neon-border">
        <h1 className="text-4xl text-neutral-300 font-bold">
          Welcome back,
          <span className="font-semibold">
            {(session?.user?.username ?? "").length > 10
              ? `${(session?.user?.username ?? "").slice(0, 10)}...`
              : session?.user?.username ?? ""}
          </span>
        </h1>

        <h1 className="text-lg leading-3 text-neutral-300">
          Transendance is running in{" "}
          <span className="text-lime-300">{process.env.NODE_ENV}</span>
        </h1>

        <div className="p-2 gap-x-4 space-x-4">
          <button
            className="px-5 py-3 text-2xl font-bold transition-colors duration-300 bg-blue-500/50 hover:bg-cyan-300/90 hover:text-black rounded-md"
            onClick={async () => {
              "use server";

              await createChannel("dummy1");
              await createChannel("dummy2");
              await createChannel("dummy3");
              await createChannel("dummy4", "test");
            }}
          >
            Create Dummy Channels
          </button>

        </div>
      </div>

      <div className="col-span-1 sm:col-span-2 lg:col-span-1">
        <Leaderboard />
      </div>

      <div className="col-span-1 sm:col-span-2 lg:col-span-2 p-4 bg-neutral-900 rounded-md neon-border">
        <h1 className="text-4xl font-semibold">
          Play{" "}
          <span className="gradient-animation text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-cyan-300 to-fuchsia-300">
            PingPong
          </span>
          !
        </h1>
        <div className="flex flex-col">
          {session?.jwt && <QueueSelectorButton />}
        </div>
      </div>
    </div>
  );
}
