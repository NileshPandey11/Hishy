import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { redis } from "./db";

interface UserRecord {
  userid: string;
  password: string;
  gender: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        userid: { label: "User ID", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.userid || !credentials?.password) return null;
        const user = await redis.get<UserRecord>(`user:${credentials.userid}`);
        if (!user) return null;
        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;
        return { id: user.userid, name: user.userid, gender: user.gender } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userid = user.id;
        token.gender = (user as any).gender;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.userid = token.userid as string;
        session.user.gender = token.gender as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};
