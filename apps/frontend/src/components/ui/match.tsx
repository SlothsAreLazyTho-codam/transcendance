import { User } from "@/lib/types/user";
import Image from "next/image";

export type MatchType = {
  id: number;
  winnerScore: number;
  loserScore: number;
  winner: User;
  loser: User;
};

export default function Match({
  match,
  user,
}: {
  match: MatchType;
  user: User;
}) {
  return (
    <>
      <div className="relative flex items-center justify-between p-2 my-2 bg-linear-to-r from-green-700 to-red-700 rounded-lg shadow-lg hover:scale-105 transition-transform duration-300">
        <div className="flex flex-row gap-x-10 top-0 items-center text-center">
          <div className="flex gap-x-4">
            <h1 className="text-xl font-bold text-green-300">Winner</h1>
            <h2 className="text-lg font-semibold text-white">
              {match.winner.username}
            </h2>
          </div>
          <div className="flex m-2">
            <p className="text-lg text-green-400">{match.winnerScore} Points</p>
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src="/pingpongbats.png"
            width={96}
            height={96}
            className="w-16 h-16 opacity-90"
            alt="Clashing bats"
          />
        </div>

        <div className="flex flex-row gap-x-10 items-center text-center">
          <div className="flex m-2">
            <p className="text-lg text-red-400">{match.loserScore} Points</p>
          </div>
          <div className="flex gap-x-4">
            <h2 className="text-lg font-semibold text-white">
              {match.loser.username}
            </h2>
            <h1 className="text-xl font-bold text-red-300">Loser</h1>
          </div>
        </div>
      </div>
    </>
  );
}
