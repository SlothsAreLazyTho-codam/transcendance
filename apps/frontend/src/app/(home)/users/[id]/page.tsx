import { getUserById } from "@/api/user";
import { FollowButton, BlockButton } from "@/components/root/button";
import { Avatar } from "@/components/ui/avatar";
import { getSession } from "@/lib/auth";
import MatchList from "@/components/ui/matchlist";

type OnlineStatus = "OFFLINE" | "ONLINE" | "INGAME";

function getColorStatus(status: OnlineStatus) {
  if (status == "INGAME") return "bg-yellow-500";
  if (status == "ONLINE") return "bg-green-500";
  if (status == "OFFLINE") return "bg-gray-500";
  return "bg-gray-500";
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  const { id } = await params;
  const user = await getUserById(id); //Makes a request to /users/default.jpg...
  if (!user || user == undefined) return <>User not found</>;
  const isOwnUser = user.id == session?.user?.id;

  return (
    <div className="container justify-center space-y-6 relative">
      <div className="py-2 px-4 bg-neutral-800 rounded-lg  neon-border text-neutral-300 font-bold">
        <div className="flex flex-row items-center gap-x-5">
          <Avatar user={user} className="w-16 h-16" />
          <div className="flex flex-row w-full justify-between">
            <div>
              <h1 className="text-4xl">
                [{user.id}]{" "}
                {user.username.length > 15
                  ? user.username.slice(0, 15) + "..."
                  : user.username}
              </h1>

              <div className="flex items-center space-x-2">
                <span
                  className={`w-2 h-2 rounded-full ${getColorStatus(
                    user!.status as OnlineStatus
                  )} inline-block`}
                ></span>
                <h1 className="text-xl">{user!.status}</h1>
              </div>

              <div className="flex space-x-4">
                <h1 className="text-xl">
                  {user.followedUsers.length}{" "}
                  <span className="text-white/50">Following</span>
                </h1>
              </div>
            </div>
            {!isOwnUser && (
              <div className="flex flex-row">
                <FollowButton userId={id} />
                <BlockButton userId={id} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 justify-center bg-neutral-800 rounded-lg  neon-border">
        <div>
          <MatchList user={user} limit={10} />
        </div>
      </div>
    </div>
  );
}
