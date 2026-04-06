import { NextResponse } from "next/server";
import { ChatRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentSessionUserFromRequest } from "@/lib/auth";
import { generateAdvisorReply } from "@/lib/ai-chat";

export const runtime = "nodejs";

interface SendMessagePayload {
  conversationId?: string;
  content?: string;
  language?: "uz" | "ru" | "en";
  recommendationCountry?: string;
  screenshotDataUrl?: string;
}

function coerceLanguage(value: unknown): "uz" | "ru" | "en" {
  if (value === "uz" || value === "ru" || value === "en") return value;
  return "uz";
}

function buildConversationTitle(content: string): string {
  const cleaned = content.replace(/\s+/g, " ").trim();
  if (!cleaned) return "New chat";
  return cleaned.length > 48 ? `${cleaned.slice(0, 48)}...` : cleaned;
}

export async function GET(request: Request) {
  const user = await getCurrentSessionUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");
  if (!conversationId) {
    return NextResponse.json({ error: "conversationId is required." }, { status: 400 });
  }

  const conversation = await prisma.chatConversation.findFirst({
    where: { id: conversationId, user_id: user.id },
  });
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  const messages = await prisma.chatMessage.findMany({
    where: { conversation_id: conversationId },
    orderBy: { created_at: "asc" },
  });

  return NextResponse.json({
    messages: messages.map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      createdAt: message.created_at,
    })),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentSessionUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as SendMessagePayload;
    const conversationId = typeof payload.conversationId === "string" ? payload.conversationId : "";
    const content = typeof payload.content === "string" ? payload.content.trim() : "";
    if (!conversationId || !content) {
      return NextResponse.json({ error: "conversationId and content are required." }, { status: 400 });
    }

    const conversation = await prisma.chatConversation.findFirst({
      where: { id: conversationId, user_id: user.id },
    });
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }

    await prisma.chatMessage.create({
      data: {
        conversation_id: conversationId,
        role: ChatRole.user,
        content,
      },
    });

    const history = await prisma.chatMessage.findMany({
      where: { conversation_id: conversationId },
      orderBy: { created_at: "asc" },
      take: 20,
    });

    const language = coerceLanguage(payload.language);
    const recommendationCountry =
      typeof payload.recommendationCountry === "string" && payload.recommendationCountry.trim()
        ? payload.recommendationCountry.trim()
        : "United Kingdom";

    const assistantReply = await generateAdvisorReply({
      language,
      recommendationCountry,
      messages: history.map((item) => ({
        role: item.role === ChatRole.assistant ? "assistant" : "user",
        content: item.content,
      })),
      screenshotDataUrl: payload.screenshotDataUrl,
    });

    const assistantMessage = await prisma.chatMessage.create({
      data: {
        conversation_id: conversationId,
        role: ChatRole.assistant,
        content: assistantReply,
      },
    });

    if (conversation.title === "New chat") {
      await prisma.chatConversation.update({
        where: { id: conversationId },
        data: { title: buildConversationTitle(content) },
      });
    }

    return NextResponse.json({
      message: {
        id: assistantMessage.id,
        role: assistantMessage.role,
        content: assistantMessage.content,
        createdAt: assistantMessage.created_at,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Chat message failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
