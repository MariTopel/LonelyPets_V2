// src/utils/generatePetReply.js
import { supabase } from "../supabaseClient";

/**
 * Calls the /api/chat endpoint to generate the pet's reply.
 * @param {string} prompt - The user's latest message.
 * @param {string} page - The current page route (e.g. '/city').
 * @param {string} userId - The authenticated user's ID.
 * @param {object} pet - The pet object ({ name, type, personality }).
 * @returns {Promise<string>} - The AI-generated reply.
 */
export async function generatePetReply(prompt, page, userId, pet) {
  // 1) Get current session and token
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    console.error("Auth session error:", sessionError);
    throw new Error("Not authenticated");
  }

  const token = session.access_token;

  // 2) Build request payload
  const body = { prompt, page, userId, pet };

  // 3) Call serverless chat API
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  // 4) Handle HTTP errors
  if (!res.ok) {
    const errText = await res.text();
    console.error("Chat API error", res.status, errText);
    return "Sorry, I couldn’t think of a reply just now.";
  }

  // 5) Parse JSON response
  const { reply } = await res.json();
  return reply;
}
