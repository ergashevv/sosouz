import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSessionUserFromRequest } from "@/lib/auth";
import { getConversationMessagePreview } from "@/lib/chat-message-content";

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
  findFirst: (args: unknown) => Promise<ConversationCreateRecord | null>;
  delete: (args: unknown) => Promise<{ id: string }>;
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
      lastMessage: item.messages[0]?.content ? getConversationMessagePreview(item.messages[0].content) : null,
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

export async function DELETE(request: Request) {
  const user = await getCurrentSessionUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => ({}))) as { conversationId?: unknown };
  const conversationId =
    typeof payload.conversationId === "string" ? payload.conversationId.trim() : "";
  if (!conversationId) {
    return NextResponse.json({ error: "conversationId is required." }, { status: 400 });
  }

  const conversation = await chatConversationRepo.findFirst({
    where: { id: conversationId, user_id: user.id },
    select: { id: true, title: true, updated_at: true },
  });
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  await chatConversationRepo.delete({ where: { id: conversationId } });
  return NextResponse.json({ ok: true, deletedConversationId: conversationId });
}
