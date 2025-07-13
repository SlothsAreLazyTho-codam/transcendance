"use server";

import { newServerAuthClient } from "@/lib";

export async function FollowUser(id: string) {
  const isFollowing: string[] = await newServerAuthClient()
    .then((client) => client.put(`/api/v1/users/me/follow/${id}`, {}))
    .then((x) => x.json())
    .catch((x) => []);

  try {
    return isFollowing.find((n) => n == id) != undefined;
  } catch {
    return false;
  }
}

export async function BlockUser(id: string) {
  const isBlocked: string[] = await newServerAuthClient()
    .then((client) => client.put(`/api/v1/users/me/block/${id}`, {}))
    .then((x) => x.json())
    .catch((x) => []);

  try {
    return isBlocked.find((n) => n == id) != undefined;
  } catch {
    return false;
  }
}

export async function UpdateUsername(username: string) {
  return newServerAuthClient()
    .then((client) =>
      client.putJSON(
        "/api/v1/users/me",
        {
          username: username,
        },
        {}
      )
    )
    .then((x) => x?.ok);
}
