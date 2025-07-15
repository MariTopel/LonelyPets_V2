// src/App.jsx
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { supabase } from "./supabaseClient";

import AuthForm from "./components/AuthForm.jsx";
import { Home } from "./pages/Home.jsx";
import { Profile } from "./pages/Profile.jsx";
import { City } from "./pages/City.jsx";
import { Desert } from "./pages/Desert.jsx";
import { Coast } from "./pages/Coast.jsx";
import ChatView from "./components/ChatView.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  // undefined = loading (only after login), null = no pet yet, object = pet exists
  const [pet, setPet] = useState(undefined);
  const [authOpen, setAuthOpen] = useState(false);

  // 1) Auth listener & initial session
  useEffect(() => {
    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    }
    init();
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // 2) Load pet only when user logs in
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data, error } = await supabase
        .from("pets")
        .select("type,name,personality")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error && error.code !== "PGRST116") {
        console.error("Error loading pet:", error);
        setPet(null);
      } else {
        setPet(data || null);
      }
    })();
  }, [user?.id]);

  // 3) Handlers to open/close auth modal
  function openAuth() {
    setAuthOpen(true);
  }
  function closeAuth() {
    setAuthOpen(false);
  }

  // 4) After successful login/sign-up
  async function handleAuthSuccess() {
    closeAuth();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
  }

  // 5) Sign out
  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
    setPet(undefined);
  }

  // 6) Save new pet (insert only once)
  async function handlePetSave(petData) {
    if (!user?.id) return;
    const { error } = await supabase
      .from("pets")
      .insert({ user_id: user.id, ...petData });
    if (error) {
      console.error("Failed to save pet:", error);
      return;
    }
    setPet(petData);
  }

  return (
    <Router>
      <nav style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <Link to="/">Home</Link>
        <Link to="/profile">Profile</Link>
        <Link to="/city">City</Link>
        <Link to="/desert">Desert</Link>
        <Link to="/coast">Coast</Link>

        {user ? (
          <button onClick={handleSignOut} style={{ marginLeft: "auto" }}>
            Sign Out
          </button>
        ) : (
          <button onClick={openAuth} style={{ marginLeft: "auto" }}>
            Login
          </button>
        )}
      </nav>

      {/* Auth modal */}
      {authOpen && <AuthForm onSuccess={handleAuthSuccess} />}

      {/* Only show chat once user AND pet exist */}
      {user && pet && <ChatView user={user} pet={pet} />}

      {/* Show loading if user is logged in but pet not yet fetched */}
      {user && pet === undefined && <div>Loading your pet…</div>}

      <Routes>
        <Route
          path="/"
          element={
            <Home pet={pet} onSave={handlePetSave} openAuth={openAuth} />
          }
        />
        <Route path="/profile" element={<Profile user={user} />} />
        <Route path="/city" element={<City />} />
        <Route path="/desert" element={<Desert />} />
        <Route path="/coast" element={<Coast />} />
      </Routes>
    </Router>
  );
}
