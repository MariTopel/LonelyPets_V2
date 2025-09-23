// src/contexts/ItemUseContext.jsx
import React, { createContext, useContext, useState } from "react";
import { supabase } from "../supabaseClient";

// Super small context to remember which item the player wants to use.
// Also provides a helper to "consume" (decrement/delete) that item in DB.
const ItemUseContext = createContext();

export function ItemUseProvider({ children }) {
  const [selectedItem, setSelectedItem] = useState(null);
  // selectedItem shape (from Inventory rows): { item_id, qty, items: { name, emoji, ... } }

  const clearSelection = () => setSelectedItem(null);

  // Decrement or delete the selected item by 1.
  // Returns the consumed item's metadata on success; null on failure.
  async function consumeSelectedOnce() {
    if (!selectedItem) return null;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return null;

    // Read current qty in DB (stay correct if it changed elsewhere)
    const { data, error } = await supabase
      .from("user_inventory")
      .select("qty")
      .eq("user_id", user.id)
      .eq("item_id", selectedItem.item_id)
      .maybeSingle();
    if (error || !data) return null;

    if (data.qty > 1) {
      const { error: upErr } = await supabase
        .from("user_inventory")
        .update({ qty: data.qty - 1 })
        .eq("user_id", user.id)
        .eq("item_id", selectedItem.item_id);
      if (upErr) return null;

      // update local cache too
      setSelectedItem((prev) =>
        prev ? { ...prev, qty: (prev.qty ?? data.qty) - 1 } : prev
      );
    } else {
      // qty === 1 → delete
      const { error: delErr } = await supabase
        .from("user_inventory")
        .delete()
        .eq("user_id", user.id)
        .eq("item_id", selectedItem.item_id);
      if (delErr) return null;

      // selection disappears because item is gone
      setSelectedItem(null);
    }

    return selectedItem; // return the thing
  }

  return (
    <ItemUseContext.Provider
      value={{
        selectedItem,
        setSelectedItem,
        clearSelection,
        consumeSelectedOnce,
      }}
    >
      {children}
    </ItemUseContext.Provider>
  );
}

export function useItemUse() {
  return useContext(ItemUseContext);
}
