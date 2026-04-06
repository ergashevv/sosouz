interface SerializedChatAttachment {
  kind: "image";
  dataUrl: string;
  name: string | null;
}

interface SerializedChatMessage {
  text: string;
  attachment: SerializedChatAttachment;
}

export interface ParsedChatMessageContent {
  text: string;
  attachmentDataUrl: string | null;
  attachmentName: string | null;
}

const MESSAGE_PREFIX = "__SOSO_CHAT_MEDIA_V1__";

function isValidImageDataUrl(value: string): boolean {
  return /^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+$/.test(value);
}

export function serializeChatMessageContent(args: {
  text: string;
  attachmentDataUrl?: string | null;
  attachmentName?: string | null;
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

  if (!attachmentDataUrl) {
    return text;
  }

  const payload: SerializedChatMessage = {
    text,
    attachment: {
      kind: "image",
      dataUrl: attachmentDataUrl,
      name: attachmentName,
    },
  };
  return `${MESSAGE_PREFIX}${JSON.stringify(payload)}`;
}

export function parseChatMessageContent(rawContent: string): ParsedChatMessageContent {
  if (!rawContent.startsWith(MESSAGE_PREFIX)) {
    return {
      text: rawContent,
      attachmentDataUrl: null,
      attachmentName: null,
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

    return {
      text,
      attachmentDataUrl: attachment?.dataUrl || null,
      attachmentName:
        typeof attachment?.name === "string" && attachment.name.trim() ? attachment.name : null,
    };
  } catch {
    return {
      text: rawContent,
      attachmentDataUrl: null,
      attachmentName: null,
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
