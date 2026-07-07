"use server";

import { signOut } from "@/auth";

export async function studioLogout(): Promise<void> {
  await signOut({ redirectTo: "/studio/login" });
}
