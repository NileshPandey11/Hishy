"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function HandPage() {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleUpload() {
    if (!preview) return;
    setLoading(true);
    await fetch("/api/hand", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64: preview }),
    });
    router.push("/feed");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a" }}>
      <div style={{ width: 340, padding: 32, background: "#111", borderRadius: 16, border: "1px solid #1e1e1e", textAlign: "center" }}>
        <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 500, marginBottom: 6 }}>Your hand</h2>
        <p style={{ color: "#444", fontSize: 13, marginBottom: 24 }}>This is how others will see you</p>

        {preview ? (
          <img
            src={preview}
            alt="hand preview"
            style={{ width: "100%", borderRadius: 10, marginBottom: 16, aspectRatio: "1", objectFit: "cover" }}
          />
        ) : (
          <div
            onClick={() => inputRef.current?.click()}
            style={{
              width: "100%",
              aspectRatio: "1",
              border: "1px dashed #2a2a2a",
              borderRadius: 10,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              marginBottom: 16,
              color: "#333",
              fontSize: 13,
              gap: 8,
            }}
          >
            <span style={{ fontSize: 28 }}>✋</span>
            <span>Tap to take a photo</span>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onFileChange}
          style={{ display: "none" }}
        />

        {preview && (
          <button
            onClick={() => { setPreview(null); if (inputRef.current) inputRef.current.value = ""; }}
            style={{
              width: "100%",
              padding: "10px 0",
              background: "transparent",
              color: "#444",
              border: "1px solid #2a2a2a",
              borderRadius: 8,
              fontSize: 14,
              cursor: "pointer",
              marginBottom: 10,
            }}
          >
            Retake
          </button>
        )}

        <button
          onClick={preview ? handleUpload : () => inputRef.current?.click()}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px 0",
            background: "#fff",
            color: "#000",
            border: "none",
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 500,
            cursor: "pointer",
            opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? "Saving..." : preview ? "Continue" : "Take photo"}
        </button>
      </div>
    </div>
  );
}
