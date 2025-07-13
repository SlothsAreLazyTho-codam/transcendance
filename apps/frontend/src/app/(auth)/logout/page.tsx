export const dynamic = 'force-dynamic';

import { logout } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Page() {
  return logout().then(() => redirect("/login"));
}
