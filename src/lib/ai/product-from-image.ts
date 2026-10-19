export type AiProductCopy = {
  name: string;
  shortLine: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  suggestedCategory?: string;
  fabricNotes?: string;
};

function hasRealKey(value?: string | null) {
  if (!value) return false;
  const v = value.trim();
  if (!v) return false;
  if (v.startsWith("YOUR_")) return false;
  return true;
}

/**
 * Vision model reads the product photo and returns ELIJAYS storefront copy:
 * persuasive name + SEO description shoppers recognise as “this is the one”.
 */
export async function describeProductFromImage(input: {
  imageBase64: string;
  mimeType: string;
  hint?: string;
}): Promise<AiProductCopy> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!hasRealKey(apiKey)) {
    throw new Error(
      "Set OPENAI_API_KEY in .env to enable AI product naming and descriptions.",
    );
  }

  const model = process.env.OPENAI_VISION_MODEL || "gpt-4o-mini";
  const hint = input.hint?.trim();

  const system = `You are the merchandising copywriter for ELIJAYS Men's Wear, a Nairobi luxury menswear house (suits, shirts, trousers, jackets, accessories).
Write copy that makes a shopper open the product and think: “this is exactly what I want.”
Rules:
- Name: concrete, sellable, 3–8 words. Include colour / fabric / cut when visible. No fluff brands other than ELIJAYS tone.
- shortLine: one punchy benefit line (max 90 chars).
- description: 2–4 short paragraphs or line breaks. Focus on fit, fabric, when to wear it, and finish. Natural language for Kenyan shoppers (English). No hashtags.
- seoTitle: under 60 chars, include primary product keywords.
- seoDescription: under 155 chars, benefit + product type + Nairobi/ELIJAYS cue if it fits.
- suggestedCategory: one of Suits, Shirts, Trousers, Outerwear, Knitwear, Jeans, Accessories, or empty.
- fabricNotes: brief fabric/texture guess if visible.
Return ONLY valid JSON with keys: name, shortLine, description, seoTitle, seoDescription, suggestedCategory, fabricNotes.`;

  const userText = hint
    ? `Product photo for ELIJAYS. Merchant hint: ${hint}`
    : "Product photo for ELIJAYS. Infer the garment accurately from the image.";

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.55,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: [
            { type: "text", text: userText },
            {
              type: "image_url",
              image_url: {
                url: `data:${input.mimeType};base64,${input.imageBase64}`,
              },
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`AI vision failed (${res.status}): ${errText.slice(0, 240)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = data.choices?.[0]?.message?.content || "{}";
  let parsed: Partial<AiProductCopy>;
  try {
    parsed = JSON.parse(raw) as Partial<AiProductCopy>;
  } catch {
    throw new Error("AI returned invalid JSON");
  }

  const name = String(parsed.name || "").trim();
  if (!name) throw new Error("AI did not return a product name");

  return {
    name,
    shortLine: String(parsed.shortLine || "").trim(),
    description: String(parsed.description || "").trim(),
    seoTitle: String(parsed.seoTitle || name).trim(),
    seoDescription: String(parsed.seoDescription || parsed.shortLine || "").trim(),
    suggestedCategory: String(parsed.suggestedCategory || "").trim() || undefined,
    fabricNotes: String(parsed.fabricNotes || "").trim() || undefined,
  };
}
