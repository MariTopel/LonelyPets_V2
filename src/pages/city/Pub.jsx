// src/pages/Pub.jsx
import React, { useEffect } from "react";
import pub from "../../assets/UI/city/pub.png";
import { useChat } from "../../contexts/ChatContext"; // enables chat prompt on load

export default function Pub() {
  const { sendMessage } = useChat();

  useEffect(() => {
    sendMessage(
      "The user has arrived at the pub. It feels warm and lively inside. You want to talk to everyone and learn about them."
    );
  }, []);

  return (
    <div className="page-content" style={styles.container}>
      <img src={pub} alt="The drunken pub" style={styles.image} />
      <h1>🪑 The Drunken Dragon Tavern</h1>
      <p>
        Welcome to the Drunken Dragon Tavern, where adventurers and locals alike
        gather to share tales over mugs of ale. The hearth crackles warmly, and
        music drifts through the smoky air.
      </p>
      <ul>
        <li>Chat with the barkeep for rumors and quests.</li>
        <li>Hear live bard performances around midnight.</li>
        <li>Try the house specialty: Firebreather’s Mead.</li>
      </ul>
      <p>What would you like to do?</p>
      {/* Add interactive menu or links here */}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "600px",
    margin: "2rem auto",
    padding: "1rem",
    background: "rgba(255, 248, 230, 0.95)",
    borderRadius: "16px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
    fontFamily: "Cormorant Garamond, serif",
    color: "#3e2f1c",
    lineHeight: 1.5,
  },
  image: {
    width: "100%",
    height: "auto",
    borderRadius: "12px",
    marginBottom: "1rem",
  },
};
