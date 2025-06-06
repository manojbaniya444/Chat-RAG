"use client";
import React, { ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth, UserButton } from "@clerk/nextjs";

type ChatLayoutProps = {
  children: ReactNode;
};

export default function ChatLayout({ children }: ChatLayoutProps) {
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
    <div className="flex h-screen justify-center bg-background">
      {/* Sidebar for md+ screens */}
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

      {/* Sidebar modal for small screens */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative bg-muted h-full w-4/5 max-w-xs flex flex-col border-r border-border">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <span className="font-semibold">Chats</span>
              <button
                className="text-lg px-2"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close sidebar"
              >
                ×
              </button>
            </div>
            <div className="p-4 border-b border-border flex items-center justify-between gap-4">
              <button
                className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm hover:bg-accent transition-colors"
                onClick={() => {
                  setSidebarOpen(false);
                  router.push("/chat");
                }}
              >
                Start new chat by uploading a file
              </button>
              <UserButton />
            </div>
            <div className="flex-1 overflow-y-auto">
              <ul className="list-none m-0 p-0">
                {chatThreads.map((chat: any) => (
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
        </div>
      )}

      {/* Main Content */}
      <main
        className="
                    flex-1
                    bg-background
                    overflow-auto
                    relative
                    max-w-screen-lg
                    w-full
                "
        style={{
          minWidth: 0,
        }}
      >
        {/* Show sidebar toggle button on small screens */}
        <button
          className="md:hidden absolute top-4 left-4 z-10 p-2 rounded bg-muted border border-border shadow"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open sidebar"
        >
          ☰
        </button>
        {children}
      </main>
    </div>
  );
}
