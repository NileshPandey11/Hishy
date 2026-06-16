import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redis } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { base64 } = await req.json();
  if (!base64) return NextResponse.json({ error: "No image provided" }, { status: 400 });

  const user = await redis.get<any>(`user:${session.user.userid}`);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  await redis.set(`user:${session.user.userid}`, { ...user, handPic: base64 });

  return NextResponse.json({ success: true });
}
