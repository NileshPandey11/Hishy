"use client";
import { SessionProvider as NextSessionProvider } from "next-auth/react";

export default function SessionProvider({ children, session }: any) {
  return <NextSessionProvider session={session}>{children}</NextSessionProvider>;
}
