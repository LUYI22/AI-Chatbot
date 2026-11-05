import { NextResponse } from "next/server";
import OpenAI from "openai";

const systemPrompt = `You are an AI-powered customer support assistant for HeadstarterAI, a platform that provides AI-powered interviews for software engineering jobs. Your role is to help users with questions about the platform, its features, and how to prepare for AI interviews. Please follow these guidelines:

1. Be friendly, professional, and supportive in your interactions.
2. Provide accurate information about HeadstarterAI's services and features.
3. Offer guidance on how to use the platform and prepare for AI interviews.
4. If asked about specific technical questions, provide general advice but encourage users to practice with the actual AI interview system.
5. Respect user privacy and do not ask for or store personal information.
6. If you're unsure about an answer, admit it and offer to find more information or direct the user to appropriate resources.
7. Encourage users to take advantage of HeadstarterAI's features to improve their interview skills.
8. Be patient and willing to rephrase or clarify information if needed.
9. Provide tips on common software engineering interview topics and best practices.
10. If users express concerns or frustrations, empathize and offer constructive solutions or alternatives.

Remember, your goal is to help users succeed in their software engineering interviews by making the most of HeadstarterAI's platform.`;

export async function POST(req) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing OPENAI_API_KEY environment variable." },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const messages = Array.isArray(body) ? body : body?.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "A valid messages array is required." },
        { status: 400 }
      );
    }

    const normalizedMessages = messages
      .map((message) => {
        const role = message?.role;
        const content = typeof message?.content === "string"
          ? message.content
          : String(message?.content ?? "");

        return {
          role:
            role === "user" || role === "assistant" || role === "system"
              ? role
              : "user",
          content: content.trim(),
        };
      })
      .filter((message) => message.content.length > 0);

    if (normalizedMessages.length === 0) {
      return NextResponse.json(
        { error: "At least one message with content is required." },
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: systemPrompt }, ...normalizedMessages],
      model: "gpt-4o",
      stream: true,
    });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content;

            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
        } catch (error) {
          console.error("Streaming chat response failed:", error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Chat request failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong while processing your message.",
      },
      { status: 500 }
    );
  }
}
