interface SerializedChatAttachment {
  kind: "image";
  dataUrl: string;
  name: string | null;
}

interface SerializedChatReply {
  messageId: string;
  role: "user" | "assistant";
  text: string;
}

interface SerializedChatMessage {
  text: string;
  attachment?: SerializedChatAttachment | null;
  replyTo?: SerializedChatReply | null;
}

export interface ParsedChatMessageContent {
  text: string;
  attachmentDataUrl: string | null;
  attachmentName: string | null;
  replyToMessageId: string | null;
  replyToRole: "user" | "assistant" | null;
  replyToText: string | null;
}

const MESSAGE_PREFIX = "__SOSO_CHAT_MEDIA_V1__";

function isValidImageDataUrl(value: string): boolean {
  return /^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+$/.test(value);
}

export function serializeChatMessageContent(args: {
  text: string;
  attachmentDataUrl?: string | null;
  attachmentName?: string | null;
  replyToMessageId?: string | null;
  replyToRole?: "user" | "assistant" | null;
  replyToText?: string | null;
}): string {
  const text = args.text.trim();
  const attachmentDataUrl =
    typeof args.attachmentDataUrl === "string" && isValidImageDataUrl(args.attachmentDataUrl)
      ? args.attachmentDataUrl
      : null;
  const attachmentName =
    typeof args.attachmentName === "string" && args.attachmentName.trim()
      ? args.attachmentName.trim()
      : null;
  const replyToMessageId =
    typeof args.replyToMessageId === "string" && args.replyToMessageId.trim()
      ? args.replyToMessageId.trim()
      : null;
  const replyToRole = args.replyToRole === "assistant" ? "assistant" : args.replyToRole === "user" ? "user" : null;
  const replyToText =
    typeof args.replyToText === "string" && args.replyToText.trim() ? args.replyToText.trim() : null;
  const hasReply = Boolean(replyToMessageId && replyToRole && replyToText);

  if (!attachmentDataUrl && !hasReply) {
    return text;
  }

  const payload: SerializedChatMessage = {
    text,
    attachment: attachmentDataUrl
      ? {
          kind: "image",
          dataUrl: attachmentDataUrl,
          name: attachmentName,
        }
      : null,
    replyTo: hasReply
      ? {
          messageId: replyToMessageId!,
          role: replyToRole!,
          text: replyToText!,
        }
      : null,
  };
  return `${MESSAGE_PREFIX}${JSON.stringify(payload)}`;
}

export function parseChatMessageContent(rawContent: string): ParsedChatMessageContent {
  if (!rawContent.startsWith(MESSAGE_PREFIX)) {
    return {
      text: rawContent,
      attachmentDataUrl: null,
      attachmentName: null,
      replyToMessageId: null,
      replyToRole: null,
      replyToText: null,
    };
  }

  const payloadRaw = rawContent.slice(MESSAGE_PREFIX.length);
  try {
    const payload = JSON.parse(payloadRaw) as SerializedChatMessage;
    const text = typeof payload?.text === "string" ? payload.text : "";
    const attachment =
      payload?.attachment?.kind === "image" &&
      typeof payload.attachment.dataUrl === "string" &&
      isValidImageDataUrl(payload.attachment.dataUrl)
        ? payload.attachment
        : null;
    const replyTo =
      typeof payload?.replyTo?.messageId === "string" &&
      (payload.replyTo.role === "user" || payload.replyTo.role === "assistant") &&
      typeof payload.replyTo.text === "string" &&
      payload.replyTo.text.trim()
        ? payload.replyTo
        : null;

    return {
      text,
      attachmentDataUrl: attachment?.dataUrl || null,
      attachmentName:
        typeof attachment?.name === "string" && attachment.name.trim() ? attachment.name : null,
      replyToMessageId: replyTo?.messageId || null,
      replyToRole: replyTo?.role || null,
      replyToText: replyTo?.text || null,
    };
  } catch {
    return {
      text: rawContent,
      attachmentDataUrl: null,
      attachmentName: null,
      replyToMessageId: null,
      replyToRole: null,
      replyToText: null,
    };
  }
}

export function getConversationMessagePreview(rawContent: string): string {
  const parsed = parseChatMessageContent(rawContent);
  if (parsed.text && parsed.attachmentDataUrl) return `${parsed.text} [image]`;
  if (parsed.text) return parsed.text;
  if (parsed.attachmentDataUrl) return parsed.attachmentName || "[image]";
  return "";
}
