// src/components/ChatView.jsx
import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { generatePetReply } from "../utils/generatePetReply";

export default function ChatView({ user, pet, page: pageProp }) {
  // If no user, render nothing
  if (!user) return null;

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef();
  const location = useLocation();

  // Derive the current page for inserts, but we won't filter by it on load
  const currentPage = pageProp || location.pathname;

  // Load all chat messages for this user once (global history)
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      console.log("🔍 Loading global chat for", user.id);
      const { data, error } = await supabase
        .from("chat_messages")
        .select("role, text")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Load error:", error);
      } else {
        setMessages(data || []);
      }
    })();
  }, [user?.id]);

  // Auto-scroll on new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!user?.id || sending) return;
    const text = input.trim();
    if (!text) return;

    setInput("");
    setSending(true);

    // Insert the user's message (still record page for context)
    await supabase.from("chat_messages").insert({
      user_id: user.id,
      role: "user",
      text,
      page: currentPage,
    });

    // Update local state
    setMessages((prev) => [...prev, { role: "user", text }]);

    // Call the AI
    let aiReply = "Sorry, I couldn't think of a reply right now.";
    try {
      aiReply = await generatePetReply(text, currentPage, user.id, pet);
    } catch (err) {
      console.error("generatePetReply failed", err);
    }

    // Insert AI's reply
    await supabase.from("chat_messages").insert({
      user_id: user.id,
      role: "assistant",
      text: aiReply,
      page: currentPage,
    });

    // Update local state with AI reply
    setMessages((prev) => [...prev, { role: "assistant", text: aiReply }]);
    setSending(false);
  }

  return (
    <section id="chat">
      <h2>Chat with your pet</h2>

      <div id="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`chat-bubble ${m.role}-bubble`}>
            <strong>{m.role === "user" ? "You" : "Pet"}:</strong> {m.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div id="chat-input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          disabled={sending}
        />
        <button onClick={handleSend} disabled={sending}>
          {sending ? "Sending..." : "Send"}
        </button>
      </div>
    </section>
  );
}
