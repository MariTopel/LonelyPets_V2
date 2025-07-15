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
  //undefined = "loading", null = "no pet yet", object = "pet exists"
  const [pet, setPet] = useState(undefined);

  //fetch initial session and listen for future auth changes
  useEffect(() => {
    async function initAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    }
    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Load pet from DB when user logs in
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data, error } = await supabase
        .from("pets")
        .select("type, name, personality")
        .eq("user_id", user.id)
        .maybeSingle();
      console.log("pet load:", { data, error, status });
      if (error && error.code !== "PGRST116") {
        console.error("Error loading pet:", error);
        setPet(null); // treat error as “no pet”
      } else {
        setPet(data || null);
      }
    })();
  }, [user?.id]);

  // Called after a successful login/sign-up
  const handleAuthSuccess = () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });
  };

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

  // If there's no authenticated user, show the AuthForm
  if (!user) {
    return <AuthForm onSuccess={handleAuthSuccess} />;
  }

  if (pet === undefined) {
    return <div>Loading your pet…</div>;
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
