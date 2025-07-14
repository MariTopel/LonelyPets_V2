// src/App.jsx
import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { supabase } from "./supabaseClient";

// Import your AuthForm
import AuthForm from "./components/AuthForm.jsx";

import { Home } from "./pages/Home.jsx";
import { Profile } from "./pages/Profile.jsx";
import { City } from "./pages/City.jsx";
import { Desert } from "./pages/Desert.jsx";
import { Coast } from "./pages/Coast.jsx";
import ChatView from "./components/ChatView.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [pet, setPet] = useState(null);

  // Listen for Supabase auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Called after a successful login/sign-up
  const handleAuthSuccess = () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });
  };

  async function handlePetSave(petData) {
    if (!user?.id) return;

    // 1) Try fetching an existing row
    const { data: existing, error: fetchErr } = await supabase
      .from("pets")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (fetchErr && fetchErr.code !== "PGRST116") {
      console.error("Fetch pet error:", fetchErr);
      return;
    }

    if (existing) {
      // 2a) Row exists → update it
      const { error: updateErr } = await supabase
        .from("pets")
        .update({
          type: petData.type,
          name: petData.name,
          personality: petData.personality,
        })
        .eq("id", existing.id);
      if (updateErr) console.error("Update pet error:", updateErr);
    } else {
      // 2b) No row → insert new
      const { error: insertErr } = await supabase.from("pets").insert({
        user_id: user.id,
        ...petData,
      });
      if (insertErr) console.error("Insert pet error:", insertErr);
    }

    // 3) Reflect in state
    setPet(petData);
  }

  // If there's no authenticated user, show the AuthForm
  if (!user) {
    return <AuthForm onSuccess={handleAuthSuccess} />;
  }

  return (
    <Router>
      <nav>
        <Link to="/">Home</Link> | <Link to="/profile">Profile</Link> |{" "}
        <Link to="/city">Kingdom of Archaides</Link> |{" "}
        <Link to="/desert">Snake Sands</Link> |{" "}
        <Link to="/coast">Eldritch Coast</Link>
      </nav>

      {/* Show chat only once the user and pet are set */}
      {user && pet && <ChatView user={user} pet={pet} />}

      <Routes>
        <Route path="/" element={<Home pet={pet} onSave={handlePetSave} />} />
        <Route path="/profile" element={<Profile user={user} />} />
        <Route path="/city" element={<City />} />
        <Route path="/desert" element={<Desert />} />
        <Route path="/coast" element={<Coast />} />
      </Routes>
    </Router>
  );
}
