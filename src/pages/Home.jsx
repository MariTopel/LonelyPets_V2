// src/pages/Home.jsx
// src/pages/Home.jsx
import React from "react";
import PetForm from "../components/PetForm.jsx";

export function Home({ pet, onSave }) {
  return (
    <div className="home-page">
      <h2>Welcome to Pet AI</h2>
      {pet === null ? (
        // only show form if DB says “no pet yet”
        <PetForm onSave={onSave} />
      ) : (
        // once pet exists, show summary and never show form again
        <p>
          You have a {pet.type} named <strong>{pet.name}</strong> (
          {pet.personality}).
        </p>
      )}
    </div>
  );
}
