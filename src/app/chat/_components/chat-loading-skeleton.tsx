import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

const ChatLoadingPage = () => {
  return (
    <div className="flex-1 p-10 flex flex-col gap-5">
      <Skeleton className="h-[50px] w-full bg-slate-300" />
      <Skeleton className="h-[50px] w-full" />
      <Skeleton className="h-[50px] w-full bg-slate-300" />
      <Skeleton className="h-[50px] w-full" />
      <Skeleton className="h-[50px] w-full" />
      <Skeleton className="h-[50px] w-full bg-slate-300" />
      <Skeleton className="h-[50px] w-full" />
      <Skeleton className="h-[50px] w-full bg-slate-300" />
      <Skeleton className="h-[50px] w-full" />
    </div>
  );
};

export default ChatLoadingPage;
