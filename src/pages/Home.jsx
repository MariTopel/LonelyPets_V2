// src/pages/Home.jsx
import React from "react";
import PetForm from "../components/PetForm.jsx";

export function Home({ pet, onSave }) {
  return (
    <div className="home-page">
      <h2>Welcome to Pet AI</h2>

      {pet === null ? (
        // Only show the form when the DB says “no pet yet”
        <PetForm onSave={onSave} />
      ) : (
        // Once pet exists, this summary shows—and the form never returns
        <p>
          You have a {pet.type} named <strong>{pet.name}</strong> (
          {pet.personality}).
        </p>
      )}
    </div>
  );
}
