import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: "STUDENT" | "HOST" | "ADMIN";
    } & DefaultSession["user"];
  }

  interface User {
    role: "STUDENT" | "HOST" | "ADMIN";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "STUDENT" | "HOST" | "ADMIN";
  }
}
