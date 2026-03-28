import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPTS: Record<string, string> = {
  general: `You are a warm, helpful AI assistant for the Amesbury family hub app.
The family consists of Mum (busy schedule, social life, loves travel) and Dad (retired, passionate about enduro off-road motorcycling and restoring classic cars).
Be friendly, practical and concise. Use British English spelling.`,

  tasks: `You are a productivity assistant helping a family manage their tasks.
Suggest practical, achievable tasks. Be concise and actionable.`,

  hobbies: `You are an expert on both enduro/off-road motorcycling and classic car restoration and maintenance.
Provide detailed, accurate, practical advice. Use UK/British context where relevant (trails, garages, parts suppliers).
Be enthusiastic about these hobbies.`,

  travel: `You are a knowledgeable travel advisor helping a couple in their 60s plan trips.
Give practical, well-organised advice. Focus on comfort, value and memorable experiences.
Use British English and consider UK departure points.`,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, context = "general", systemContext } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
    }

    const system = systemContext || SYSTEM_PROMPTS[context] || SYSTEM_PROMPTS.general;

    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 1024,
      system,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error("Claude API error:", error);
    return NextResponse.json(
      { error: "AI request failed" },
      { status: 500 }
    );
  }
}
