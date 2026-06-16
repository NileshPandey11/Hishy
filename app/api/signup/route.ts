import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { redis } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { userid, password, gender } = await req.json();

  if (!userid || !password || !gender) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  if (userid.length < 3 || userid.length > 20) {
    return NextResponse.json({ error: "User ID must be 3-20 characters" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const exists = await redis.get(`user:${userid}`);
  if (exists) {
    return NextResponse.json({ error: "User ID already taken" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 10);

  await redis.set(`user:${userid}`, {
    userid,
    password: hashed,
    gender,
    handPic: null,
    createdAt: Date.now(),
  });

  await redis.sadd("feed:all", userid);

  return NextResponse.json({ success: true });
}
