import { redis } from "./db";

export type LockType = "24hr" | "1month";

interface LockData {
  type: LockType;
  expiresAt: number;
  picCount: number;
  lastPicAt: number;
}

interface ChatMeta {
  picCount_A: number;
  lastReply_B: number;
  dayCount: number;
  dayStart: number;
}

const LOCK_24HR = 60 * 60 * 24;
const LOCK_1MONTH = 60 * 60 * 24 * 30;

export async function canSendPic(
  senderID: string,
  receiverID: string
): Promise<{ allowed: boolean; reason?: string }> {
  const lockKey = `lock:${senderID}:${receiverID}`;
  const lock = await redis.get<LockData>(lockKey);

  if (lock) {
    if (Date.now() < lock.expiresAt) {
      const remaining = Math.ceil((lock.expiresAt - Date.now()) / 1000 / 60 / 60);
      return {
        allowed: false,
        reason: `${remaining} hours lock remaining`,
      };
    }
    await redis.del(lockKey);
  }

  return { allowed: true };
}

export async function afterPicSent(
  senderID: string,
  receiverID: string,
  isFirstEver: boolean
) {
  const now = Date.now();
  const DAY = 1000 * 60 * 60 * 24;

  // First ever pic — just store meta and return
  if (isFirstEver) {
    await redis.set(`chatmeta:${senderID}:${receiverID}`, {
      picCount_A: 1,
      lastReply_B: 0,
      dayCount: 0,
      dayStart: now,
    });
    return;
  }

  const metaKey = `chatmeta:${senderID}:${receiverID}`;
  const meta = (await redis.get<ChatMeta>(metaKey)) || {
    picCount_A: 0,
    lastReply_B: 0,
    dayCount: 0,
    dayStart: now,
  };

  // If other side has replied, reset counters — conversation is active
  if (meta.lastReply_B > 0) {
    await redis.set(metaKey, { ...meta, picCount_A: 1 });
    return;
  }

  // New day reset
  if (now - meta.dayStart > DAY) {
    meta.dayCount += 1;
    meta.picCount_A = 0;
    meta.dayStart = now;
  }

  meta.picCount_A += 1;

  // 3 pics in one day without reply → 24hr lock
  if (meta.picCount_A >= 3) {
    if (meta.dayCount >= 7) {
      // 7 days one-sided → 1 month lock
      await redis.set(
        `lock:${senderID}:${receiverID}`,
        {
          type: "1month",
          expiresAt: now + LOCK_1MONTH * 1000,
          picCount: meta.picCount_A,
          lastPicAt: now,
        },
        { ex: LOCK_1MONTH }
      );
    } else {
      await redis.set(
        `lock:${senderID}:${receiverID}`,
        {
          type: "24hr",
          expiresAt: now + LOCK_24HR * 1000,
          picCount: meta.picCount_A,
          lastPicAt: now,
        },
        { ex: LOCK_24HR }
      );
    }
    meta.picCount_A = 0;
  }

  await redis.set(metaKey, meta);
}

export async function afterPicReceived(senderID: string, receiverID: string) {
  const metaKey = `chatmeta:${senderID}:${receiverID}`;
  const meta = await redis.get<ChatMeta>(metaKey);
  if (!meta) return;
  await redis.set(metaKey, { ...meta, lastReply_B: Date.now() });
}

export async function getLockStatus(
  senderID: string,
  receiverID: string
): Promise<{ locked: boolean; reason?: string; type?: LockType }> {
  const lockKey = `lock:${senderID}:${receiverID}`;
  const lock = await redis.get<LockData>(lockKey);
  if (!lock) return { locked: false };
  if (Date.now() >= lock.expiresAt) {
    await redis.del(lockKey);
    return { locked: false };
  }
  const remaining = Math.ceil((lock.expiresAt - Date.now()) / 1000 / 60 / 60);
  return {
    locked: true,
    type: lock.type,
    reason: `${remaining} hours remaining`,
  };
}
