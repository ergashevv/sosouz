import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSessionUserFromRequest } from "@/lib/auth";

export const runtime = "nodejs";

type ConversationRecord = {
  id: string;
  title: string;
  updated_at: Date;
  messages: Array<{ content: string }>;
};

type ConversationCreateRecord = {
  id: string;
  title: string;
  updated_at: Date;
};

type ChatConversationRepository = {
  findMany: (args: unknown) => Promise<ConversationRecord[]>;
  create: (args: unknown) => Promise<ConversationCreateRecord>;
};

const chatConversationRepo =
  (prisma as unknown as { chatConversation: ChatConversationRepository }).chatConversation;

export async function GET(request: Request) {
  const user = await getCurrentSessionUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversations = await chatConversationRepo.findMany({
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

export async function POST(request: Request) {
  const user = await getCurrentSessionUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversation = await chatConversationRepo.create({
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
