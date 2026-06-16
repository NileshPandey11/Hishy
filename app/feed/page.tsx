"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface FeedUser {
  userid: string;
  handPic: string;
}

export default function FeedPage() {
  const router = useRouter();
  const { status } = useSession();
  const [users, setUsers] = useState<FeedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/feed")
      .then((r) => r.json())
      .then((d) => { setUsers(d.users || []); setLoading(false); });
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a" }}>
        <p style={{ color: "#333", fontSize: 13 }}>...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", padding: "24px 16px", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ color: "#fff", fontSize: 20, fontWeight: 600, margin: 0, letterSpacing: "-0.5px" }}>Hishy</h1>
        <span style={{ color: "#333", fontSize: 12 }}>{users.length} hands</span>
      </div>

      {users.length === 0 ? (
        <div style={{ textAlign: "center", marginTop: 120 }}>
          <p style={{ color: "#2a2a2a", fontSize: 14 }}>No one here yet.</p>
          <p style={{ color: "#222", fontSize: 12, marginTop: 6 }}>Be the first to show your hand.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {users.map((u) => (
            <div
              key={u.userid}
              onClick={() => router.push(`/chat/${u.userid}`)}
              style={{
                borderRadius: 12,
                overflow: "hidden",
                cursor: "pointer",
                aspectRatio: "1",
                background: "#1a1a1a",
                border: "1px solid #1e1e1e",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <img
                src={u.handPic}
                alt="hand"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
