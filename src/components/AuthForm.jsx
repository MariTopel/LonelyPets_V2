// src/components/AuthForm.jsx
import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function AuthForm({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Try sign-up (if new), else fall back to sign-in
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (signUpError && !signUpError.message.includes("already registered")) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Now sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
    } else {
      onSuccess?.();
    }
    setLoading(false);
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>Login / Sign Up</h2>
      {error && <p className="error">{error}</p>}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={loading}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        disabled={loading}
      />
      <button type="submit" disabled={loading}>
        {loading ? "Working…" : "Go"}
      </button>
    </form>
  );
}
