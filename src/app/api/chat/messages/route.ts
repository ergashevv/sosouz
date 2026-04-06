import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSessionUserFromRequest } from "@/lib/auth";
import { generateAdvisorReply } from "@/lib/ai-chat";
import {
  parseChatMessageContent,
  serializeChatMessageContent,
} from "@/lib/chat-message-content";

export const runtime = "nodejs";

interface SendMessagePayload {
  conversationId?: string;
  content?: string;
  language?: "uz" | "ru" | "en";
  recommendationCountry?: string;
  screenshotDataUrl?: string;
  screenshotName?: string;
}

const ChatRole = {
  user: "user",
  assistant: "assistant",
} as const;

type ChatRoleValue = (typeof ChatRole)[keyof typeof ChatRole];

type ConversationRecord = {
  id: string;
  user_id: string;
  title: string;
};

type MessageRecord = {
  id: string;
  role: ChatRoleValue;
  content: string;
  created_at: Date;
};

type ChatConversationRepository = {
  findFirst: (args: unknown) => Promise<ConversationRecord | null>;
  update: (args: unknown) => Promise<unknown>;
};

type ChatMessageRepository = {
  findMany: (args: unknown) => Promise<MessageRecord[]>;
  create: (args: unknown) => Promise<MessageRecord>;
};

const chatConversationRepo =
  (prisma as unknown as { chatConversation: ChatConversationRepository }).chatConversation;
const chatMessageRepo = (prisma as unknown as { chatMessage: ChatMessageRepository }).chatMessage;

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

  const conversation = await chatConversationRepo.findFirst({
    where: { id: conversationId, user_id: user.id },
  });
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  const messages = await chatMessageRepo.findMany({
    where: { conversation_id: conversationId },
    orderBy: { created_at: "asc" },
  });

  return NextResponse.json({
    messages: messages.map((message) => {
      const parsed = parseChatMessageContent(message.content);
      return {
        id: message.id,
        role: message.role,
        content: parsed.text,
        attachmentDataUrl: parsed.attachmentDataUrl,
        attachmentName: parsed.attachmentName,
        createdAt: message.created_at,
      };
    }),
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
    const screenshotDataUrl =
      typeof payload.screenshotDataUrl === "string" ? payload.screenshotDataUrl.trim() : "";
    const screenshotName = typeof payload.screenshotName === "string" ? payload.screenshotName : null;
    if (!conversationId || (!content && !screenshotDataUrl)) {
      return NextResponse.json(
        { error: "conversationId and either content or screenshot are required." },
        { status: 400 },
      );
    }

    const conversation = await chatConversationRepo.findFirst({
      where: { id: conversationId, user_id: user.id },
    });
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }

    const savedUserMessage = await chatMessageRepo.create({
      data: {
        conversation_id: conversationId,
        role: ChatRole.user,
        content: serializeChatMessageContent({
          text: content,
          attachmentDataUrl: screenshotDataUrl || null,
          attachmentName: screenshotName,
        }),
      },
    });

    const history = await chatMessageRepo.findMany({
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
      messages: history
        .map((item) => {
          const parsed = parseChatMessageContent(item.content);
          const normalizedContent =
            parsed.text ||
            (parsed.attachmentDataUrl ? `[Attached image: ${parsed.attachmentName || "image"}]` : "");
          if (!normalizedContent) return null;
          return {
            role: item.role === ChatRole.assistant ? "assistant" : "user",
            content: normalizedContent,
          };
        })
        .filter((item): item is { role: "user" | "assistant"; content: string } => Boolean(item)),
      screenshotDataUrl,
    });

    const assistantMessage = await chatMessageRepo.create({
      data: {
        conversation_id: conversationId,
        role: ChatRole.assistant,
        content: assistantReply,
      },
    });

    if (conversation.title === "New chat") {
      const conversationTitleSeed = content || screenshotName || "Image message";
      await chatConversationRepo.update({
        where: { id: conversationId },
        data: { title: buildConversationTitle(conversationTitleSeed) },
      });
    }

    const parsedSavedUserMessage = parseChatMessageContent(savedUserMessage.content);

    return NextResponse.json({
      userMessage: {
        content: parsedSavedUserMessage.text,
        attachmentDataUrl: parsedSavedUserMessage.attachmentDataUrl,
        attachmentName: parsedSavedUserMessage.attachmentName,
        id: savedUserMessage.id,
        role: savedUserMessage.role,
        createdAt: savedUserMessage.created_at,
      },
      message: {
        id: assistantMessage.id,
        role: assistantMessage.role,
        content: assistantMessage.content,
        attachmentDataUrl: null,
        attachmentName: null,
        createdAt: assistantMessage.created_at,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Chat message failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
