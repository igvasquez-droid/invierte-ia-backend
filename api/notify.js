const twilio = require("twilio");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

  const { message, secret } = req.body;

  if (!secret || secret !== process.env.APP_SECRET) {
    return res.status(401).json({ error: "No autorizado" });
  }
  if (!message) {
    return res.status(400).json({ error: "Falta el mensaje" });
  }

  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  try {
    const msg = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_FROM}`,
      to: `whatsapp:${process.env.USER_PHONE}`,
      body: message,
    });
    res.json({ success: true, sid: msg.sid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
