import { prisma } from "@/lib/prisma";

export async function createNotification({
  userId,
  senderId,
  senderName,
  type,
  message,
  articleId,
}: {
  userId: string;
  senderId: string;
  senderName: string;
  type: "comment" | "post";
  message: string;
  articleId?: string;
}) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        senderId,
        senderName,
        type,
        message,
        articleId,
      },
    });

    // Notify standalone WebSocket server on port 3001
    fetch("http://localhost:3001/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        notification: {
          id: notification.id,
          senderName,
          type,
          message,
          articleId,
          read: false,
          createdAt: notification.createdAt.toISOString(),
        },
      }),
    }).catch((err) => {
      console.error("Failed to trigger WS notification:", err.message);
    });

    return notification;
  } catch (error) {
    console.error("Error creating notification in database:", error);
  }
}
