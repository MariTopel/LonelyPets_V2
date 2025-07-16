// src/pages/Home.jsx
import React from "react";
import PetForm from "../components/PetForm.jsx";

//pet pictures
import dragonImg from "../assets/PetPics/dragon.png";
import catImg from "../assets/PetPics/cat.png";
import dogImg from "../assets/PetPics/dog.png";
import plantImg from "../assets/PetPics/plant.png";
import space_octopusImg from "../assets/PetPics/space-octopus.png";

const PET_IMAGES = {
  dragon: dragonImg,
  cat: catImg,
  dog: dogImg,
  plant: plantImg,
  "space octopus": space_octopusImg,
};

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

  const imgSrc = PET_IMAGES[pet.type];
  return (
    <div className="home-page">
      <div className="summary-card">
        <h2>Your Pet</h2>
        <div classname="pet-summary">
          {imgSrc && (
            <img
              src={imgSrc}
              alt={`${pet.name} the ${pet.type}`}
              className="pet-avatar"
            />
          )}
          <p>
            You have a <strong>{pet.type}</strong> named{" "}
            <strong>{pet.name}</strong> ({pet.personality}).
          </p>
        </div>
      </div>
      <p>Navigate to the map pages above or start a conversation below!</p>
    </div>
  );
}
