import type { StudioRole } from "@/generated/prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: StudioRole;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: StudioRole;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: StudioRole;
  }
}
