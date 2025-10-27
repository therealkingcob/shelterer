// src/pages/Login.jsx
import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [mode, setMode] = useState("login"); // 'login' or 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // if user already logged in, redirect to home
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session) navigate("/");
    })();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    const res = await supabase.auth.signInWithPassword({ email, password });
    if (res.error) setMessage(res.error.message);
    else {
      setMessage("Logged in");
      navigate("/");
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setMessage("");
    const res = await supabase.auth.signUp({ email, password });
    if (res.error) setMessage(res.error.message);
    else setMessage("Signup OK — check email to confirm (if configured). You can now login.");
  };

  const handleSignout = async () => {
    await supabase.auth.signOut();
    setMessage("Signed out");
    navigate("/");
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>{mode === "login" ? "Login" : "Sign up"}</h2>
      <form onSubmit={mode === "login" ? handleLogin : handleSignup} style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 420 }}>
        <label style={{ display: "flex", justifyContent: "space-between" }}>
          Email:
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label style={{ display: "flex", justifyContent: "space-between" }}>
          Password:
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>

        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" style={{ padding: "6px 12px" }}>
            {mode === "login" ? "Log in" : "Create account"}
          </button>
          <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")} style={{ padding: "6px 12px" }}>
            {mode === "login" ? "Switch to Sign up" : "Switch to Login"}
          </button>
          <button type="button" onClick={handleSignout} style={{ padding: "6px 12px" }}>
            Sign out
          </button>
        </div>
      </form>
      {message && <p style={{ color: "crimson" }}>{message}</p>}
    </div>
  );
}
