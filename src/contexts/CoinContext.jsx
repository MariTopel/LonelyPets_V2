// src/contexts/CoinContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { supabase } from "../supabaseClient";

const CoinContext = createContext();

/**
 * Provides persistent coin state for the user.
 * Loads initial coin count from Supabase and persists changes.
 */
export function CoinProvider({ children, user }) {
  const [coins, setCoins] = useState(0);
  const initialLoadRef = useRef(false);

  // Load coins from DB when user logs in or changes
  useEffect(() => {
    if (!user?.id) {
      setCoins(0);
      initialLoadRef.current = false;
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("user_coins")
        .select("coins")
        .eq("user_id", user.id)
        .single();
      if (error && error.code !== "PGRST116") {
        console.error("Error loading coins:", error);
      } else {
        setCoins(data?.coins ?? 0);
      }
      initialLoadRef.current = true;
    })();
  }, [user?.id]);

  // Persist coin changes after initial load completes
  useEffect(() => {
    if (!initialLoadRef.current || !user?.id) return;
    (async () => {
      const { error } = await supabase
        .from("user_coins")
        .upsert({ user_id: user.id, coins }, { onConflict: ["user_id"] });
      if (error) {
        console.error("Error saving coins:", error);
      }
    })();
  }, [coins, user?.id]);

  // Update coins locally; persistence handled above
  const addCoins = (amount) => setCoins((prev) => prev + amount);

  return (
    <CoinContext.Provider value={{ coins, addCoins }}>
      {children}
    </CoinContext.Provider>
  );
}

export function useCoins() {
  return useContext(CoinContext);
}
