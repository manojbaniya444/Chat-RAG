"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth, UserButton } from "@clerk/nextjs";
import React, { ReactNode, useState } from "react";

type Props = {};

const SidebarPage = (props: Props) => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
      } catch (error) {
        // handle error if needed
        setChatThreads([]);
      }
    }
    fetchChats();
  }, [userId]);

  const handleChatClick = (threadId: string) => {
    setSidebarOpen(false);
    router.push(`/chat/${threadId}`);
  };
  return (
    <aside
      className="
                      hidden
                      md:flex
                      flex-col
                      border-r border-border
                      bg-muted
                      h-full
                      "
      style={{
        width: "30vw",
        minWidth: 220,
        maxWidth: 400,
      }}
    >
      <div className="p-4 border-b border-border flex items-center justify-between gap-4">
        <button
          className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm hover:bg-accent transition-colors"
          onClick={() => router.push("/chat")}
        >
          Start new chat by uploading a file
        </button>
        <UserButton />
      </div>
      <div className="flex-1 overflow-y-auto">
        <ul className="list-none m-0 p-0">
          {chatThreads?.map((chat: any) => (
            <li
              key={chat.id}
              className="px-4 py-3 cursor-pointer hover:bg-accent transition-colors rounded border-1"
              onClick={() => handleChatClick(chat.id)}
            >
              {chat.title}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default SidebarPage;
