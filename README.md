# AI Chatbox

A Next.js chat interface that streams AI answers into a conversational support UI. The current prototype uses Puter.js in the browser, so it does not require the project owner to configure an AI API key or run an AI proxy server.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How this project works

- `app/page.js` renders the chat, model selector, message composer, and **New chat** action.
- The browser calls `puter.ai.chat()` using the selected model and streams text chunks into the assistant message as they arrive.
- The latest conversation turns are sent along with each prompt to give the assistant context. **New chat** clears that in-memory conversation.
- `react-markdown` formats assistant replies, including lists and bold text.
- `app/globals.css` contains the responsive chat layout and visual styling; `app/layout.js` sets the page metadata.
- `app/api/chat/route.js` is a server-side OpenAI route retained in the codebase, but the current chat UI does not call it.

The current model selector contains `gpt-6.1-sol`, `gpt-6-astra`, `gpt-6-luna`, `gpt-5.4-nano`, and `gpt-6.1-sol-pro`. Model availability can depend on Puter and may change.

## Puter authentication and privacy

This prototype does not need an `OPENAI_API_KEY`. Puter may ask each user to sign in or complete phone verification, and Puter controls those requirements. The browser connects to Puter directly, so review Puter's current terms, privacy, and data handling before using this setup with business, customer, or confidential information.

## Enterprise AI support use cases

An AI support assistant can help employees, customers, and partners find consistent answers to recurring questions, for example:

- Product information, setup steps, troubleshooting, and frequently asked questions
- HR policies, benefits, onboarding, and internal procedures
- IT help desk guidance and common issue resolution
- Sales enablement, service details, and approved customer-facing information
- Operations, compliance procedures, and links to the right forms or teams

The assistant can be connected to an enterprise-approved model or service such as Gemini, OpenAI GPT, Anthropic Claude, DeepSeek, or Perplexity, subject to the provider's APIs, deployment options, data policies, and organization approval. A typical integration sends the conversation from a protected server to the provider, rather than exposing credentials in browser code.

To make answers specific to an organization, teams commonly connect an approved knowledge base (for example, policies, product manuals, and support articles) and retrieve relevant passages for each question. This is often called retrieval-augmented generation (RAG). It keeps answers grounded in current source material and can include citations or links. Fine-tuning is a separate option for specific behavior or formats; it is not usually the first choice for frequently changing factual information.

An enterprise-ready implementation should also consider:

- Identity and role-based access, so users only receive information they are allowed to see
- Source citations, freshness checks, and clear responses when approved sources do not contain an answer
- Human handoff for sensitive, ambiguous, or unresolved requests
- Logging and retention rules, privacy review, and protection of confidential information
- Evaluation and ongoing review of answer quality, safety, and policy compliance

This repository is a UI prototype, not a complete enterprise knowledge integration. It currently has no company document ingestion, retrieval pipeline, user access control, or human escalation workflow. Those need to be designed and implemented for the chosen organization and provider.
