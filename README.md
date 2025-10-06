# 🐉 LonelyPets V2

A fantasy-themed virtual pet web application where users can adopt pets, earn coins, play mini-games, buy/use items, and interact with magical locations such as the City Fountain. Built with **React (Vite)**, **Supabase** (Postgres + Auth), and **OpenAI**.

---

## ✨ Features

- **Authentication**
  - Email/password login & signup via Supabase.
  - Session persistence with JWTs stored in localStorage.
  - Profiles auto-created for new users.

- **Pets**
  - Create a pet with name, type, and personality.
  - Choose from creatures like **cat, dog, dragon, plant, space octopus**.
  - Pet data stored per user in Supabase.

- **Economy**
  - Earn coins via mini-games (e.g. **Archery**).
  - Coin balances tracked in `user_coins` table.
  - Transactions logged for clarity.

- **Inventory & Items**
  - Buy items from the **Shop**.
  - Inventory stored in `user_inventory`.
  - Items usable in special locations (e.g., Fish Food at the Fountain).

- **Locations**
  - **City**: Hub world with hotspots (Pub, Shop, Archery, Fountain, Fox Shrine).
  - **Coast** and **Desert**: Expansion maps with future activities.
  - **Fountain**: Unique mechanic—offer items to encounter Olokun’s male or female avatar with different rewards.

- **Chat**
  - Chat with your pet via an OpenAI-powered system.
  - Chat history stored in Supabase (`chat_messages`).
  - Context-aware replies generated in `utils/generatePetReply.js`.

---

## 🛠 Tech Stack

- **Frontend**: React 19, Vite, React Router
- **Backend/DB**: Supabase (Postgres with Row-Level Security)
- **Auth**: Supabase email/password
- **AI**: OpenAI API for pet interactions
- **Styling**: CSS (parchment UI theme, fantasy-inspired)
- **Animations**: GSAP (used in Archery game)
- **Deployment**: Vercel recommended

---

