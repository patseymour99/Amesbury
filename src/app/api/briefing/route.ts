import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { format } from "date-fns";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { events, tasks, trips, date } = await req.json();

    const today = new Date(date);
    const dayName = format(today, "EEEE");

    const eventsText =
      events.length > 0
        ? events
            .map(
              (e: { title: string; userRole: string; allDay: boolean; startDate: string }) =>
                `- ${e.title} (${e.userRole === "mum" ? "Mum" : "Dad"}, ${e.allDay ? "all day" : format(new Date(e.startDate), "h:mm a")})`
            )
            .join("\n")
        : "No events today";

    const tasksText =
      tasks.length > 0
        ? tasks
            .slice(0, 5)
            .map((t: { title: string; priority: string }) => `- ${t.title} (${t.priority} priority)`)
            .join("\n")
        : "No pending tasks";

    const tripsText =
      trips.length > 0
        ? trips
            .slice(0, 3)
            .map((t: { destination: string; startDate: string }) => {
              const days = Math.ceil(
                (new Date(t.startDate).getTime() - today.getTime()) / 86400000
              );
              return `- ${t.destination} in ${days} day${days !== 1 ? "s" : ""}`;
            })
            .join("\n")
        : "No upcoming trips";

    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 400,
      system: `You are a warm, friendly AI assistant for the Amesbury family hub.
Write a brief, personalised morning briefing for the family.
Be warm, encouraging and practical. Use British English. Keep it to 3-4 sentences.
Do not use bullet points — write in flowing prose.`,
      messages: [
        {
          role: "user",
          content: `Please write a morning briefing for ${dayName}.

Today's events:
${eventsText}

Pending tasks:
${tasksText}

Upcoming trips:
${tripsText}

Write a warm, encouraging briefing that highlights what's on today and anything coming up soon. Keep it personal and friendly.`,
        },
      ],
    });

    const briefing =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ briefing });
  } catch (error) {
    console.error("Briefing API error:", error);
    return NextResponse.json(
      { error: "Failed to generate briefing" },
      { status: 500 }
    );
  }
}
