import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redis } from "@/lib/db";
import { canSendPic, afterPicSent } from "@/lib/lockEngine";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { toUserID, base64 } = await req.json();
  if (!toUserID || !base64) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const fromUserID = session.user.userid;

  if (fromUserID === toUserID) {
    return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
  }

  const { allowed, reason } = await canSendPic(fromUserID, toUserID);
  if (!allowed) return NextResponse.json({ error: reason }, { status: 403 });

  const chatKey = `chat:${fromUserID}:${toUserID}`;
  const reverseKey = `chat:${toUserID}:${fromUserID}`;

  const existing = (await redis.get<any[]>(chatKey)) || [];
  const reverseExisting = (await redis.get<any[]>(reverseKey)) || [];
  const isFirstEver = existing.length === 0 && reverseExisting.length === 0;

  const msg = { from: fromUserID, base64, sentAt: Date.now() };

  await redis.set(chatKey, [...existing, msg], { ex: 60 * 60 * 24 });
  await redis.set(reverseKey, [...reverseExisting, msg], { ex: 60 * 60 * 24 });

  await afterPicSent(fromUserID, toUserID, isFirstEver);

  return NextResponse.json({ success: true });
}
