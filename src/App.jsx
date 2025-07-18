import React, { useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { ChatProvider } from "./contexts/ChatContext.jsx";

// website basics
import Header from "./components/Header.jsx";
import AuthForm from "./components/AuthForm.jsx";
import { Home } from "./pages/Home.jsx";
import { Profile } from "./pages/Profile.jsx";

// city pages
import { City } from "./pages/city/City.jsx";
import CityLayout from "./pages/city/CityLayout.jsx";
import Pub from "./pages/city/Pub.jsx";
import Archery from "./pages/city/Archery.jsx";

// other regions
import { Desert } from "./pages/desert/Desert.jsx";
import { Coast } from "./pages/coast/Coast.jsx";

import ChatView from "./components/ChatView.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [pet, setPet] = useState(undefined);
  const [authOpen, setAuthOpen] = useState(false);

  const location = useLocation();

  // Optional: use full pathname directly for AI context
  const currentPage = location.pathname;

  // 1) Auth initialization
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

  // 2) Load pet
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

  // Auth modal controls
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
    <ChatProvider user={user} pet={pet} currentPage={currentPage}>
      <Header user={user} openAuth={openAuth} handleSignOut={handleSignOut} />

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
        <Route path="/desert" element={<Desert />} />
        <Route path="/coast" element={<Coast />} />

        {/* Nested City Routes */}
        <Route path="/city" element={<CityLayout />}>
          <Route index element={<City />} />
          <Route path="pub" element={<Pub />} />
          <Route path="archery" element={<Archery />} />
          {/* Add more like: <Route path="shop" element={<Shop />} /> */}
        </Route>
      </Routes>

      {authOpen && <AuthForm onSuccess={handleAuthSuccess} />}

      {user && pet && <ChatView user={user} pet={pet} />}
      {user && pet === undefined && <div>Loading your pet…</div>}
    </ChatProvider>
  );
}
