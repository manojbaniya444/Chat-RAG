"use client";
import React, { ReactNode } from "react";
import { useRouter } from "next/navigation";

type ChatLayoutProps = {
    children: ReactNode;
};

const chatThreads = [
    { id: "1", name: "Chat 1" },
    { id: "2", name: "Chat 2" },
    { id: "3", name: "Chat 3" },
];

export default function ChatLayout({ children }: ChatLayoutProps) {
    const router = useRouter();

    const handleChatClick = (threadId: string) => {
        router.push(`/chat/${threadId}`);
    };

    return (
        <div className="flex h-screen">
            {/* Sidebar */}
            <aside className="w-72 bg-muted border-r border-border flex flex-col">
                <div className="p-4 border-b border-border">
                    <button
                        className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm hover:bg-accent transition-colors"
                        onClick={() => router.push("/chat")}
                    >
                        Start new chat by uploading a file
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <ul className="list-none m-0 p-0">
                        {chatThreads.map((chat) => (
                            <li
                                key={chat.id}
                                className="px-4 py-3 cursor-pointer hover:bg-accent transition-colors rounded"
                                onClick={() => handleChatClick(chat.id)}
                            >
                                {chat.name}
                            </li>
                        ))}
                    </ul>
                </div>
            </aside>
            {/* Main Content */}
            <main className="flex-1 bg-background overflow-auto">
                {children}
            </main>
        </div>
    );
}
