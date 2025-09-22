// src/pages/city/Shop.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { useCoins } from "../../contexts/CoinContext";
import { Link } from "react-router-dom";
import { useChat } from "../../contexts/ChatContext"; //allows the sendSystemMessage thingy to work
import shop from "../../assets/UI/city/shop.png";

export default function Shop() {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const { coins, addCoins } = useCoins(); // addCoins(negative) to spend
  const { sendSystemMessage } = useChat();

  useEffect(() => {
    sendSystemMessage(
      "The user has arrived at the shop. There is a Tupilaq shopkeeper. They come from the cold north and are made of human and animal parts and brought to life by a witch."
    );
  }, []);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("items")
        .select("id, name, emoji, price, description")
        .order("price", { ascending: true });
      if (error) console.error(error);
      setItems(data ?? []);
    })();
  }, []);

  async function buy(item) {
    if (busy) return;
    if (coins < item.price) {
      alert("Not enough coins.");
      return;
    }
    setBusy(true);
    try {
      // 1) Who am I?
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) throw new Error("Not signed in");

      // 2) Read existing qty (simple/robust path without RPC)
      const { data: existing, error: selErr } = await supabase
        .from("user_inventory")
        .select("qty")
        .eq("user_id", user.id)
        .eq("item_id", item.id)
        .maybeSingle();
      if (selErr) throw selErr;

      const nextQty = (existing?.qty ?? 0) + 1;

      // 3) Upsert inventory row
      const { error: upErr } = await supabase
        .from("user_inventory")
        .upsert(
          { user_id: user.id, item_id: item.id, qty: nextQty },
          { onConflict: "user_id,item_id" }
        );
      if (upErr) throw upErr;

      // 4) Spend coins (persisted by CoinContext)
      addCoins(-item.price);
      alert(`Bought ${item.name}!`);
    } catch (e) {
      console.error(e);
      alert("Purchase failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-content" style={styles.container}>
      <h1>Shop</h1>
      <img src={shop} alt="The Traveled Tupilac" style={styles.image} />
      <p>
        Coins: {coins} • <Link to="/inventory">Go to Inventory →</Link>
      </p>
      <div className="shop-grid">
        {items.map((it) => (
          <div key={it.id} className="shop-card">
            <div className="emoji" style={{ fontSize: "2rem" }}>
              {it.emoji}
            </div>
            <h3>{it.name}</h3>
            <p>{it.description}</p>
            <div className="row">
              <span>{it.price} coins</span>
              <button onClick={() => buy(it)} disabled={busy}>
                Buy
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "600px",
    margin: "2rem auto",
    padding: "1rem",
    background: "rgba(255, 248, 230, 0.95)",
    borderRadius: "16px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
    fontFamily: "Cormorant Garamond, serif",
    color: "#3e2f1c",
    lineHeight: 1.5,
  },
  image: {
    width: "100%",
    height: "auto",
    borderRadius: "12px",
    marginBottom: "1rem",
  },
};
