// src/contexts/ChatContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { generatePetReply } from "../utils/generatePetReply";

const ChatContext = createContext();

export function ChatProvider({ user, children }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  // load all messages on login
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("role, text, page")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      if (error) console.error("Chat load error", error);
      else setMessages(data);
    })();
  }, [user?.id]);

  // send a message + get AI reply
  async function sendMessage(text, page, pet) {
    if (!text.trim() || sending) return;
    setSending(true);
    // insert user
    await supabase.from("chat_messages").insert({
      user_id: user.id,
      role: "user",
      text,
      page,
    });
    setMessages((m) => [...m, { role: "user", text }]);
    // AI reply
    let reply = "Hmm, I’m thinking…";
    try {
      reply = await generatePetReply(text, page, user.id, pet);
    } catch (e) {
      console.error(e);
    }
    await supabase.from("chat_messages").insert({
      user_id: user.id,
      role: "assistant",
      text: reply,
      page,
    });
    setMessages((m) => [...m, { role: "assistant", text: reply }]);
    setSending(false);
  }

  return (
    <ChatContext.Provider
      value={{ messages, input, setInput, sendMessage, sending }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  return useContext(ChatContext);
}
