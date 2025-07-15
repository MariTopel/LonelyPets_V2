// src/pages/Home.jsx
import React from "react";
import PetForm from "../components/PetForm.jsx";

export function Home({ user, pet, onSave, openAuth }) {
  // 1) Not logged in → prompt them to log in
  if (!user) {
    return (
      <div className="home-page">
        <h2>Welcome to Pet AI</h2>
        <p>Please log in to adopt your pet and start chatting.</p>
        <button onClick={openAuth}>Log In</button>
      </div>
    );
  }

  // 2) Logged in but pet not yet loaded → show loading
  if (pet === undefined) {
    return (
      <div className="home-page">
        <h2>Welcome back!</h2>
        <p>Loading your pet…</p>
      </div>
    );
  }

  // 3) Logged in and no pet yet → show the form
  if (pet === null) {
    return (
      <div className="home-page">
        <h2>Create Your Pet</h2>
        <PetForm onSave={onSave} />
      </div>
    );
  }

  // 4) Logged in and pet exists → show summary
  return (
    <div className="home-page">
      <h2>Your Pet</h2>
      <p>
        You have a <strong>{pet.type}</strong> named <strong>{pet.name}</strong>{" "}
        ({pet.personality}).
      </p>
      <p>Navigate to the map pages above or start a conversation below!</p>
    </div>
  );
}
