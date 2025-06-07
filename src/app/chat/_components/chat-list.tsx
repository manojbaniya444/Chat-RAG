"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import React, { useState } from "react";

const ChatListPage = () => {
  const router = useRouter();
  const [chatThreads, setChatThreads] = useState([]);

  const { userId } = useAuth();

  useEffect(() => {
    async function fetchChats() {
      try {
        const res = await fetch(`/api/chat?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          console.log(data);
          console.log(userId);
          setChatThreads(data.chats);
        }
        console.log("hey");
      } catch {
        // handle error if needed
        setChatThreads([]);
      }
    }
    fetchChats();
  }, [userId, router]);

  const handleChatClick = (threadId: string) => {
    router.push(`/chat/${threadId}`);
  };
  return (
    <div className="flex flex-col gap-2 p-4">
      {chatThreads?.length === 0 ? (
        <div className="text-muted-foreground text-center py-8">
          No chats yet
        </div>
      ) : (
        chatThreads.map((chat: { id: string; title: string }) => (
          <div
            key={chat.id}
            className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-accent transition-colors border border-border"
            onClick={() => handleChatClick(chat.id)}
          >
            <div className="flex-1 truncate font-normal text-normal">
              {(() => {
                // Extract a nice title from filename or fallback
                const match = chat.title.match(/-(.*)\.pdf$/);
                return match
                  ? match[1].replace(/_/g, " ")
                  : chat.title.replace(/_/g, " ");
              })()}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ChatListPage;
