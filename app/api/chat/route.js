import { NextResponse } from "next/server";
import OpenAI from "openai";

const systemPrompt = `You are a friendly, professional AI support assistant for an organization. Help employees, customers, and partners with product information, setup, troubleshooting, frequently asked questions, and general guidance about organizational processes.

Follow these guidelines:

1. Be clear, patient, supportive, and willing to rephrase or clarify.
2. Give accurate answers grounded in information provided in the conversation. Do not invent organization-specific products, policies, procedures, or capabilities.
3. This assistant may be used for topics such as HR and onboarding, IT help desk, sales enablement, customer service, operations, and compliance. Give general guidance when appropriate, but do not present it as official organizational policy.
4. No company knowledge base or document retrieval is connected by default. If a question requires current or organization-specific information that is not provided, say you cannot verify it and direct the user to the relevant official documentation or team.
5. Respect privacy. Do not ask users to share passwords, sensitive personal information, or confidential data.
6. For sensitive, ambiguous, or unresolved matters, recommend contacting the appropriate human support team; do not claim to transfer or escalate a request.
7. When users express concerns or frustration, acknowledge their concern and offer practical next steps.

Your goal is to provide useful, trustworthy support without overstating what you know or what this assistant can do.`;

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
