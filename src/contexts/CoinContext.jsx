// src/contexts/CoinContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

// Create a context solely for coins
const CoinContext = createContext();

/**
 * Provides `coins` state and `addCoins()` updater,
 * synced with the `user_coins` table in Supabase.
 */
export function CoinProvider({ children, user }) {
  const [coins, setCoins] = useState(0);

  // 1) Load coins when user logs in
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("user_coins")
      .select("coins")
      .eq("user_id", user.id)
      .single()
      .then(({ data, error }) => {
        if (error && error.code !== "PGRST116") {
          console.error("Error loading coins:", error);
        } else {
          setCoins(data?.coins ?? 0);
        }
      });
  }, [user?.id]);

  // 2) Persist coins whenever they change
  useEffect(() => {
    if (!user?.id) return;

    async function persistCoins() {
      const { data, error } = await supabase
        .from("user_coins")
        .upsert({ user_id: user.id, coins }, { onConflict: ["user_id"] });
      if (error) {
        console.error("❌ Coin upsert failed:", error);
      } else {
        console.log("✅ Coin upsert succeeded:", data);
      }
    }

    persistCoins();
  }, [coins, user?.id]);

  const addCoins = (amt) => setCoins((c) => c + amt);

  return (
    <CoinContext.Provider value={{ coins, addCoins }}>
      {children}
    </CoinContext.Provider>
  );
}

/**
 * Custom hook to read & update coin state anywhere.
 */
export function useCoins() {
  return useContext(CoinContext);
}
