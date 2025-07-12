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

  // Derive the page key: use the prop if passed in, otherwise use React Router
  const currentPage = pageProp || location.pathname;

  // Load existing messages for this user & page
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      console.log("🔍 Loading chat for", user.id, "on", currentPage);
      const { data, error } = await supabase
        .from("chat_messages")
        .select("role, text")
        .eq("user_id", user.id)
        .eq("page", currentPage)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Load error:", error);
      } else {
        setMessages(data || []);
      }
    })();
  }, [user?.id, currentPage]);

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

    // Insert user message
    await supabase.from("chat_messages").insert({
      user_id: user.id,
      role: "user",
      text,
      page: currentPage,
    });

    const newMessage = { role: "user", text };
    setMessages((prev) => [...prev, newMessage].slice(-50));

    // Generate AI reply with error handling
    let aiReply = "Sorry, I couldn't think of a reply right now.";
    try {
      aiReply = await generatePetReply(text, currentPage, user.id, pet);
    } catch (err) {
      console.error("generatePetReply failed", err);
    }

    // Insert AI reply
    await supabase.from("chat_messages").insert({
      user_id: user.id,
      role: "assistant",
      text: aiReply,
      page: currentPage,
    });

    setMessages((prev) =>
      [...prev, { role: "assistant", text: aiReply }].slice(-50)
    );
    setSending(false);
  }

  return (
    <section id="chat">
      <h2>Chat with your pet</h2>

      <div id="chat-messages">
        {messages.map((m, i) => {
          const isUser = m.role === "user";
          const isPet = m.role === "assistant";
          const extraClass =
            isUser && m === messages[messages.length - 2]
              ? "user-fade-in"
              : isPet && i === messages.length - 1
              ? "fade-in"
              : "";
          const key = `${m.role}-${i}-${m.text.slice(0, 10)}`;

          return (
            <div
              key={key}
              className={`chat-bubble ${m.role}-bubble ${extraClass}`}
            >
              <strong>{isUser ? "You" : "Pet"}:</strong> {m.text}
            </div>
          );
        })}
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
