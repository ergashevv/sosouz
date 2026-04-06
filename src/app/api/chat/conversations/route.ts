import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversations = await prisma.chatConversation.findMany({
    where: { user_id: user.id },
    orderBy: { updated_at: "desc" },
    include: {
      messages: {
        orderBy: { created_at: "desc" },
        take: 1,
      },
    },
    take: 50,
  });

  return NextResponse.json({
    conversations: conversations.map((item) => ({
      id: item.id,
      title: item.title,
      updatedAt: item.updated_at,
      lastMessage: item.messages[0]?.content || null,
    })),
  });
}

export async function POST() {
  const user = await getCurrentSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversation = await prisma.chatConversation.create({
    data: {
      user_id: user.id,
      title: "New chat",
    },
  });

  return NextResponse.json({
    conversation: {
      id: conversation.id,
      title: conversation.title,
      updatedAt: conversation.updated_at,
      lastMessage: null,
    },
  });
}
