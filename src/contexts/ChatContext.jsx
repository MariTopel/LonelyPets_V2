import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { generatePetReply } from "../utils/generatePetReply";

const ChatContext = createContext();

export function ChatProvider({ user, pet, currentPage, children }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const MAX_MESSAGES = 50;

  // Load existing messages
  useEffect(() => {
    if (!user?.id) {
      setMessages([]);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("role, text, page")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      if (error) {
        console.error("Chat load error:", error);
      } else {
        setMessages(data.slice(-MAX_MESSAGES));
      }
    })();
  }, [user?.id]);

  // Standard user message
  async function sendMessage(text, page, pet) {
    const trimmed = text.trim();
    if (!trimmed || sending || !user?.id) return;

    setInput("");
    setSending(true);

    await supabase.from("chat_messages").insert({
      user_id: user.id,
      role: "user",
      text: trimmed,
      page,
    });

    setMessages((prev) => {
      const next = [...prev, { role: "user", text: trimmed }];
      return next.slice(-MAX_MESSAGES);
    });

    let reply = "🧐 Thinking…";
    try {
      reply = await generatePetReply(trimmed, page, user.id, pet);
    } catch (err) {
      console.error("AI error:", err);
      reply = "Sorry, I couldn't think of a reply right now.";
    }

    setMessages((m) => [...m, { role: "assistant", text: reply }]);
    setSending(false);
  }

  // System-triggered message (e.g., entering a page)
  async function sendSystemMessage(prompt) {
    try {
      if (!user?.id || !pet || !currentPage) {
        console.warn("Missing context for system message.");
        return;
      }

      // Call the same function the regular chat uses
      const reply = await generatePetReply(prompt, currentPage, user.id, pet);

      // Append AI reply (but no user message)
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch (err) {
      console.error("System message failed:", err);
    }
  }
  return (
    <ChatContext.Provider
      value={{
        messages,
        input,
        setInput,
        sendMessage,
        sendSystemMessage,
        sending,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  return useContext(ChatContext);
}
