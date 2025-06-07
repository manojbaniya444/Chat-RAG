"use client";

import { useChat, Message } from "@ai-sdk/react";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

import { SidebarTrigger } from "@/components/ui/sidebar";
import ErrorCard from "../_components/error-card";
import ChatMessagesList from "../_components/chat-messages";
import ChatLoadingPage from "../_components/chat-loading-skeleton";

export default function Page() {
  const params = useParams();
  const chatId = params.id as string;

  const [initialMessages, setInitialMessages] = useState<Message[] | null>(
    null
  );

  const { userId } = useAuth();
  const router = useRouter();

  // Load messages once on mount
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const res = await fetch(`/api/messages?chatId=${chatId}`);
        if (res.ok) {
          const existingMessages = await res.json();
          console.log(existingMessages);

          // Filter only valid messages
          type Msg = { role: "user" | "assistant"; content: string };
          const formattedMessages = existingMessages?.messages
            .filter(
              (msg: Msg) => msg.role === "user" || msg.role === "assistant"
            )
            .map((msg: Msg) => ({
              role: msg.role,
              content: msg.content,
            }));

          setInitialMessages(formattedMessages);
        } else {
          console.error("Failed to load messages");
          router.push("/chat");
        }
      } catch (err) {
        console.error("Error fetching messages", err);
        router.push("/chat");
      }
    };

    loadMessages();
  }, [chatId, router]);

  // Only render the hook after messages are loaded
  const { messages, input, setInput, append, error, isLoading } = useChat(
    initialMessages !== null
      ? {
          api: "/api/chat",
          initialMessages,
          body: { chatId, userId },
          onError: (error) => console.error("Chat error:", error.message),
        }
      : {}
  );

  console.log(isLoading);

  return (
    <div className="flex flex-col h-screen">
      {error && <ErrorCard message={error.message} />}

      <div className="p-5 flex items-center gap-3 border-b bg-white">
        <SidebarTrigger className="border-1 cursor-pointer p-4" />
        <h1 className="text-lg font-semibold truncate">Chat: {chatId}</h1>
      </div>

      {initialMessages ? (
        <ChatMessagesList messages={messages} />
      ) : (
        <ChatLoadingPage />
      )}

      {isLoading && (
        <div className="mt-2 flex items-center space-x-2">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.32s]"></span>
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.16s]"></span>
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
          <span className="ml-2 text-xs text-gray-400">Please wait...</span>
        </div>
      )}

      {/* // message form submit*/}
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
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full transition shadow cursor-pointer"
          >
            Send
          </button>
        </form>
      </div>
      {/* // file form submit div */}
    </div>
  );
}
