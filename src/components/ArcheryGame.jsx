// src/components/ArcheryGame.jsx
import React from "react";
import { useCoins } from "../contexts/CoinContext";

/**
 * Temporary placeholder for the Archery mini-game.
 * Displays current coins and a demo button to add coins.
 */
export default function ArcheryGame() {
  const { coins, addCoins } = useCoins();

  return (
    <div style={{ textAlign: "center", margin: "2rem 0" }}>
      <h2>🏹 Archery Game Coming Soon!</h2>
      <p>
        Your current coin balance: <strong>{coins}</strong>
      </p>
      <button
        onClick={() => addCoins(10)}
        style={{ padding: "0.5rem 1rem", marginTop: "1rem" }}
      >
        Demo: +10 Coins
      </button>
    </div>
  );
}
