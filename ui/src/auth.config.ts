import type { NextAuthConfig } from "next-auth";
import type { StudioRole } from "@/generated/prisma/client";

export const authConfig = {
  pages: {
    signIn: "/studio/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub && token.role) {
        session.user.id = token.sub;
        session.user.role = token.role as StudioRole;
        session.user.email = token.email ?? session.user.email ?? "";
        session.user.name = token.name ?? session.user.name;
      }
      return session;
    },
  },
  providers: [],
  trustHost: true,
} satisfies NextAuthConfig;
