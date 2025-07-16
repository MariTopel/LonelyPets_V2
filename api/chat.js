// api/chat.js

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

// ─── 1) Map your route IDs → human-friendly names ─────────────────────────────
const PAGE_NAMES = {
  city: "The Great City of Archadeus",
  desert: "The Sand Snake Expanse",
  coast: "The Eldritch Coast",
  // …add more as you spin up new maps…
};

const PET_DETAILS = {
  dragon: `As a Dragon, you have lived a long time and desire a human companion. Your human is more your pet than you are their pet. You have flown in the skies and fought in ancient wars. You enjoy eating metals but enjoy eating gold the most. You enjoy how humans live such short lives but appreciate life more.`,
  cat: `As a magical Cat, you learned your magical skills from the witches in the Eldritch Coast. You enjoy catching fish with your paws and a little bit of magic. You enjoy laying in the sun and prefer the Sand Snake Sea for it's intense sun and heat. You love having your belly rubbed but sometimes will bite for no reason, but you are always sorry.`,
  dog: `As a magical Dog, you learned your magic from a wizard's tower in a distant land. You ran away to find kinder humans who would give gentile pets and treat. You enjoy using your magic to make your human companion happy. You love swimming and running through nature.`,
  plant: `As a magical Plant creature, you come from a swamp. After years of growing in the swamp you decided to explore the world. You want a human companion to help you navigate the world of flesh beings, as your plant mind can sometimes have a hard time comprehending non plant minds. You are curious about the world. Your favorite food is dirty water.`,
  "space octopus": `As a Space Octopus, you were lonely in space and chose to find a human companion on this planet. You project your likeness on a much smaller scale to the creatures of this planet because you are actually as large as a star system. Your job is to go through the cosmos and adjust the planets in solar systems so they don't collide. You want to experience the universe on a more micro scale and appreciate the little details of a small being's life.`,
};

// ─── 2) Env vars & tuning constants ───────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// How many turns before we start summarizing…
const SUMMARY_THRESHOLD = 20;
// How many most-recent turns to keep “in context”
const WINDOW = 10;

// Initialize OpenAI client once
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export default async function handler(req, res) {
  // ─── Only allow POST ───────────────────────────────────────────────────────
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  // ─── 1) Extract & verify Supabase JWT ──────────────────────────────────────
  const authHeader = req.headers.authorization || "";
  const jwt = authHeader.replace(/^Bearer\s+/, "");
  if (!jwt) {
    return res.status(401).json({ error: "Missing Supabase JWT" });
  }

  // ─── 2) Create a Supabase client scoped to this user (for RLS!) ────────────
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });

  // ─── 3) Pull prompt, page & userId from the JSON body ──────────────────────
  const { prompt, page, userId, pet } = req.body || {};
  if (!prompt || !page || !userId) {
    return res.status(400).json({ error: "Missing prompt, page or userId" });
  }

  // ─── 4) Derive a friendly “location” string from the page path  ─────────────
  //    e.g. "/maps/city" → mapId = "city" → friendly = "The Great City of Archadeus"
  const parts = page.split("/").filter((p) => p);
  const mapId = parts[parts.length - 1];
  const friendly = PAGE_NAMES[mapId] || mapId;

  // ─── 5) Load *all* this user’s chat_messages (across pages) ────────────────
  const { data: chatRows = [], error: fetchErr } = await supabase
    .from("chat_messages")
    .select("role, text, page, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (fetchErr) {
    console.error("DB fetch error:", fetchErr);
    return res.status(500).json({ error: "DB fetch failed" });
  }

  // ─── 6) Load or generate a “memory summary” if too many turns ───────────────
  const { data: memRow } = await supabase
    .from("chat_memories")
    .select("summary")
    .eq("user_id", userId)
    .eq("page", page)
    .single();
  let summary = memRow?.summary || null;

  if (!summary && chatRows.length > SUMMARY_THRESHOLD) {
    const toSummarize = chatRows
      .slice(0, chatRows.length - WINDOW)
      .map((r) => `${r.role}: ${r.text}`)
      .join("\n");

    try {
      const sumResp = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Condense the following into a 2-sentence summary.",
          },
          { role: "user", content: toSummarize },
        ],
      });
      summary = sumResp.choices[0].message.content.trim();

      // persist it back
      await supabase
        .from("chat_memories")
        .upsert({ user_id: userId, page, summary });
    } catch (err) {
      console.error("Summary error:", err);
    }
  }

  // ─── 7) Fetch the user’s profile for personal context ────────────────────────
  const { data: prof, error: profErr } = await supabase
    .from("profiles")
    .select("full_name, favorite_color, bio")
    .eq("user_id", userId)
    .single();
  if (profErr && profErr.code !== "PGRST116") {
    console.error("Profile load error:", profErr);
  }
  const profileMsg = prof
    ? `Profile — name: ${prof.full_name}, favorite color: ${prof.favorite_color}, bio: ${prof.bio}.`
    : null;

  // ─── 8) Build your system prompt + message array ────────────────────────────
  const type = pet?.type || "magical creature";
  const name = pet?.name || "your pet";
  const personality = pet?.personality
    ? `You are ${pet.personality}.`
    : "You are kind and curious.";
  const details = PET_DETAILS[type.toLowerCase()] || "";

  const SYSTEM_PROMPT = `
You are a ${type} named ${name}.
${details}
${personality}

Speak in the pet’s voice, as if talking directly to your human friend.
Keep replies short, friendly, and in first person.
`.trim();

  const messages = [
    // a) Role & instructions
    { role: "system", content: SYSTEM_PROMPT },

    // b) Tell it *where* it is right now
    {
      role: "system",
      content: `Location: you are currently in “${friendly}”.`,
    },

    // c) Inject personal‐profile context
    ...(profileMsg ? [{ role: "system", content: profileMsg }] : []),

    // d) Inject memory summary if we have it
    ...(summary
      ? [{ role: "system", content: `Memory summary: ${summary}` }]
      : []),

    // e) The last WINDOW chat turns
    ...chatRows.slice(-WINDOW).map((r) => ({
      role: r.role,
      content: r.text,
    })),

    // f) And finally the user’s new prompt
    { role: "user", content: prompt },
  ];

  // ─── 9) Call OpenAI for your pet’s reply ────────────────────────────────────
  let reply;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
    });
    reply = completion.choices[0].message.content.trim();
  } catch (err) {
    console.error("OpenAI error:", err);
    return res.status(500).json({ error: "AI service error" });
  }

  // ─── 10) Log that assistant reply back to Supabase ─────────────────────────
  const { error: insertErr } = await supabase
    .from("chat_messages")
    .insert({ user_id: userId, role: "assistant", text: reply, page });
  if (insertErr) {
    console.error("Insert reply error:", insertErr);
  }

  // ─── 11) Return the reply to your frontend ────────────────────────────────
  return res.status(200).json({ reply });
}
