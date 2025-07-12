// src/pages/Home.jsx
import { useState } from "react";
import PetForm from "../components/PetForm.jsx";

export function Home({ pet, onSave }) {
  // keep a local pet so form unmounts after save
  const [localPet, setLocalPet] = useState(pet);

  const handleSave = (petData) => {
    setLocalPet(petData);
    onSave(petData); // this must be defined by App.jsx
  };

  return (
    <div className="home-page">
      <h2>Welcome to Pet AI</h2>
      {!localPet ? (
        // Pass the correctly named prop
        <PetForm onSave={handleSave} />
      ) : (
        <p>
          You have a {localPet.type} named <strong>{localPet.name}</strong> (
          {localPet.personality}).
        </p>
      )}
    </div>
  );
}
