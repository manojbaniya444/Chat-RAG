import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { UserButton } from "@clerk/nextjs";
import { Upload } from "lucide-react";
import Link from "next/link";
import ChatListPage from "./chat-list";

export function AppSidebar() {
  return (
    <Sidebar>
      {/* // upload button and user profile logout content */}
      <SidebarHeader>
        <div className="p-2 border-b border-border flex items-center justify-center gap-4">
          <Link href="/chat" className="flex-1">
            <button
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-input bg-background text-sm hover:bg-accent transition-colors cursor-pointer"
              type="button"
            >
              <Upload />
              <span>Upload New PDF</span>
            </button>
          </Link>
          <UserButton />
        </div>
      </SidebarHeader>
      {/* list all the chat by user */}
      <SidebarContent>
        <ChatListPage />
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
