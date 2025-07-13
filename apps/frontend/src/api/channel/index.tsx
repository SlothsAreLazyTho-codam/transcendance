import { newServerAuthClient } from "@/lib";
import { Channel, CreateChannelForm } from "./types";

export async function getAllChannels() {
  const client = await newServerAuthClient();
  const channels = await client.getAs<Channel[]>("/api/v1/channel", {});
  return channels ? channels : [];
}

export async function createChannel(
  name: string,
  password?: string
): Promise<Channel> {
  const client = await newServerAuthClient();
  const form: CreateChannelForm = {
    name: name,
    type: password ? "PRIVATE" : "PUBLIC",
  };
  if (password) {
    form.password = password;
  }

  const channel = await client.postJSON("/api/v1/channel", form, {});

  if (!channel?.ok) {
    throw new Error("Failed to create channel");
  }
  return channel.json();
}
