"use client";

import { User } from "@/lib/types/user";
import { useSession } from "@/lib/context/auth.context";
import { NoSymbolIcon, UserPlusIcon } from "@heroicons/react/16/solid";

import { BlockUser, FollowUser } from "@/lib/actions/(user)/user.action";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function isFollowingUser(user: User, id: string) {
  const predicate = user.followedUsers.find(
    (user) => `${user.userId}` != id && `${user.followingId}` == id
  );

  return predicate != undefined;
}

function isUserBlocked(user: User, id: string) {
  const predicate = user.blockedUsers.find(
    (user) => `${user.userId}` != id && `${user.blockedId}` == id
  );

  return predicate != undefined;
}

export function FollowButton({ userId }: { userId: string }) {
  const { session } = useSession();
  const blocked = isUserBlocked(session?.user!, userId);
  const [following, setFollowing] = useState<boolean>(false);

  useEffect(() => {
    setFollowing(isFollowingUser(session?.user!, userId));
  }, []);

  return (
    <>
      {!blocked && (
        <div>
          <form
            onSubmit={(e) => {
              "use client";
              e.preventDefault();
              FollowUser(userId).then((state) => setFollowing(state));
            }}
          >
            <button className="text-white flex p-2 m-2 transition-colors duration-300 bg-blue-500 hover:bg-cyan-300/90 hover:text-black text-center items-center">
              <UserPlusIcon className="w-4 h-4 m-1" />
              {following ? "Unfollow" : "Follow"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}

export function BlockButton({ userId }: { userId: string }) {
  const { session } = useSession();
  const [isBlocked, setBlocked] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    setBlocked(isUserBlocked(session?.user!, userId));
  }, []);

  return (
    <div>
      <form
        onSubmit={async (e) => {
          "use client";
          e.preventDefault();
          BlockUser(userId).then((state) => setBlocked(state));
          router.refresh();
        }}
      >
        <button className="flex p-2 m-2 transition-colors duration-300 bg-rose-700 hover:bg-rose-600 hover:text-black text-center items-center">
          <NoSymbolIcon className="w-4 h-4 m-1" />
          {isBlocked ? "Unblock" : "Block"}
        </button>
      </form>
    </div>
  );
}
