import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { topic, platform, tone } = await request.json();

  if (!topic) {
    return NextResponse.json({ error: "Aihe puuttuu" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI ei ole käytössä — ANTHROPIC_API_KEY puuttuu" }, { status: 500 });
  }

  const platformInstructions =
    platform === "instagram"
      ? "Kirjoita Instagram-postaus: lyhyt ja napakka, käytä emojeja, lisää 5-8 relevanttia hashtagia lopussa."
      : platform === "facebook"
      ? "Kirjoita Facebook-postaus: voi olla hieman pidempi ja informatiivisempi, ei pakollisia hashtageja."
      : "Kirjoita some-postaus joka sopii sekä Facebookiin että Instagramiin. Lisää 3-5 hashtagia.";

  const toneText =
    tone === "ammattimainen"
      ? "Käytä ammattimaista ja luotettavaa sävyä."
      : tone === "rento"
      ? "Käytä rentoa ja lämminhenkistä sävyä."
      : tone === "innostunut"
      ? "Käytä innostunutta ja energistä sävyä."
      : "Käytä ystävällistä ja luontevaa sävyä.";

  const prompt = `Olet some-markkinoinnin asiantuntija kauneus- ja hyvinvointialalla. Kirjoitat postauksia RNR Salonki -yritykselle.

${platformInstructions}
${toneText}

Aihe: ${topic}

Kirjoita vain postauksen teksti, ei selityksiä tai otsikoita. Teksti heti suoraan.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 400,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }

    const text = data.content?.[0]?.text || "";
    return NextResponse.json({ text });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
