import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      userid: string;
      gender: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
