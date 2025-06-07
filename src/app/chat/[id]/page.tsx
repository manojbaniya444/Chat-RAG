"use client";

import { useChat, Message } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

import { SidebarTrigger } from "@/components/ui/sidebar";

export default function Page() {
  const params = useParams();
  const chatId = params.id as string;

  const [initialMessages, setInitialMessages] = useState<Message[] | null>(
    null
  );
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const { userId } = useAuth();

  // Load messages once on mount
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const res = await fetch(`/api/messages?chatId=${chatId}`);
        if (res.ok) {
          const existingMessages = await res.json();

          // Filter only valid messages
          const formattedMessages = existingMessages?.messages
            .filter(
              (msg: any) => msg.role === "user" || msg.role === "assistant"
            )
            .map((msg: any) => ({
              role: msg.role,
              content: msg.content,
            }));

          setInitialMessages(formattedMessages);
        } else {
          console.error("Failed to load messages");
        }
      } catch (err) {
        console.error("Error fetching messages", err);
      }
    };

    loadMessages();
  }, [chatId]);

  // Only render the hook after messages are loaded
  const { messages, input, setInput, append, error } = useChat(
    initialMessages !== null
      ? {
          api: "/api/chat",
          initialMessages,
          body: { chatId, userId },
          onError: (error) => console.error("Chat error:", error),
        }
      : {}
  );

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  if (initialMessages === null) {
    return <div className="p-6">Loading chat...</div>;
  }

  return (
    <div className="flex flex-col h-screen">
      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-2 mx-6">
          {error.message || "An error occurred while fetching messages."}
        </div>
      )}

      <nav className="p-5 flex items-center gap-3 border-b bg-white">
          <SidebarTrigger className="border-1 cursor-pointer p-4"/>
        <h1 className="text-lg font-semibold truncate">Chat: {chatId}</h1>
      </nav>

      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-4"
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[70%] px-4 py-2 rounded-lg shadow prose prose-sm ${
                message.role === "user"
                  ? "bg-blue-500 text-white rounded-br-none prose-invert"
                  : "bg-white text-gray-800 rounded-bl-none border"
              }`}
            >
              <ReactMarkdown
                components={{
                  p: ({ children }) => (
                    <p className="mb-2 last:mb-0">{children}</p>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-bold">{children}</strong>
                  ),
                  em: ({ children }) => <em className="italic">{children}</em>,
                  code: ({ children }) => (
                    <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm font-mono">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-gray-100 text-gray-800 p-2 rounded text-sm font-mono overflow-x-auto">
                      {children}
                    </pre>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t bg-white">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (input.trim()) {
              append({
                content: input,
                role: "user",
                data: { chatId },
              });
              setInput("");
            }
          }}
          className="flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            placeholder="Type your message..."
          />
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full transition shadow"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
