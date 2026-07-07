"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";

export async function loginAction(formData: FormData): Promise<void> {
  const email = formData.get("email")?.toString() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const callbackUrl = formData.get("callbackUrl")?.toString() || "/studio";

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      const params = new URLSearchParams({
        error: "invalid",
        callbackUrl,
      });
      redirect(`/studio/login?${params.toString()}`);
    }

    throw error;
  }
}
