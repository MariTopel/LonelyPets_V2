import React, { useEffect } from "react";
import archeryImg from "../../assets/UI/city/archery.png";
import { useChat } from "../../contexts/ChatContext";
import ArcheryGame from "../../components/ArcheryGame";

export default function Archery() {
  const { sendSystemMessage } = useChat();

  useEffect(() => {
    sendSystemMessage(
      "The user has arrived at the archery range. The scent of hay bales fills the air, and arrows thud against distant targets. A large man with a helmet with horns on it stares at you expectantly."
    );
  }, []);

  return (
    <div className="page-content" style={styles.container}>
      <img src={archeryImg} alt="Archery Range" style={styles.image} />
      <h1>🏹 Archery Range</h1>
      <p>
        Welcome to the Archadeus Archery Grounds, where you can test your aim
        and reflexes in friendly competitions or train to become a true
        marksman.
      </p>

      <ArcheryGame />
      <ul>
        <li>Practice with magical and mundane bows.</li>
        <li>Compete in daily challenges for coin rewards.</li>
        <li>Talk to the range master for tips and lore.</li>
      </ul>
      <p>What would you like to do?</p>
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
