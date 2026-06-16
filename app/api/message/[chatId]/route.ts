import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redis } from "@/lib/db";
import { afterPicReceived, getLockStatus } from "@/lib/lockEngine";

export async function GET(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const myId = session.user.userid;
  const otherID = params.chatId;

  const key1 = `chat:${myId}:${otherID}`;
  const key2 = `chat:${otherID}:${myId}`;

  const msgs1 = (await redis.get<any[]>(key1)) || [];
  const msgs2 = (await redis.get<any[]>(key2)) || [];

  const all = [...msgs1, ...msgs2].sort((a, b) => a.sentAt - b.sentAt);

  const lockStatus = await getLockStatus(myId, otherID);

  await afterPicReceived(otherID, myId);

  return NextResponse.json({ messages: all, lock: lockStatus });
}
