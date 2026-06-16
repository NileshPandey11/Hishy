"use client";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";

interface Message {
  from: string;
  base64: string;
  sentAt: number;
}

interface LockStatus {
  locked: boolean;
  reason?: string;
  type?: string;
}

export default function ChatPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const otherID = params.id as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [lock, setLock] = useState<LockStatus>({ locked: false });
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const myId = session?.user?.userid;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (!otherID || status !== "authenticated") return;

    function fetchMessages() {
      fetch(`/api/message/${otherID}`)
        .then((r) => r.json())
        .then((d) => {
          setMessages(d.messages || []);
          setLock(d.lock || { locked: false });
        });
    }

    fetchMessages();
    const poll = setInterval(fetchMessages, 4000);
    return () => clearInterval(poll);
  }, [otherID, status]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function sendPic() {
    if (!preview || sending) return;
    setSending(true);
    setError("");

    const res = await fetch("/api/message/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toUserID: otherID, base64: preview }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      setSending(false);
      return;
    }

    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
    setSending(false);

    fetch(`/api/message/${otherID}`)
      .then((r) => r.json())
      .then((d) => { setMessages(d.messages || []); setLock(d.lock || { locked: false }); });
  }

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a" }}>
        <p style={{ color: "#333" }}>...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #1a1a1a", display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={() => router.push("/feed")}
          style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 18, padding: 0, lineHeight: 1 }}
        >
          ←
        </button>
        <span style={{ color: "#555", fontSize: 13 }}>silent</span>
        {lock.locked && (
          <span style={{ marginLeft: "auto", color: "#ff4444", fontSize: 11 }}>
            🔒 {lock.reason}
          </span>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, padding: 16, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.length === 0 && (
          <p style={{ color: "#222", fontSize: 13, textAlign: "center", marginTop: 60 }}>
            say something without words
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            style={{ display: "flex", justifyContent: m.from === myId ? "flex-end" : "flex-start" }}
          >
            <img
              src={m.base64}
              alt="pic"
              style={{
                maxWidth: "65%",
                borderRadius: 10,
                border: "1px solid #1e1e1e",
                display: "block",
              }}
            />
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && (
        <p style={{ color: "#ff4444", fontSize: 12, textAlign: "center", padding: "6px 0", margin: 0 }}>
          {error}
        </p>
      )}

      {/* Input */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid #1a1a1a" }}>
        {lock.locked ? (
          <div style={{ padding: "14px 0", textAlign: "center", color: "#333", fontSize: 13 }}>
            locked — {lock.reason}
          </div>
        ) : preview ? (
          <div>
            <img
              src={preview}
              alt="preview"
              style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 10, marginBottom: 10 }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => { setPreview(null); if (inputRef.current) inputRef.current.value = ""; }}
                style={{ flex: 1, padding: "10px 0", background: "transparent", color: "#444", border: "1px solid #2a2a2a", borderRadius: 8, cursor: "pointer", fontSize: 14 }}
              >
                Cancel
              </button>
              <button
                onClick={sendPic}
                disabled={sending}
                style={{ flex: 1, padding: "10px 0", background: "#fff", color: "#000", border: "none", borderRadius: 8, fontWeight: 500, cursor: "pointer", fontSize: 14, opacity: sending ? 0.5 : 1 }}
              >
                {sending ? "..." : "Send"}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            style={{
              width: "100%",
              padding: "13px 0",
              background: "#111",
              color: "#333",
              border: "1px dashed #1e1e1e",
              borderRadius: 10,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            + pic
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onFileChange}
          style={{ display: "none" }}
        />
      </div>
    </div>
  );
}
