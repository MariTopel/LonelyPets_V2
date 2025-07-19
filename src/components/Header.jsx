// src/components/Header.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useCoins } from "../contexts/CoinContext";

export default function Header({ user, openAuth, handleSignOut }) {
  const { coins } = useCoins();
  return (
    <header className="site-header">
      {user && <span>💰 {coins}</span>}
      <div className="logo">
        <Link to="/">LonelyPets</Link>
      </div>
      <nav className="site-nav">
        <Link to="/">Home</Link>
        <Link to="/city">Kingdom of Archaides</Link>
        <Link to="/desert">Snake Sands</Link>
        <Link to="/coast">Eldritch Coast</Link>
        <Link to="/profile">My Profile</Link>
      </nav>
      <div className="auth-buttons">
        {user ? (
          <button onClick={handleSignOut}>Logout</button>
        ) : (
          <button onClick={openAuth}>Login</button>
        )}
      </div>
    </header>
  );
}
