"use client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import React, { useState } from "react";

const ChatListPage = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [chatThreads, setChatThreads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const { userId } = useAuth();

  // Get current chat ID from pathname
  const currentChatId = pathname.startsWith("/chat/") ? pathname.split("/chat/")[1] : null;

  const fetchChats = useCallback(async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      const res = await fetch(`/api/chat?userId=${userId}`, {
        // Add cache busting to ensure fresh data
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setChatThreads(data.chats);
      }
    } catch (error) {
      console.error("Failed to fetch chats:", error);
      setChatThreads([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Initial fetch
  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Listen for chat list updates
  useEffect(() => {
    const handleChatListUpdate = (event: CustomEvent) => {
      console.log("Chat list update received:", event.detail);
      // Refresh the chat list when a new chat is created
      fetchChats();
    };

    // Add event listener for custom chat update events
    window.addEventListener('chatListUpdate', handleChatListUpdate as EventListener);

    return () => {
      window.removeEventListener('chatListUpdate', handleChatListUpdate as EventListener);
    };
  }, [fetchChats]);

  const handleChatClick = (threadId: string) => {
    router.push(`/chat/${threadId}`);
  };
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-4">
        {/* Loading skeleton */}
        {[...Array(3)].map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-2 rounded-lg border border-border"
          >
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-4">
      {chatThreads?.length === 0 ? (
        <div className="text-muted-foreground text-center py-8">
          <div className="text-sm">No chats yet</div>
          <div className="text-xs mt-1 opacity-70">
            Upload a PDF to get started
          </div>
        </div>
      ) : (
        chatThreads.map((chat: { id: string; title: string; createdAt: string }) => {
          const isActive = currentChatId === chat.id;
          return (
            <div
              key={chat.id}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border ${
                isActive
                  ? "bg-blue-50 border-blue-200 shadow-sm"
                  : "border-border hover:bg-accent hover:shadow-sm"
              }`}
              onClick={() => handleChatClick(chat.id)}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                isActive ? "bg-blue-200" : "bg-blue-100"
              }`}>
                <svg className={`w-4 h-4 ${
                  isActive ? "text-blue-700" : "text-blue-600"
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-medium text-sm truncate ${
                  isActive ? "text-blue-900" : "text-foreground"
                }`}>
                  {(() => {
                    // Extract a nice title from filename or fallback
                    const match = chat.title.match(/-(.*)\.pdf$/);
                    return match
                      ? match[1].replace(/_/g, " ")
                      : chat.title.replace(/_/g, " ");
                  })()}
                </div>
                <div className={`text-xs ${
                  isActive ? "text-blue-600" : "text-muted-foreground"
                }`}>
                  {new Date(chat.createdAt).toLocaleDateString()}
                </div>
              </div>
              {isActive && (
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default ChatListPage;
