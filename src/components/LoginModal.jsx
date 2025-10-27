import React, { useState } from "react";
import { supabase } from "../services/supabase";

/*
 Props:
  - open (bool)
  - onClose()
*/
export default function LoginModal({ open, onClose }) {
  const [mode, setMode] = useState("login"); // 'login' or 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  if (!open) return null;

  const handleSignup = async (e) => {
    e.preventDefault();
    setMsg("");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setMsg(error.message);
    else setMsg("Signup OK — check your email if confirmations are enabled.");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMsg("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMsg(error.message);
    else {
      setMsg("Signed in");
      onClose();
    }
  };

  return (
    <div style={{
      position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
      zIndex: 2200, width: 360, background: "white", padding: 18, borderRadius: 12, boxShadow: "0 8px 30px rgba(0,0,0,0.25)"
    }}>
      <h3 style={{ marginTop: 0 }}>{mode === "login" ? "Sign in" : "Sign up"}</h3>
      <form onSubmit={mode === "login" ? handleLogin : handleSignup} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label style={{ display: "flex", justifyContent: "space-between" }}>
          Email:
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label style={{ display: "flex", justifyContent: "space-between" }}>
          Password:
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>

        {msg && <div style={{ color: "crimson" }}>{msg}</div>}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          <button type="button" onClick={onClose} style={{ padding: "8px 12px" }}>Cancel</button>
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")} style={{ padding: "8px 12px" }}>
              {mode === "login" ? "Switch to Sign up" : "Switch to Sign in"}
            </button>
            <button type="submit" style={{ background: "#059669", color: "white", padding: "8px 12px", border: "none", borderRadius: 6 }}>
              {mode === "login" ? "Sign in" : "Create account"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
