const twilio = require("twilio");

module.exports = async function handler(req, res) {
  const auth = req.headers["authorization"];
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "No autorizado" });
  }

  try {
    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 500,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        system: "Eres asesor financiero chileno. Español simple, sin jerga.",
        messages: [{
          role: "user",
          content: `Busca hoy: tipo de cambio USD/CLP, noticias económicas Chile.
Perfil: ${process.env.USER_PROFILE || "Inversionista moderado en Chile con Fintual y BTG Pactual"}
Genera un mensaje WhatsApp con: tipo de cambio con flecha, 1 noticia relevante, 1 acción concreta.
Máximo 120 palabras. Usa emojis. SOLO el texto del mensaje, nada más.`
        }]
      })
    });

    const data = await claudeResponse.json();
    const analysis = data.content
      .filter(b => b.type === "text")
      .map(b => b.text)
      .join("");

    const fecha = new Date().toLocaleDateString("es-CL", {
      weekday: "long", day: "numeric", month: "long"
    });
    const msg = `◈ *InvierteIA — ${fecha}*\n\n${analysis}\n\n_Abre tu app para más detalles._`;

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_FROM}`,
      to: `whatsapp:${process.env.USER_PHONE}`,
      body: msg,
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
