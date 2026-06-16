"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  background: "#1a1a1a",
  border: "1px solid #2a2a2a",
  borderRadius: 8,
  color: "#fff",
  fontSize: 14,
  marginBottom: 12,
  boxSizing: "border-box",
  outline: "none",
};

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ userid: "", password: "", gender: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    setError("");

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      setLoading(false);
      return;
    }

    await signIn("credentials", {
      userid: form.userid,
      password: form.password,
      redirect: false,
    });

    router.push("/hand");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a" }}>
      <div style={{ width: 340, padding: 32, background: "#111", borderRadius: 16, border: "1px solid #1e1e1e" }}>
        <h1 style={{ color: "#fff", fontSize: 24, marginBottom: 4, fontWeight: 600, letterSpacing: "-0.5px" }}>Hishy</h1>
        <p style={{ color: "#444", fontSize: 13, marginBottom: 28 }}>Hello, shy people.</p>

        <input
          placeholder="Choose a user ID"
          value={form.userid}
          onChange={(e) => setForm({ ...form, userid: e.target.value })}
          style={inputStyle}
          autoComplete="off"
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          style={inputStyle}
        />

        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          {["male", "female"].map((g) => (
            <button
              key={g}
              onClick={() => setForm({ ...form, gender: g })}
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: 8,
                border: "1px solid",
                borderColor: form.gender === g ? "#fff" : "#2a2a2a",
                background: form.gender === g ? "#fff" : "transparent",
                color: form.gender === g ? "#000" : "#555",
                cursor: "pointer",
                fontSize: 14,
                textTransform: "capitalize",
                transition: "all 0.15s",
              }}
            >
              {g}
            </button>
          ))}
        </div>

        {error && (
          <p style={{ color: "#ff4444", fontSize: 13, marginBottom: 12 }}>{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !form.userid || !form.password || !form.gender}
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
            opacity: loading || !form.userid || !form.password || !form.gender ? 0.4 : 1,
            transition: "opacity 0.15s",
          }}
        >
          {loading ? "Creating..." : "Enter"}
        </button>

        <p style={{ color: "#333", fontSize: 12, textAlign: "center", marginTop: 16 }}>
          Already here?{" "}
          <a href="/login" style={{ color: "#666", textDecoration: "none" }}>
            Login
          </a>
        </p>
      </div>
    </div>
  );
}
