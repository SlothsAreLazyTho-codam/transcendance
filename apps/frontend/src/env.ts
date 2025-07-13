import { z } from "zod";
import { createEnv } from "@t3-oss/env-nextjs";

export const Pages = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Game",
    href: "/game",
  },
  {
    label: "About us",
    href: "/aboutus",
  },
];

export const env = createEnv({
  server: {
    API_URL: z.string().url(),
  },
  runtimeEnv: {
    API_URL: `https://${process.env.API_URL}:8080`,
  },
});
