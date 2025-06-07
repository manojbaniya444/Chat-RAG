import { prisma } from "@/lib/prisma";

// Get the total user messages within 24hrs
// Used to Limit the user chat messages
export const getTotalUserMessagesInDuration = async (
  userId: string,
  twentyFourHoursAgo: Date
): Promise<number> => {
  const messageCount = await prisma.message.count({
    where: {
      chat: {
        user_id: userId,
      },
      role: "user",
      createdAt: {
        gte: twentyFourHoursAgo,
      },
    },
  });

  return messageCount;
};

// Get the total chat messages in count per chat
// Used to limit the chat context
export const getTotalMessagesInChat = async (
  chatId: string
): Promise<number> => {
  const chatMessageCount = await prisma.message.count({
    where: {
      chatId: chatId,
    },
  });
  return chatMessageCount;
};

// Returns the cooldown period in MilliSeconds
export const calculateCoolDownPeriod = async (
  userId: string,
  twentyFourHoursAgo: Date
): Promise<number> => {
  const latestMessage = await prisma.message.findFirst({
    where: {
      chat: {
        user_id: userId,
      },
      role: "user",
      createdAt: {
        gte: twentyFourHoursAgo,
      },
    },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  let cooldown = 0;
  if (latestMessage?.createdAt) {
    const msSinceLast =
      Date.now() - new Date(latestMessage.createdAt).getTime();
    cooldown = Math.max(0, 24 * 60 * 60 * 1000 - msSinceLast);
  }

  return cooldown;
};

// Format the time in hr:min:sec
export const formatTime = (ms: number) => {
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
};
