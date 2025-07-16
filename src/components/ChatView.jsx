// src/components/ChatView.jsx
import React, { useEffect, useRef } from "react";
import { useChat } from "../contexts/ChatContext.jsx";

export default function ChatView({ user, pet, page: pageProp }) {
  const { messages, input, setInput, sendMessage, sending } = useChat();
  const currentPage = pageProp || window.location.pathname;
  const endRef = useRef();

  // Auto-scroll on new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Render nothing if not fully ready
  if (!user || pet === undefined) return null;

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
          onKeyDown={(e) => {
            if (e.key === "Enter" && !sending) {
              e.preventDefault();
              sendMessage(input, currentPage, pet);
            }
          }}
          placeholder="Type a message…"
          disabled={sending}
        />
        <button
          onClick={() => sendMessage(input, currentPage, pet)}
          disabled={sending}
        >
          {sending ? "Sending…" : "Send"}
        </button>
      </div>
    </section>
  );
}
