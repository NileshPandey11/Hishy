import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redis } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const myGender = session.user.gender;
  const myId = session.user.userid;
  const oppositeGender = myGender === "male" ? "female" : "male";

  const allUsers = await redis.smembers("feed:all");
  const others = allUsers.filter((id) => id !== myId);

  const users = await Promise.all(
    others.map(async (id) => {
      const u = await redis.get<{ userid: string; gender: string; handPic?: string }>(`user:${id}`);
      return u;
    })
  );

  const filtered = users
    .filter((u) => u && u.gender === oppositeGender && u.handPic)
    .map((u) => ({ userid: u!.userid, handPic: u!.handPic }));

  return NextResponse.json({ users: filtered });
}
