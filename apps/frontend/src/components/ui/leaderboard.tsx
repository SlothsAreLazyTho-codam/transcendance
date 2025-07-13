import { newServerAuthClient } from "@/lib";
import Image from "next/image";
import Link from "next/link";

export type Leaderboard = {
  position: number;
  userId: number;
  username: string;
  matchesWon: number;
  matchesLost: number;
  winRate: number;
};

export const getTrophyColor = (position: number) => {
  switch (position) {
    case 1:
      return "bg-gradient-to-r from-amber-300 via-amber-600 to-amber-300 bg-[length:200%_1000%] animate-[gradientShift_3s_ease_infinite] shadow-lg shadow-black";
    case 2:
      return "bg-gradient-to-l from-slate-400 via-gray-200 to-slate-400 bg-[length:200%_1000%] animate-[gradientShift_3s_ease_infinite] shadow-lg shadow-black";
    case 3:
      return "bg-gradient-to-br from-amber-800 via-orange-700 to-yellow-900 bg-[length:1000%_1500%] animate-[gradientShift_3s_ease_infinite] shadow-lg shadow-black";
    default:
      return "bg-gray-700 shadow-lg shadow-black";
  }
};

export async function getLeaderboard(): Promise<Leaderboard[]> {
	return newServerAuthClient().then((client) => client.getArrayAs<Leaderboard>("/api/v1/leaderboard", {}))
}

export default async function Leaderboard() {
  const leaderboard = await getLeaderboard();

  if (leaderboard.length == 0)
    return (
      <h1 className="text-red-50 font-semibold">
        Leaderboard is unavailable right now, try again later!
      </h1>
    );

  return (
    <div className="flex flex-col border p-4 rounded-lg bg-neutral-900 shadow w-full neon-border">
      <div className="rounded-lg space-y-2">
        <h1 className="text-4xl font-semibold">Leaderboard</h1>
        <p className="w-full h-[3px] bg-gradient-to-r from-fuchsia-500 via-cyan-500 to-lime-500 bg-[length:200%_100%] animate-[gradientShift_3s_ease_infinite]"></p>
      </div>

      <div>
        {leaderboard &&
          leaderboard.map((score) => (
            <div
              key={score.userId}
              className="flex items-center py-4 space-x-4"
            >
              <Image
                className={`w-16 h-16 p-2 rounded-2xl ${getTrophyColor(
                  score.position
                )}`}
                src="/cup.png"
                alt="Trophy"
                width={64}
                height={64}
              />
              <div className="flex flex-col">
                <Link
                  href={`/users/${score.userId}`}
                  className="px-2 cursor-pointer text-3xl transition-colors duration-300 bg-transparent hover:bg-cyan-300 hover:text-black rounded-md overflow-hidden whitespace-nowrap text-ellipsis"
                >
                  {score.position}.{" "}
                  {score.username.length > 10
                    ? `${score.username.substring(0, 10)}...`
                    : score.username}
                </Link>
                <div
                  className="flex flex-row gap-x-2
                "
                >
                  <h1 className="px-2 text-xl">
                    {score.matchesWon}{" "}
                    <span className="text-lime-300">Wins</span>
                  </h1>
                  <h1 className="px-2 text-xl">
                    {score.winRate}% <span className="text-rose-500">Rate</span>
                  </h1>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
