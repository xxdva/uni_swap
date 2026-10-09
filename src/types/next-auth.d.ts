import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "STUDENT" | "MENTOR" | "ADMIN";
      isBlocked: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "STUDENT" | "MENTOR" | "ADMIN";
    isBlocked?: boolean;
  }
}
