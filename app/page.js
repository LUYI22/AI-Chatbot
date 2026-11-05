"use client";

import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { puter } from "@heyputer/puter.js";
import ReactMarkdown from "react-markdown";
import { useEffect, useRef, useState } from "react";

const MODEL_OPTIONS = [
  "gpt-6.1-sol",
  "gpt-6-astra",
  "gpt-6-luna",
  "gpt-5.4-nano",
  "gpt-6.1-sol-pro",
];

const INITIAL_MESSAGE = {
  role: "assistant",
  content: "Hi! I'm the AI support assistant. How can I help you today?",
};

const SYSTEM_PROMPT =
  "You are a friendly, helpful AI support assistant. Give clear, practical answers.";

export default function Home() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [message, setMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState(MODEL_OPTIONS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  const sendMessage = async () => {
    const userMessage = message.trim();
    if (!userMessage || isLoading) return;

    const conversation = messages
      .filter(({ content }) => content.trim())
      .slice(-8)
      .map(({ role, content }) => ({ role, content }));
    const nextMessages = [
      ...messages,
      { role: "user", content: userMessage },
      { role: "assistant", content: "" },
    ];

    setIsLoading(true);
    setError("");
    setMessage("");
    setMessages(nextMessages);

    try {
      const response = await puter.ai.chat(
        [{ role: "system", content: SYSTEM_PROMPT }, ...conversation, { role: "user", content: userMessage }],
        { model: selectedModel, stream: true }
      );

      let assistantReply = "";

      for await (const part of response) {
        if (part?.type === "error") {
          throw new Error(part.message || "The AI service returned an error.");
        }

        const text =
          typeof part === "string"
            ? part
            : typeof part?.text === "string"
              ? part.text
              : "";

        if (!text) continue;

        assistantReply += text;
        setMessages((currentMessages) => {
          const updated = [...currentMessages];
          const lastIndex = updated.length - 1;
          updated[lastIndex] = { ...updated[lastIndex], content: assistantReply };
          return updated;
        });
      }

      if (!assistantReply) {
        throw new Error("The AI service returned an empty response.");
      }
    } catch (err) {
      console.error("Puter AI request failed:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while sending your message."
      );
      setMessages((currentMessages) => {
        const updated = [...currentMessages];
        const lastIndex = updated.length - 1;
        updated[lastIndex] = {
          ...updated[lastIndex],
          content: "Sorry, I couldn't respond right now. Please try again.",
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    if (isLoading) return;
    setMessages([INITIAL_MESSAGE]);
    setMessage("");
    setError("");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Box component="main" className="chat-page">
      <Box className="chat-window">
        <Box component="header" className="chat-header">
          <Box className="brand">
            <Box className="brand-mark" aria-hidden="true">✦</Box>
            <Box>
              <Box className="brand-title">AI Support</Box>
              <Box className="brand-caption">Here to help, anytime</Box>
            </Box>
          </Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <FormControl size="small" className="model-control">
              <InputLabel id="model-select-label">Model</InputLabel>
              <Select
                labelId="model-select-label"
                value={selectedModel}
                label="Model"
                onChange={(event) => setSelectedModel(event.target.value)}
                disabled={isLoading}
              >
                {MODEL_OPTIONS.map((model) => (
                  <MenuItem key={model} value={model}>
                    {model}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              className="new-chat-button"
              onClick={startNewChat}
              disabled={isLoading}
              variant="outlined"
            >
              New chat
            </Button>
          </Stack>
        </Box>

        <Stack className="message-list" spacing={2.5}>
          {messages.map((chatMessage, index) => (
            <Box
              key={`${index}-${chatMessage.role}`}
              className={`message-row ${chatMessage.role === "user" ? "user-row" : ""}`}
            >
              {chatMessage.role === "assistant" ? (
                <Box className="assistant-avatar" aria-hidden="true">✦</Box>
              ) : null}
              <Box
                className={`message-bubble ${chatMessage.role === "user" ? "user-bubble" : "assistant-bubble"}`}
              >
                {chatMessage.role === "assistant" ? (
                  <ReactMarkdown>{chatMessage.content}</ReactMarkdown>
                ) : (
                  chatMessage.content
                )}
                {isLoading && index === messages.length - 1 && !chatMessage.content ? (
                  <span className="typing-indicator" aria-label="Assistant is responding">
                    <span />
                    <span />
                    <span />
                  </span>
                ) : null}
              </Box>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Stack>

        {error ? (
          <Box className="error-message" role="alert">
            {error}
          </Box>
        ) : null}

        <Box component="form" className="composer" onSubmit={(event) => {
          event.preventDefault();
          sendMessage();
        }}>
          <TextField
            className="message-input"
            placeholder="Ask me anything..."
            fullWidth
            multiline
            maxRows={5}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            inputProps={{ "aria-label": "Message" }}
          />
          <Button
            className="send-button"
            type="submit"
            variant="contained"
            disabled={isLoading || !message.trim()}
            aria-label="Send message"
          >
            {isLoading ? "..." : "Send"}
          </Button>
        </Box>
        <Box className="composer-hint">Enter to send · Shift + Enter for a new line</Box>
      </Box>
    </Box>
  );
}
