import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSessionUserFromRequest } from "@/lib/auth";

export const runtime = "nodejs";

interface FeedbackPayload {
  conversationId?: string;
  messageId?: string;
  helpful?: boolean;
  language?: "uz" | "ru" | "en";
  recommendationCountry?: string;
}

type ConversationRecord = {
  id: string;
  user_id: string;
};

type MessageRecord = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
};

type FeedbackRecord = {
  id: string;
  message_id: string;
};

type ChatConversationRepository = {
  findFirst: (args: unknown) => Promise<ConversationRecord | null>;
};

type ChatMessageRepository = {
  findFirst: (args: unknown) => Promise<MessageRecord | null>;
};

type ChatFeedbackRepository = {
  findUnique: (args: unknown) => Promise<FeedbackRecord | null>;
  create: (args: unknown) => Promise<FeedbackRecord>;
  update: (args: unknown) => Promise<FeedbackRecord>;
};

const chatConversationRepo =
  (prisma as unknown as { chatConversation: ChatConversationRepository }).chatConversation;
const chatMessageRepo = (prisma as unknown as { chatMessage: ChatMessageRepository }).chatMessage;
const chatFeedbackRepo = (prisma as unknown as { chatMessageFeedback: ChatFeedbackRepository }).chatMessageFeedback;

function coerceLanguage(value: unknown): "uz" | "ru" | "en" {
  if (value === "uz" || value === "ru" || value === "en") return value;
  return "uz";
}

export async function POST(request: Request) {
  const user = await getCurrentSessionUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as FeedbackPayload;
    const conversationId =
      typeof payload.conversationId === "string" ? payload.conversationId.trim() : "";
    const messageId = typeof payload.messageId === "string" ? payload.messageId.trim() : "";
    const helpful = payload.helpful === true;
    const language = coerceLanguage(payload.language);
    const recommendationCountry =
      typeof payload.recommendationCountry === "string" ? payload.recommendationCountry.trim() : "";

    if (!conversationId || !messageId) {
      return NextResponse.json({ error: "conversationId and messageId are required." }, { status: 400 });
    }

    const conversation = await chatConversationRepo.findFirst({
      where: { id: conversationId, user_id: user.id },
    });
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }

    const message = await chatMessageRepo.findFirst({
      where: { id: messageId, conversation_id: conversationId },
    });
    if (!message || message.role !== "assistant") {
      return NextResponse.json({ error: "Assistant message not found." }, { status: 404 });
    }

    const existing = await chatFeedbackRepo.findUnique({
      where: { message_id: messageId },
    });

    if (existing) {
      await chatFeedbackRepo.update({
        where: { id: existing.id },
        data: {
          helpful,
          language,
          recommendation_country: recommendationCountry || null,
          updated_at: new Date(),
        },
      });
    } else {
      await chatFeedbackRepo.create({
        data: {
          user_id: user.id,
          conversation_id: conversationId,
          message_id: messageId,
          helpful,
          language,
          recommendation_country: recommendationCountry || null,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[chat/feedback] failed", { message: errorMessage });
    return NextResponse.json({ error: "Could not save feedback." }, { status: 500 });
  }
}
