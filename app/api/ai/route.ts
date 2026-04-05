export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-safeguard-20b", // ✅ FIXED FINAL MODEL
          messages: [
            {
              role: "system",
              content:
                "You are a smart voice assistant. Keep answers short and natural.",
            },
            {
              role: "user",
              content: message,
            },
          ],
          temperature: 0.7,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return Response.json({
        reply: "Groq Error: " + JSON.stringify(data),
      });
    }

    const reply =
      data?.choices?.[0]?.message?.content?.trim() ||
      "Sorry, I couldn't understand that.";

    return Response.json({ reply });

  } catch (error: any) {
    return Response.json({
      reply: "Server Error: " + error.message,
    });
  }
}