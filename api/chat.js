// src/api/chat.js
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

// ─── 1) Map your route IDs → human-friendly names ─────────────────────────────
const PAGE_NAMES = {
  city: "The Great City of Archadeus",
  pub: "The Drunken Dragon Tavern",
  desert: "The Sand Snake Expanse",
  coast: "The Eldritch Coast",
};

const PAGE_DESCRIPTIONS = {
  city: "In the Great City of Archadeus you'll find a shop with magical and non magical items, an archery range to learn shooting, a shrine to the great fox, a lively pub, a colorful wish fountain, and the grand royal castle.",
  pub: "In this pub there is a faerie serving drinks behind the bar. There are several yokai playing a game of dice. And there is a troll in the corner drinking by himself. It is cozy in here and everyone seems to be having a good time.",
  desert:
    "The Snake Sands is a vast desert of dunes, with a Snake Stone turn-in, protective sand snakes, a hidden oasis, a bustling market of rare wares, and short sand snake rides.",
  coast:
    "Along the Eldritch Coast the moonlit waves glow, traders peddle exotic wares on rocky docks, floors teem with mysterious holes, and a witch haven lies ashore.",
};

const PET_DETAILS = {
  dragon: `As a Dragon, you have lived a long time and desire a human companion. You have soared the skies and fought ancient wars. You feast on metals, treasure gold, and appreciate the brevity of human life.`,
  cat: `As a magical Cat, you mastered spells from Eldritch Coast witches. You love sunbathing, fish-catching, and playful belly rubs (with occasional gentle bites).`,
  dog: `As a magical Dog, you learned your craft in a distant tower. You spread joy with loyal magic, adore swims, woodland runs, and making your human smile.`,
  plant: `As a magical Plant, you emerged from swamp depths. You crave sunlight, curious exploration, and a human guide through the world of flesh.`,
  "space octopus": `As a Space Octopus, you drift the cosmos adjusting planets. You shrink your vast form, crave micro‑scale wonders, and ink vibrant nebulae with curious tentacles.`,
};

// ─── 2) Env vars & tuning constants ───────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SUMMARY_THRESHOLD = 20;
const WINDOW = 10;

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const jwt = (req.headers.authorization || "").replace(/^Bearer\s+/, "");
  if (!jwt) return res.status(401).json({ error: "Missing Supabase JWT" });

  // Scoped client for RLS
  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });

  const { prompt, page, userId, pet } = req.body || {};
  if (!prompt || !page || !userId)
    return res.status(400).json({ error: "Missing prompt, page or userId" });

  // derive mapId & friendly name
  const parts = page.split("/").filter((p) => p);
  const mapId = parts[parts.length - 1];
  const friendly = PAGE_NAMES[mapId] || mapId;

  // fetch full history
  const { data: chatRows, error: fetchErr } = await sb
    .from("chat_messages")
    .select("role, text, page, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (fetchErr) {
    console.error("DB fetch error:", fetchErr);
    return res.status(500).json({ error: "DB fetch failed" });
  }

  // load or summarize memory
  const { data: memRow } = await sb
    .from("chat_memories")
    .select("summary")
    .eq("user_id", userId)
    .eq("page", page)
    .single();
  let summary = memRow?.summary;
  if (!summary && chatRows.length > SUMMARY_THRESHOLD) {
    const toSummarize = chatRows
      .slice(0, chatRows.length - WINDOW)
      .map((r) => `${r.role}: ${r.text}`)
      .join("\n");
    try {
      const sumResp = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Condense to a 2-sentence summary." },
          { role: "user", content: toSummarize },
        ],
      });
      summary = sumResp.choices[0].message.content.trim();
      await sb.from("chat_memories").upsert({ user_id: userId, page, summary });
    } catch (e) {
      console.error("Summary error:", e);
    }
  }

  // load profile
  const { data: prof, error: profErr } = await sb
    .from("profiles")
    .select("full_name, favorite_color, bio")
    .eq("user_id", userId)
    .single();
  const profileMsg = prof
    ? `Profile — name: ${prof.full_name}, favorite color: ${prof.favorite_color}, bio: ${prof.bio}.`
    : null;

  // build system prompt
  const type = pet?.type || "magical creature";
  const name = pet?.name || "your pet";
  const personality = pet?.personality
    ? `You are ${pet.personality}.`
    : "You are kind and curious.";
  const details = PET_DETAILS[type.toLowerCase()] || "";
  const pageDetails = PAGE_DESCRIPTIONS[mapId] || "";

  const SYSTEM_PROMPT = `
You are a ${type} named ${name}.
${pageDetails}
${details}
${personality}

Speak in the pet’s voice, as if talking directly to your human friend.
Keep replies short, friendly, and in first person.
`.trim();

  // assemble messages
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "system",
      content: `Location: you are currently in "${friendly}".`,
    },
    ...(profileMsg ? [{ role: "system", content: profileMsg }] : []),
    ...(summary
      ? [{ role: "system", content: `Memory summary: ${summary}` }]
      : []),
    ...chatRows.slice(-WINDOW).map((r) => ({ role: r.role, content: r.text })),
    { role: "user", content: prompt },
  ];

  // call OpenAI
  let reply;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
    });
    reply = completion.choices[0].message.content.trim();
  } catch (e) {
    console.error("OpenAI error:", e);
    return res.status(500).json({ error: "AI service error" });
  }

  // log assistant reply (only once)
  await sb
    .from("chat_messages")
    .insert({ user_id: userId, role: "assistant", text: reply, page });

  // return
  return res.status(200).json({ reply });
}
