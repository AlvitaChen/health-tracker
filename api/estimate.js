export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const key = process.env.ANTHROPIC_API_KEY;
    console.log("Key exists:", !!key);
    console.log("Key length:", key?.length);
    console.log("Key starts with:", key?.substring(0, 10));
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    console.log("Anthropic response:", JSON.stringify(data));
    res.status(200).json(data);
  } catch (error) {
    console.log("Error:", error.message);
    res.status(500).json({ error: error.message });
  }
}
