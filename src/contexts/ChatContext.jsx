// src/contexts/ChatContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { generatePetReply } from "../utils/generatePetReply";

const ChatContext = createContext();

export function ChatProvider({ user, children }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const MAX_MESSAGES = 50;

  // load existing chat for this user (only last MAX_MESSAGES)
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
        // keep only the last MAX_MESSAGES
        setMessages(data.slice(-MAX_MESSAGES));
      }
    })();
  }, [user?.id]);

  // send a message + get AI reply
  async function sendMessage(text, page, pet) {
    const trimmed = text.trim();
    if (!trimmed || sending || !user?.id) return;

    // clear input and start sending
    setInput("");
    setSending(true);

    // insert user message
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

    // generate AI reply
    let reply = "🧐 Thinking…";
    try {
      reply = await generatePetReply(trimmed, page, user.id, pet);
    } catch (err) {
      console.error("AI error:", err);
      reply = "Sorry, I couldn't think of a reply right now.";
    }

    // insert AI reply
    //await supabase.from("chat_messages").insert({
    //user_id: user.id,
    //role: "assistant",
    //text: reply,
    //page,
    //});
    //setMessages((prev) => {
    //const next = [...prev, { role: "assistant", text: reply }];
    //return next.slice(-MAX_MESSAGES);
    //});
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
