// src/pages/City.jsx
import React from "react";
import { Link } from "react-router-dom";
import cityMap from "../../assets/UI/city/city-map.png"; // adjust path as needed
import { useEffect } from "react";
import { useChat } from "../../contexts/ChatContext";

export function City() {
  const { sendSystemMessage } = useChat();

  useEffect(() => {
    sendSystemMessage(
      "The user has arrived in the great city of Archadeus. It is colorful here and there are many places to see. There is a shrine, a pub, a shop, a castle, and an archery. There are many different kinds of magical creatures here from all over the world."
    );
  }, []);

  return (
    <div style={styles.container}>
      <img
        src={cityMap}
        alt="Map of the Great City of Archadeus"
        style={styles.image}
      />

      {/* Clickable overlay for the Shop */}
      <Link
        to="/shop"
        className="hotspot"
        style={{
          ...styles.hotspot,
          top: "50%",
          left: "82%",
          width: "17%",
          height: "39%",
        }}
      >
        <span style={styles.srOnly}>Shop</span>
      </Link>

      {/* Clickable overlay for the Archery Range */}
      <Link
        to="/city/archery"
        className="hotspot"
        style={{
          ...styles.hotspot,
          top: "60%",
          left: "62%",
          width: "18%",
          height: "28%",
        }}
      >
        <span style={styles.srOnly}>Archery Range</span>
      </Link>

      {/* Add more hotspots as needed */}

      <Link
        to="/city/pub"
        className="hotspot"
        style={{
          ...styles.hotspot,
          top: "42%",
          left: "2%",
          width: "21%",
          height: "38%",
        }}
      >
        <span style={styles.srOnly}>Pub</span>
      </Link>

      <Link
        to="/shrine"
        className="hotspot"
        style={{
          ...styles.hotspot,
          top: "11%",
          left: "63%",
          width: "21%",
          height: "38%",
        }}
      >
        <span style={styles.srOnly}>Shrine of the Fox</span>
      </Link>

      <Link
        to="/castle"
        className="hotspot"
        style={{
          ...styles.hotspot,
          top: "5%",
          left: "25%",
          width: "27%",
          height: "45%",
        }}
      >
        <span style={styles.srOnly}>The Castle</span>
      </Link>

      <Link
        to="/fountain"
        className="hotspot"
        style={{
          ...styles.hotspot,
          top: "52%",
          left: "36%",
          width: "22%",
          height: "42%",
        }}
      >
        <span style={styles.srOnly}>Pub</span>
      </Link>
    </div>
  );
}

const styles = {
  container: {
    position: "relative",
    maxWidth: "800px",
    margin: "2rem auto",
    textAlign: "center",
  },
  image: {
    width: "100%",
    display: "block",
  },
  hotspot: {
    position: "absolute",
    cursor: "pointer",
    // optional: visual feedback on hover
    // backgroundColor: "rgba(255,255,255,0.3)",
    // border: "1px solid rgba(0,0,0,0.2)",
  },
  srOnly: {
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: 0,
    margin: "-1px",
    overflow: "hidden",
    clip: "rect(0,0,0,0)",
    border: 0,
  },
};
