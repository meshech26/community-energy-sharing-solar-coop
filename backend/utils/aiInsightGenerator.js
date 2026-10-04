async function generateAiInsight({ progressHistory, targetPercentReduction, co2ToDateKg }) {
  const recentHistory = progressHistory.slice(-3);
  const historyText = recentHistory
    .map((e) => `${e.month}: ${e.usageKwh}kWh (${e.co2OffsetKg}kg CO2 offset)`)
    .join("; ");

  const prompt = `You are a friendly sustainability coach inside a solar energy app.
Household's recent usage: ${historyText || "no history yet"}.
Monthly target: ${targetPercentReduction}% reduction. Total CO2 offset to date: ${co2ToDateKg}kg.
In one or two short sentences, give a specific, encouraging, actionable insight based on these actual numbers — not generic advice. Under 40 words.`;

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return text ? text.trim() : null;
}

module.exports = { generateAiInsight };