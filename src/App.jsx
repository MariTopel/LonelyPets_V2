// src/App.jsx
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { supabase } from "./supabaseClient";

import Header from "./components/Header.jsx";
import AuthForm from "./components/AuthForm.jsx";
import { Home } from "./pages/Home.jsx";
import { Profile } from "./pages/Profile.jsx";
import { City } from "./pages/City.jsx";
import { Desert } from "./pages/Desert.jsx";
import { Coast } from "./pages/Coast.jsx";
import ChatView from "./components/ChatView.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [pet, setPet] = useState(undefined); // undefined: loading, null: no pet, object: has pet
  const [authOpen, setAuthOpen] = useState(false);

  // Auth initialization and listener
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

  // Load pet when user logs in
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data, error } = await supabase
        .from("pets")
        .select("type, name, personality")
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

  // Auth form control
  function openAuth() {
    setAuthOpen(true);
  }
  function closeAuth() {
    setAuthOpen(false);
  }
  async function handleAuthSuccess() {
    closeAuth();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
  }

  // Sign out
  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
    setPet(undefined);
  }

  // Save pet
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
      {/* Site header */}
      <Header user={user} openAuth={openAuth} handleSignOut={handleSignOut} />

      {/* Auth modal overlay */}
      {authOpen && <AuthForm onSuccess={handleAuthSuccess} />}

      {/* Page routes */}
      <Routes>
        <Route
          path="/"
          element={
            <Home
              user={user}
              pet={pet}
              onSave={handlePetSave}
              openAuth={openAuth}
            />
          }
        />
        <Route path="/profile" element={<Profile user={user} />} />
        <Route path="/city" element={<City />} />
        <Route path="/desert" element={<Desert />} />
        <Route path="/coast" element={<Coast />} />
      </Routes>

      {/* Chat appears below the routed content */}
      {user && pet && <ChatView user={user} pet={pet} />}
      {/* Loading indicator when pet is fetching */}
      {user && pet === undefined && <div>Loading your pet…</div>}
    </Router>
  );
}
