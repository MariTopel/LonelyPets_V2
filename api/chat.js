// src/api/chat.js
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { PAGE_NAMES, PAGE_DESCRIPTIONS } from "../config/pageData.js";
import { PET_DETAILS } from "../config/petData.js";

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
