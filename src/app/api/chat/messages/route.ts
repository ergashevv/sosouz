import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSessionUserFromRequest } from "@/lib/auth";
import { generateAdvisorReply, toUserFacingAiError, type AdvisorContext } from "@/lib/ai-chat";
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
  advisorContext?: unknown;
  replyToMessageId?: string;
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
  findFirst: (args: unknown) => Promise<MessageRecord | null>;
};

const chatConversationRepo =
  (prisma as unknown as { chatConversation: ChatConversationRepository }).chatConversation;
const chatMessageRepo = (prisma as unknown as { chatMessage: ChatMessageRepository }).chatMessage;

function coerceLanguage(value: unknown): "uz" | "ru" | "en" {
  if (value === "uz" || value === "ru" || value === "en") return value;
  return "uz";
}

function parseAdvisorContextPayload(raw: unknown): AdvisorContext | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const name = typeof o.name === "string" ? o.name.trim() : "";
  if (!name) return undefined;
  const country = typeof o.country === "string" ? o.country.trim() : undefined;
  const officialWebsite =
    o.officialWebsite === null
      ? null
      : typeof o.officialWebsite === "string"
        ? o.officialWebsite.trim() || null
        : undefined;
  const nationalRank =
    typeof o.nationalRank === "number" && Number.isFinite(o.nationalRank)
      ? Math.trunc(o.nationalRank)
      : undefined;
  const worldRank =
    typeof o.worldRank === "number" && Number.isFinite(o.worldRank)
      ? Math.trunc(o.worldRank)
      : undefined;
  const rankingSourceUrl =
    o.rankingSourceUrl === null
      ? null
      : typeof o.rankingSourceUrl === "string"
        ? o.rankingSourceUrl.trim() || null
        : undefined;
  const domain = typeof o.domain === "string" ? o.domain.trim() : undefined;
  return {
    name,
    country,
    officialWebsite: officialWebsite ?? undefined,
    nationalRank,
    worldRank,
    rankingSourceUrl: rankingSourceUrl ?? undefined,
    domain,
  };
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
        replyToMessageId: parsed.replyToMessageId,
        replyToRole: parsed.replyToRole,
        replyToText: parsed.replyToText,
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

  let language: "uz" | "ru" | "en" = "uz";
  try {
    const payload = (await request.json()) as SendMessagePayload;
    const conversationId = typeof payload.conversationId === "string" ? payload.conversationId : "";
    const content = typeof payload.content === "string" ? payload.content.trim() : "";
    const screenshotDataUrl =
      typeof payload.screenshotDataUrl === "string" ? payload.screenshotDataUrl.trim() : "";
    const screenshotName = typeof payload.screenshotName === "string" ? payload.screenshotName : null;
    const replyToMessageId =
      typeof payload.replyToMessageId === "string" ? payload.replyToMessageId.trim() : "";
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

    let replyToMeta:
      | { messageId: string; role: "user" | "assistant"; text: string }
      | null = null;
    if (replyToMessageId) {
      const replyTarget = await chatMessageRepo.findFirst({
        where: { id: replyToMessageId, conversation_id: conversationId },
      });
      if (replyTarget) {
        const parsedReplyTarget = parseChatMessageContent(replyTarget.content);
        const previewText =
          parsedReplyTarget.text.trim() ||
          (parsedReplyTarget.attachmentDataUrl
            ? `[Attached image: ${parsedReplyTarget.attachmentName || "image"}]`
            : "");
        if (previewText) {
          replyToMeta = {
            messageId: replyTarget.id,
            role: replyTarget.role === ChatRole.assistant ? "assistant" : "user",
            text: previewText.slice(0, 280),
          };
        }
      }
    }

    const savedUserMessage = await chatMessageRepo.create({
      data: {
        conversation_id: conversationId,
        role: ChatRole.user,
        content: serializeChatMessageContent({
          text: content,
          attachmentDataUrl: screenshotDataUrl || null,
          attachmentName: screenshotName,
          replyToMessageId: replyToMeta?.messageId || null,
          replyToRole: replyToMeta?.role || null,
          replyToText: replyToMeta?.text || null,
        }),
      },
    });

    const history = await chatMessageRepo.findMany({
      where: { conversation_id: conversationId },
      orderBy: { created_at: "asc" },
      take: 20,
    });

    language = coerceLanguage(payload.language);
    const advisorFromPayload = parseAdvisorContextPayload(payload.advisorContext);
    const recommendationCountry =
      typeof payload.recommendationCountry === "string" && payload.recommendationCountry.trim()
        ? payload.recommendationCountry.trim()
        : advisorFromPayload?.country || "United Kingdom";

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
          const replyPrefix =
            parsed.replyToText && parsed.replyToRole
              ? `Reply to ${parsed.replyToRole}: "${parsed.replyToText}"\n`
              : "";
          return {
            role: item.role === ChatRole.assistant ? "assistant" : "user",
            content: `${replyPrefix}${normalizedContent}`.trim(),
          };
        })
        .filter((item): item is { role: "user" | "assistant"; content: string } => Boolean(item)),
      screenshotDataUrl,
      context: advisorFromPayload,
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
        replyToMessageId: parsedSavedUserMessage.replyToMessageId,
        replyToRole: parsedSavedUserMessage.replyToRole,
        replyToText: parsedSavedUserMessage.replyToText,
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
        replyToMessageId: null,
        replyToRole: null,
        replyToText: null,
        createdAt: assistantMessage.created_at,
      },
    });
  } catch (error: unknown) {
    const errorStatus =
      typeof (error as { status?: unknown })?.status === "number"
        ? (error as { status: number }).status
        : typeof (error as { statusCode?: unknown })?.statusCode === "number"
          ? (error as { statusCode: number }).statusCode
          : null;
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[chat/messages] AI request failed", {
      status: errorStatus,
      message: errorMessage,
    });
    const userFacing = toUserFacingAiError(error, language);
    return NextResponse.json({ error: userFacing.message }, { status: userFacing.status });
  }
}
