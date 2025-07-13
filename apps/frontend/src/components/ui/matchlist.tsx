"use server";

import { getSession } from "@/lib/auth";
import { User } from "@/lib/types/user";
import Match, { MatchType } from "./match";
import { newServerAuthClient } from "@/lib";

export default async function MatchList({
  user,
}: {
  user: User;
  limit: number;
}) {
  const client = await newServerAuthClient();

  const matches = await client
    .getAs<MatchType[]>(`api/v1/users/${user.id}/matches`, {})
    .then((matches) => {
      if (matches) {
        return matches.sort((match) => match.id);
      }

      return [];
    });

  return (
    <>
      <div className="flex flex-col overflow-y-auto max-h-96">
        {matches.length >= 1 ? (
          matches.map((match) => (
            <Match key={match.id} user={user} match={match} />
          ))
        ) : (
          <>Player has not played any games yet!</>
        )}
      </div>
    </>
  );
}
