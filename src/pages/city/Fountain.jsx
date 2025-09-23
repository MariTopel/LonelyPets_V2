// src/pages/city/Fountain.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { useCoins } from "../../contexts/CoinContext";
import { useChat } from "../../contexts/ChatContext";

// images (you already fixed these paths)
import fountainIdle from "../../assets/UI/city/fountain-olo-none.png";
import fountainMale from "../../assets/UI/city/fountain-olo-man.png";
import fountainFemale from "../../assets/UI/city/fountain-olo-woman.png";

export default function Fountain() {
  const { addCoins } = useCoins();
  const { sendSystemMessage } = useChat();

  // Fountain visual state: 'idle' | 'male' | 'female'
  const [state, setState] = useState("idle");
  const [busy, setBusy] = useState(false);

  // Local inventory for THIS page (no ItemUseContext needed)
  const [loadingInv, setLoadingInv] = useState(true);
  const [inv, setInv] = useState([]); // rows: { item_id, qty, items:{ name, emoji, price, description } }
  const [selectedItemId, setSelectedItemId] = useState(null);

  const imgByState = {
    idle: fountainIdle,
    male: fountainMale,
    female: fountainFemale,
  };

  // Load the current user's inventory (with item metadata)
  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoadingInv(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        if (!ignore) {
          setInv([]);
          setLoadingInv(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from("user_inventory")
        .select("item_id, qty, items(name, emoji, price, description)")
        .eq("user_id", user.id)
        .order("item_id", { ascending: true });

      if (!ignore) {
        if (error) console.error("inventory fetch error:", error);
        setInv(data ?? []);
        setLoadingInv(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  // Decrement or delete one unit of the selected item in DB, then mirror locally
  async function consumeOnce(item_id) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return false;

    const { data, error } = await supabase
      .from("user_inventory")
      .select("qty")
      .eq("user_id", user.id)
      .eq("item_id", item_id)
      .maybeSingle();

    if (error || !data) return false;

    if (data.qty > 1) {
      const { error: upErr } = await supabase
        .from("user_inventory")
        .update({ qty: data.qty - 1 })
        .eq("user_id", user.id)
        .eq("item_id", item_id);
      if (upErr) return false;

      setInv((rows) =>
        rows.map((r) => (r.item_id === item_id ? { ...r, qty: r.qty - 1 } : r))
      );
      return true;
    } else {
      const { error: delErr } = await supabase
        .from("user_inventory")
        .delete()
        .eq("user_id", user.id)
        .eq("item_id", item_id);
      if (delErr) return false;

      setInv((rows) => rows.filter((r) => r.item_id !== item_id));
      setSelectedItemId((cur) => (cur === item_id ? null : cur));
      return true;
    }
  }

  async function useOnFountain() {
    if (busy) return;
    setBusy(true);
    try {
      const row = inv.find((r) => r.item_id === selectedItemId);
      const name = row?.items?.name?.toLowerCase().trim();

      // Require Fish Food / Fish Snack-like name
      const isFishFood =
        name === "fish food" || name === "fish snack" || name === "fish";

      if (!isFishFood) {
        sendSystemMessage(
          "You peer into the fountain. The water ripples softly, but nothing else happens."
        );
        return;
      }

      // Consume one from inventory
      const ok = await consumeOnce(row.item_id);
      if (!ok) {
        sendSystemMessage("You reach for your snack pouch, but it’s empty.");
        return;
      }

      // 50/50 your existing outcomes (keep your rewards & text)
      const roll = Math.random();
      if (roll < 0.5) {
        setState("male");
        sendSystemMessage(
          "You sprinkle fish food into the fountain. Suddenly what looks like a man made of water appears and hands you a small gift."
        );
        addCoins(5);
      } else {
        setState("female");
        sendSystemMessage(
          "You cast the fish food upon the waters. A faint woman made of water appears before you. You feel luckier somehow. And have gained 100 coins!"
        );
        addCoins(100);
      }
    } finally {
      setBusy(false);
    }
  }

  function resetFountain() {
    setState("idle");
  }

  const selectedRow = inv.find((r) => r.item_id === selectedItemId);
  const selectedLabel = selectedRow
    ? `${selectedRow.items?.emoji ?? ""} ${selectedRow.items?.name} ×${
        selectedRow.qty ?? "?"
      }`
    : "None";

  return (
    <div className="page-content" style={styles.container}>
      <h1 style={styles.title}>City Fountain</h1>

      {/* Fountain image + actions */}
      <div style={styles.fountainCard}>
        <img
          src={imgByState[state]}
          alt="City Fountain"
          style={styles.image}
          draggable={false}
        />
        <div style={styles.actions}>
          <button onClick={useOnFountain} disabled={busy || !selectedItemId}>
            Use selected item on fountain
          </button>
          <button onClick={resetFountain} disabled={busy}>
            Reset Fountain
          </button>
        </div>
      </div>

      {/* On-page item picker (no need to visit Inventory) */}
      <div style={styles.picker}>
        <div style={styles.selection}>
          <strong>Selected item:</strong> {selectedLabel}
          <button
            style={styles.clearBtn}
            onClick={() => setSelectedItemId(null)}
            disabled={!selectedItemId}
          >
            Clear
          </button>
        </div>

        <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Your Items</h2>
        {loadingInv ? (
          <p>Loading inventory…</p>
        ) : inv.length === 0 ? (
          <p>Your pack is empty. Buy something at the Shop first.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: "0.5rem 0 0" }}>
            {inv.map((row) => (
              <li
                key={row.item_id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto",
                  gap: "0.5rem",
                  alignItems: "center",
                  padding: "0.4rem 0",
                  borderBottom: "1px solid #eee",
                }}
              >
                <input
                  type="radio"
                  name="item"
                  checked={selectedItemId === row.item_id}
                  onChange={() => setSelectedItemId(row.item_id)}
                  aria-label={`Select ${row.items?.name}`}
                />
                <div>
                  <strong style={{ marginRight: 6 }}>
                    {row.items?.emoji} {row.items?.name}
                  </strong>
                  <span style={{ color: "#777" }}>
                    ({row.items?.price}c) — {row.items?.description}
                  </span>
                </div>
                <span>× {row.qty}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p style={styles.hint}>
        Tip: Select <strong>Fish Food / Fish Snack</strong> above, then click{" "}
        <strong>Use selected item on fountain</strong>.
      </p>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "1rem",
    fontFamily: "Cormorant Garamond, serif",
    color: "#3e2f1c",
  },
  title: { marginBottom: "0.5rem" },
  fountainCard: {
    background: "rgba(255, 248, 230, 0.95)",
    borderRadius: "16px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
    padding: "1rem",
  },
  image: {
    width: "100%",
    height: "auto",
    borderRadius: 12,
    display: "block",
    userSelect: "none",
  },
  actions: {
    display: "flex",
    gap: "0.75rem",
    marginTop: "0.75rem",
  },
  picker: {
    marginTop: "1rem",
    padding: "0.75rem",
    border: "1px dashed #bda57d",
    borderRadius: 10,
    background: "rgba(255,248,230,0.6)",
  },
  selection: {
    display: "flex",
    gap: "0.5rem",
    alignItems: "center",
    margin: "0 0 0.75rem",
    padding: "0.5rem 0.75rem",
    border: "1px dashed #bda57d",
    borderRadius: 10,
    background: "rgba(255,248,230,0.35)",
  },
  clearBtn: { marginLeft: "auto" },
  hint: { marginTop: "0.75rem", fontSize: "0.95rem" },
};
