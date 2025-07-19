// src/pages/city/Shop.jsx
import React from "react";
import shopImg from "../../assets/UI/city/shop.png";
import { useCoins } from "../../contexts/CoinContext";

const ITEMS = [
  { id: 1, name: "Healing Potion", price: 5 },
  { id: 2, name: "Feathered Arrow", price: 3 },
  // Add more items here as needed
];

export default function Shop() {
  const { coins, addCoins } = useCoins();

  const buy = (price) => {
    if (coins < price) {
      return alert("Not enough coins!");
    }
    addCoins(-price);
    alert("Purchase successful!");
  };

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto", textAlign: "center" }}>
      <img
        src={shopImg}
        alt="Shop"
        style={{ width: "100%", borderRadius: 8, marginBottom: "1rem" }}
      />
      <h1>🏪 General Store</h1>
      <p>Your balance: {coins} coins</p>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {ITEMS.map((it) => (
          <li key={it.id} style={{ margin: "0.5rem 0" }}>
            {it.name} — {it.price} coins{" "}
            <button onClick={() => buy(it.price)}>Buy</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
