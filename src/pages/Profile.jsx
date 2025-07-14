// src/pages/Profile.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export function Profile({ user }) {
  const [profile, setProfile] = useState({
    full_name: "",
    favorite_color: "",
    bio: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load existing profile on mount
  useEffect(() => {
    if (!user?.id) return;
    async function loadProfile() {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, favorite_color, bio")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        setError(error.message);
      } else if (data) {
        setProfile(data);
      }
      setLoading(false);
    }
    loadProfile();
  }, [user]);

  function handleChange(e) {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  }

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ user_id: user.id, ...profile }, { onConflict: "user_id" });
    if (error) setError(error.message);
    setLoading(false);
  }

  if (loading) return <div>Loading profile...</div>;

  return (
    <section id="profile">
      <h2>Your Profile</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSave} className="profile-form">
        <label>
          Full Name:
          <input
            name="full_name"
            value={profile.full_name}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Favorite Color:
          <input
            name="favorite_color"
            value={profile.favorite_color}
            onChange={handleChange}
          />
        </label>
        <label>
          Bio:
          <textarea name="bio" value={profile.bio} onChange={handleChange} />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Saving…" : "Save Profile"}
        </button>
      </form>
    </section>
  );
}
