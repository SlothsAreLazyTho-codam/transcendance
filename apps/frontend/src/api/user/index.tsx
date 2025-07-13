import { newServerAuthClient } from "@/lib";
import { User } from "@/lib/types/user";

export async function getUserById(id: string) {
  return newServerAuthClient().then((client) =>
    client.getAs<User>(`/api/v1/users/${id}`, {})
  );
}

export async function getUser() {
  return newServerAuthClient().then((client) =>
    client.getAs<User>(`/api/v1/users/me`, {})
  );
}
