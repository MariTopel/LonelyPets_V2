// src/pages/Inventory.jsx
//inventory page shows user inventory and lets user decrement (-1) or delete the whole stack
// this page talks directly to supabase table user_inventory which is joined to items.

// useState is used to hold the current inventory rows and if the page is loading
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useCoins } from "../contexts/CoinContext";
import { useItemUse } from "../contexts/ItemUseContext"; //makes it so user can use items

export default function Inventory() {
  //rows is the list that will be rendered. each element is one invetnory entry for this user.
  //setRows updates the list immutably. Once after fetching from supabase and again after each decrement or delete to instantly reflect the change in the UI (maybe)
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const { coins } = useCoins();

  // Fetch inventory on mount
  useEffect(() => {
    let ignore = false; //this is to guard it prevents setState after unmount
    (async () => {
      //this gets the current session aka who is logged in
      const {
        //this line right here asks for the current user session
        //user's id is what Postfres uses as auth.uid() for RLS rules
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;
      //if not logged in then show empty inventory and stop (no DB call)
      if (!user) {
        setRows([]);
        setLoading(false);
        return;
      }

      //fetch user's inventory with metadata
      const { data, error } = await supabase
        //user_inventory is the name of the table
        .from("user_inventory")
        //all the info plus metadata
        .select("item_id, qty, items(name, emoji, price, description)")
        //for some reason i have it like this i don't remember why
        .eq("user_id", user.id)
        //when supabase sends rows from the user_inventory table sort them by the item_id column
        .order("item_id", { ascending: true });

      //update the local UI state aka show the user's inventory on the webpage
      if (!ignore) {
        if (error) console.error("fetch inventory error:", error);
        setRows(data ?? []);
        setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  async function deleteItem(item_id) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;

    const { error } = await supabase
      .from("user_inventory")
      .delete()
      .eq("user_id", user.id)
      .eq("item_id", item_id);

    if (error) {
      console.error(error);
      return;
    }

    // update UI
    setRows((r) => r.filter((row) => row.item_id !== item_id));
  }

  async function decrement(item_id) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;

    // get current qty
    const { data, error } = await supabase
      .from("user_inventory")
      .select("qty")
      .eq("user_id", user.id)
      .eq("item_id", item_id)
      .maybeSingle();

    if (error || !data) {
      console.error(error || "no row");
      return;
    }

    if (data.qty > 1) {
      // update to qty - 1
      const { error: upErr } = await supabase
        .from("user_inventory")
        .update({ qty: data.qty - 1 })
        .eq("user_id", user.id)
        .eq("item_id", item_id);
      if (upErr) {
        console.error(upErr);
        return;
      }

      // update UI
      setRows((rows) =>
        rows.map((r) => (r.item_id === item_id ? { ...r, qty: r.qty - 1 } : r))
      );
    } else {
      // qty === 1: delete the row
      const { error: delErr } = await supabase
        .from("user_inventory")
        .delete()
        .eq("user_id", user.id)
        .eq("item_id", item_id);
      if (delErr) {
        console.error(delErr);
        return;
      }

      // update UI
      setRows((rows) => rows.filter((r) => r.item_id !== item_id));
    }
  }

  return (
    <section className="page-content">
      <h1>Inventory</h1>
      <p>Coins: {coins}</p>

      {loading ? (
        <p>Loading…</p>
      ) : rows.length === 0 ? (
        <p>Your pack is empty.</p>
      ) : (
        <ul
          className="inventory-list"
          style={{ listStyle: "none", padding: 0 }}
        >
          {rows.map((row) => (
            <li
              key={row.item_id}
              className="inventory-row"
              style={{
                display: "grid",
                gridTemplateColumns: "2rem 1fr auto auto",
                gap: "0.5rem",
                alignItems: "center",
                padding: "0.5rem 0",
                borderBottom: "1px solid #eee",
              }}
            >
              <span className="emoji" style={{ fontSize: "1.5rem" }}>
                {row.items?.emoji}
              </span>
              <div>
                <strong>{row.items?.name}</strong>{" "}
                <span style={{ color: "#777" }}>({row.items?.price}c)</span>
                <div style={{ fontSize: "0.9rem", color: "#666" }}>
                  {row.items?.description}
                </div>
              </div>
              <span>× {row.qty}</span>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={() => decrement(row.item_id)}>-1</button>
                <button onClick={() => deleteItem(row.item_id)}>
                  Delete All
                </button>
                <button
                  onClick={() =>
                    setSelectedItem({
                      item_id: row.item_id,
                      qty: row.qty,
                      items: row.items, // { name, emoji, price, description }
                    })
                  }
                >
                  Use
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
