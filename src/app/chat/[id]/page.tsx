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

// CUID validation regex (Clerk uses CUID format)
const isCuid = (id: string): boolean => {
  const cuidRegex = /^c[0-9a-z]{24}$/;
  return cuidRegex.test(id);
};

export default function Page() {
  const params = useParams();
  const chatId = params.id as string;

  const [initialMessages, setInitialMessages] = useState<Message[] | null>(
    null
  );
  const [chatTitle, setChatTitle] = useState<string>("");
  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { userId } = useAuth();
  const router = useRouter();

  // Initialize useChat hook at top level (always call hooks in same order)
  const { messages, input, setInput, append, error, isLoading } = useChat({
    api: "/api/chat",
    initialMessages: initialMessages || [],
    body: { chatId, userId },
    onError: (error) => console.error("Chat error:", error.message),
  });

  // Load messages once on mount
  useEffect(() => {
    const loadMessages = async () => {
      // First, validate the chat ID format
      if (!isCuid(chatId)) {
        console.error("Invalid chat ID format:", chatId);
        setValidationError("Invalid chat ID format");
        setIsValidating(false);
        // Delay redirect to show error message briefly
        setTimeout(() => {
          router.push("/chat");
        }, 2000);
        return;
      }

      // If user is not authenticated, wait a bit and redirect
      if (!userId) {
        setValidationError("Authentication required");
        setIsValidating(false);
        setTimeout(() => {
          router.push("/chat");
        }, 1000);
        return;
      }

      try {
        setIsValidating(true);
        const res = await fetch(`/api/messages?chatId=${chatId}`);
        
        if (res.status === 404) {
          console.error("Chat not found:", chatId);
          setValidationError("Chat not found or you don't have access to it");
          setIsValidating(false);
          setTimeout(() => {
            router.push("/chat");
          }, 2000);
          return;
        }

        if (res.status === 403) {
          console.error("Access denied to chat:", chatId);
          setValidationError("You don't have access to this chat");
          setIsValidating(false);
          setTimeout(() => {
            router.push("/chat");
          }, 2000);
          return;
        }

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const existingMessages = await res.json();
        console.log("Chat loaded successfully:", existingMessages);

        // Set chat title
        setChatTitle(existingMessages.chat?.title || "Chat");

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
        setValidationError(null);
        setIsValidating(false);
      } catch (err) {
        console.error("Error fetching messages:", err);
        setValidationError("Failed to load chat. Redirecting...");
        setIsValidating(false);
        setTimeout(() => {
          router.push("/chat");
        }, 2000);
      }
    };

    loadMessages();
  }, [chatId, router, userId]);

  // Show validation error if there's one
  if (validationError) {
    return (
      <div className="flex flex-col h-screen">
        <div className="p-5 flex items-center gap-3 border-b bg-white">
          <SidebarTrigger className="border-1 cursor-pointer p-4" />
          <h1 className="text-lg font-semibold truncate">Error</h1>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Chat Not Found</h2>
            <p className="text-gray-600 mb-4">{validationError}</p>
            <p className="text-sm text-gray-500">Redirecting you to the chat dashboard...</p>
            <button 
              onClick={() => router.push("/chat")}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while validating
  if (isValidating || initialMessages === null) {
    return <ChatLoadingPage />;
  }

  return (
    <div className="flex flex-col h-screen">
      {error && <ErrorCard message={error.message} />}

      <div className="p-5 flex items-center gap-3 border-b bg-white">
        <SidebarTrigger className="border-1 cursor-pointer p-4" />
        <h1 className="text-lg font-semibold truncate">
          {chatTitle}
        </h1>
      </div>

      <ChatMessagesList messages={messages} />

      {isLoading && (
        <div className="mt-2 flex items-center space-x-2 px-4">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.32s]"></span>
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.16s]"></span>
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
          <span className="ml-2 text-xs text-gray-400">Please wait...</span>
        </div>
      )}

      {/* Message form submit */}
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
    </div>
  );
}
