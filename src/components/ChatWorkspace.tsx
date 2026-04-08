'use client';

import { DragEvent, FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Outfit } from 'next/font/google';
import { Loader2, Plus, Send, Paperclip, X, Search, Menu, Trash2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { authFetch } from '@/lib/client-auth';

interface ChatWorkspaceProps {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    phoneCountry: string;
  };
}

/** Mirrors server `AdvisorContext` fields we send from rankings deep links. */
type ClientAdvisorContextPayload = {
  name: string;
  country?: string;
  officialWebsite?: string | null;
  nationalRank?: number;
  worldRank?: number;
  rankingSourceUrl?: string | null;
  domain?: string;
};

interface ConversationItem {
  id: string;
  title: string;
  updatedAt: string;
  lastMessage: string | null;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachmentDataUrl?: string | null;
  attachmentName?: string | null;
  replyToMessageId?: string | null;
  replyToRole?: 'user' | 'assistant' | null;
  replyToText?: string | null;
  createdAt: string;
}

const outfit = Outfit({ subsets: ['latin'], weight: ['800'] });

function normalizeAssistantText(content: string): string {
  return content
    .replace(/\r\n/g, '\n')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '• ')
    .replace(/\*\*/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function AssistantMessageBody({ content }: { content: string }) {
  const text = normalizeAssistantText(content);
  const blocks = text.split(/\n\n+/).filter(Boolean);
  return (
    <div className="space-y-4 text-[15px] sm:text-[0.9375rem] leading-[1.7] text-neutral-800/95">
      {blocks.map((block, i) => (
        <p key={`b-${i}-${block.length}`} className="whitespace-pre-wrap">
          {block}
        </p>
      ))}
    </div>
  );
}

function formatConversationTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Invalid image.'));
    };
    reader.onerror = () => reject(new Error('Failed to read screenshot.'));
    reader.readAsDataURL(file);
  });
}

/** Supports single- or double-encoded query values (e.g. %257B…). */
function parseAdvisorContextParam(raw: string | null): ClientAdvisorContextPayload | null {
  if (!raw?.trim()) return null;
  let candidate = raw.trim();
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      const data = JSON.parse(candidate) as unknown;
      if (!data || typeof data !== 'object') return null;
      const o = data as Record<string, unknown>;
      const name = typeof o.name === 'string' ? o.name.trim() : '';
      if (!name) return null;
      const country = typeof o.country === 'string' ? o.country.trim() : undefined;
      const officialWebsite =
        o.officialWebsite === null
          ? null
          : typeof o.officialWebsite === 'string'
            ? o.officialWebsite.trim() || null
            : undefined;
      const nationalRank =
        typeof o.nationalRank === 'number' && Number.isFinite(o.nationalRank)
          ? Math.trunc(o.nationalRank)
          : undefined;
      const worldRank =
        typeof o.worldRank === 'number' && Number.isFinite(o.worldRank)
          ? Math.trunc(o.worldRank)
          : undefined;
      const rankingSourceUrl =
        o.rankingSourceUrl === null
          ? null
          : typeof o.rankingSourceUrl === 'string'
            ? o.rankingSourceUrl.trim() || null
            : undefined;
      const domain = typeof o.domain === 'string' ? o.domain.trim() : undefined;
      return {
        name,
        country,
        officialWebsite: officialWebsite ?? undefined,
        nationalRank,
        worldRank,
        rankingSourceUrl: rankingSourceUrl ?? undefined,
        domain,
      };
    } catch {
      try {
        const decoded = decodeURIComponent(candidate.replace(/\+/g, ' '));
        if (decoded === candidate) return null;
        candidate = decoded;
      } catch {
        return null;
      }
    }
  }
  return null;
}

export default function ChatWorkspace({ user }: ChatWorkspaceProps) {
  void user;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, t } = useLanguage();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [country, setCountry] = useState('United Kingdom');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [conversationQuery, setConversationQuery] = useState('');
  const [replyTarget, setReplyTarget] = useState<ChatMessage | null>(null);
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const dragDepthRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [advisorContext, setAdvisorContext] = useState<ClientAdvisorContextPayload | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sending]);

  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    syncFullscreen();
    document.addEventListener('fullscreenchange', syncFullscreen);
    return () => document.removeEventListener('fullscreenchange', syncFullscreen);
  }, []);

  const filteredConversations = conversations.filter((conversation) => {
    const q = conversationQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      conversation.title.toLowerCase().includes(q) ||
      (conversation.lastMessage || '').toLowerCase().includes(q)
    );
  });

  const handleMediaFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Only image files are supported for media upload.');
      return;
    }
    void fileToDataUrl(file)
      .then((dataUrl) => {
        setScreenshotDataUrl(dataUrl);
        setScreenshotName(file.name);
        setError(null);
      })
      .catch(() => {
        setError('Failed to read selected image.');
      });
  }, []);

  const handleDragEnter = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current += 1;
    setIsDragActive(true);
  };

  const handleDragOver = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragLeave = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDragActive(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current = 0;
    setIsDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    handleMediaFile(file);
  };

  const refreshConversations = useCallback(async () => {
    const response = await authFetch('/api/chat/conversations');
    if (!response.ok) throw new Error('Failed to load conversations.');
    const payload = (await response.json()) as { conversations: ConversationItem[] };
    setConversations(payload.conversations || []);
    return payload.conversations || [];
  }, []);

  const loadMessages = useCallback(async (conversationId: string) => {
    const response = await authFetch(`/api/chat/messages?conversationId=${conversationId}`);
    if (!response.ok) throw new Error('Failed to load messages.');
    const payload = (await response.json()) as { messages: ChatMessage[] };
    setMessages(payload.messages || []);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      setLoading(true);
      setError(null);
      try {
        const deepRaw = searchParams.get('advisorContext');
        const deepParsed = parseAdvisorContextParam(deepRaw);
        const list = await refreshConversations();
        if (cancelled) return;

        if (deepParsed) {
          setAdvisorContext(deepParsed);
          if (deepParsed.country) setCountry(deepParsed.country);

          const create = await authFetch('/api/chat/conversations', { method: 'POST' });
          if (!create.ok) throw new Error('Failed to create a conversation.');
          const createdPayload = (await create.json()) as { conversation: ConversationItem };
          const createdConversation = createdPayload.conversation;
          if (cancelled) return;

          setConversations((prev) => {
            const rest = prev.filter((c) => c.id !== createdConversation.id);
            return [createdConversation, ...rest];
          });
          setActiveConversationId(createdConversation.id);
          setMessages([]);

          router.replace('/chat', { scroll: false });
          return;
        }

        if (list.length === 0) {
          const create = await authFetch('/api/chat/conversations', { method: 'POST' });
          if (!create.ok) throw new Error('Failed to create a conversation.');
          const createdPayload = (await create.json()) as { conversation: ConversationItem };
          const createdConversation = createdPayload.conversation;
          if (cancelled) return;
          setConversations([createdConversation]);
          setActiveConversationId(createdConversation.id);
          setMessages([]);
        } else {
          setActiveConversationId(list[0].id);
          await loadMessages(list[0].id);
        }
      } catch (initError: unknown) {
        if (!cancelled) {
          setError(initError instanceof Error ? initError.message : 'Failed to initialize chat.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void initialize();
    return () => {
      cancelled = true;
    };
  }, [searchParams, loadMessages, refreshConversations, router]);

  const startNewChat = async () => {
    setError(null);
    setAdvisorContext(null);
    setReplyTarget(null);
    try {
      const response = await authFetch('/api/chat/conversations', { method: 'POST' });
      if (!response.ok) throw new Error('Could not create a new chat.');
      const payload = (await response.json()) as { conversation: ConversationItem };
      const createdConversation = payload.conversation;
      setConversations((prev) => [createdConversation, ...prev]);
      setActiveConversationId(createdConversation.id);
      setMessages([]);
      if (searchParams.get('advisorContext')) {
        router.replace('/chat', { scroll: false });
      }
    } catch (createError: unknown) {
      setError(createError instanceof Error ? createError.message : 'New chat failed.');
    }
  };

  const openConversation = async (conversationId: string) => {
    setActiveConversationId(conversationId);
    setSidebarOpen(false);
    setReplyTarget(null);
    setError(null);
    try {
      await loadMessages(conversationId);
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load chat messages.');
    }
  };

  const deleteConversation = async (conversationId: string) => {
    if (deletingConversationId) return;
    const targetConversation = conversations.find((conversation) => conversation.id === conversationId);
    const confirmed = window.confirm(`Delete "${targetConversation?.title || 'this chat'}"?`);
    if (!confirmed) return;

    setError(null);
    setReplyTarget(null);
    setDeletingConversationId(conversationId);
    try {
      const response = await authFetch('/api/chat/conversations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(typeof payload.error === 'string' ? payload.error : 'Could not delete chat.');
      }

      const remainingConversations = conversations.filter((conversation) => conversation.id !== conversationId);
      setConversations(remainingConversations);

      if (activeConversationId !== conversationId) return;

      if (remainingConversations.length > 0) {
        const nextConversationId = remainingConversations[0].id;
        setActiveConversationId(nextConversationId);
        await loadMessages(nextConversationId);
        return;
      }

      const createResponse = await authFetch('/api/chat/conversations', { method: 'POST' });
      if (!createResponse.ok) throw new Error('Could not create a replacement chat.');
      const createPayload = (await createResponse.json()) as { conversation: ConversationItem };
      const createdConversation = createPayload.conversation;
      setConversations([createdConversation]);
      setActiveConversationId(createdConversation.id);
      setMessages([]);
    } catch (deleteError: unknown) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete chat.');
    } finally {
      setDeletingConversationId(null);
    }
  };

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeConversationId || sending || (!input.trim() && !screenshotDataUrl)) return;

    const pendingContent = input.trim();
    const pendingScreenshotDataUrl = screenshotDataUrl;
    const pendingScreenshotName = screenshotName;
    const pendingReplyTarget = replyTarget;

    const optimisticUserMessage: ChatMessage = {
      id: `tmp-${Date.now()}`,
      role: 'user',
      content: pendingContent,
      attachmentDataUrl: pendingScreenshotDataUrl,
      attachmentName: pendingScreenshotName,
      replyToMessageId: pendingReplyTarget?.id || null,
      replyToRole: pendingReplyTarget?.role || null,
      replyToText: pendingReplyTarget?.content || null,
      createdAt: new Date().toISOString(),
    };
    setInput('');
    setReplyTarget(null);
    setMessages((prev) => [...prev, optimisticUserMessage]);
    setSending(true);
    setError(null);

    try {
      const response = await authFetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConversationId,
          content: pendingContent,
          recommendationCountry: country,
          language,
          screenshotDataUrl: pendingScreenshotDataUrl,
          screenshotName: pendingScreenshotName,
          advisorContext: advisorContext ?? undefined,
          replyToMessageId: pendingReplyTarget?.id || undefined,
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        userMessage?: ChatMessage;
        message?: ChatMessage;
      };
      if (!response.ok) {
        throw new Error(typeof payload.error === 'string' ? payload.error : 'Message failed.');
      }

      if (!payload.userMessage || !payload.message) {
        throw new Error('Unexpected response from server.');
      }
      const savedUserMessage = payload.userMessage;
      const assistantMessage = payload.message;
      setMessages((prev) =>
        [...prev, assistantMessage].map((message) =>
          message.id === optimisticUserMessage.id ? savedUserMessage : message,
        ),
      );
      setScreenshotDataUrl(null);
      setScreenshotName(null);
      await refreshConversations();
    } catch (sendError: unknown) {
      setMessages((prev) => prev.filter((message) => message.id !== optimisticUserMessage.id));
      setInput(pendingContent);
      setReplyTarget(pendingReplyTarget || null);
      setError(sendError instanceof Error ? sendError.message : 'Could not send message.');
    } finally {
      setSending(false);
    }
  };

  const handleComposerKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter') return;
    if (event.shiftKey) return;
    event.preventDefault();
    if (!activeConversationId || sending || (!input.trim() && !screenshotDataUrl)) return;
    event.currentTarget.form?.requestSubmit();
  };

  const handleExitPage = () => {
    if (window.history.length > 1) router.back();
    else router.push('/');
  };

  const handleMinimizeChat = () => {
    setSidebarOpen(false);
    setReplyTarget(null);
    const activeElement = document.activeElement as HTMLElement | null;
    activeElement?.blur();
  };

  const handleToggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      setError('Could not toggle fullscreen mode on this browser.');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#e9edf2]">
        <div className="flex items-center gap-3 text-sm text-neutral-500">
          <Loader2 size={18} className="animate-spin text-neutral-500" />
          {t('chat.loadingWorkspace')}
        </div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#e9edf2] text-neutral-900 antialiased">
      <div className="px-3 pt-3 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between rounded-2xl border border-black/10 bg-white/85 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExitPage}
              className="h-4 w-4 rounded-full bg-[#ff5f57] transition hover:brightness-95"
              aria-label="Exit chat"
              title="Exit"
            />
            <button
              type="button"
              onClick={handleMinimizeChat}
              className="h-4 w-4 rounded-full bg-[#febc2e] transition hover:brightness-95"
              aria-label="Minimize chat"
              title="Minimize"
            />
            <button
              type="button"
              onClick={() => void handleToggleFullscreen()}
              className="h-4 w-4 rounded-full bg-[#28c840] transition hover:brightness-95"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            />
          </div>
          <p className="text-xs font-semibold tracking-wide text-neutral-500">soso.ai</p>
          <div className="w-[56px]" />
        </div>
      </div>

      <section className="flex-1 bg-[#e9edf2] px-0 py-2 sm:px-6 sm:py-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <div className="flex min-h-[calc(100dvh-7.25rem)] overflow-hidden rounded-none border-y border-black/8 bg-[#f7f8fa] shadow-none sm:min-h-[80vh] sm:rounded-[24px] sm:border sm:shadow-[0_28px_60px_-34px_rgba(15,23,42,0.45)] lg:h-[calc(100dvh-9rem)] lg:min-h-0 lg:flex-row">
            {sidebarOpen ? (
              <button
                type="button"
                aria-label="Close chats"
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 z-20 bg-neutral-900/20 backdrop-blur-[2px] lg:hidden"
              />
            ) : null}

            <aside
              className={`fixed inset-y-0 left-0 z-30 flex w-[min(100%,19.5rem)] flex-col gap-4 bg-[#f2f4f7] p-4 shadow-2xl transition-transform duration-200 ease-out lg:static lg:w-72 lg:max-w-none lg:translate-x-0 lg:border-r lg:border-black/10 lg:shadow-none ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`}
            >
              <div className="flex items-center justify-between lg:pt-1">
                <p className={`text-[11px] font-extrabold uppercase tracking-[0.2em] text-neutral-500 ${outfit.className}`}>
                  {t('chat.threadsLabel')}
                </p>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center text-neutral-600 transition-colors hover:text-neutral-900 lg:hidden"
                  aria-label="Close chats"
                >
                  <X size={18} strokeWidth={1.5} />
                </button>
              </div>

              <button
                type="button"
                onClick={() => void startNewChat()}
                className="group flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-500/50 bg-transparent py-3.5 text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-700 transition-all hover:border-neutral-900 hover:bg-[#e9edf2] hover:text-neutral-900"
              >
                <Plus size={15} strokeWidth={2} />
                {t('chat.newChat')}
              </button>

              <label className="block">
                <span className="sr-only">Search chats</span>
                <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-white/70 px-3 py-2.5">
                  <Search size={15} className="text-neutral-400" />
                  <input
                    value={conversationQuery}
                    onChange={(event) => setConversationQuery(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
                    placeholder="Search chats..."
                    aria-label="Search chats"
                  />
                </div>
              </label>

              <div className="min-h-0 flex-1 space-y-1 overflow-y-auto lg:max-h-none">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`w-full rounded-2xl border px-3 py-3 text-left transition-colors ${
                      activeConversationId === conversation.id
                        ? 'border-black/10 bg-white shadow-[0_1px_0_rgba(0,0,0,0.03)]'
                        : 'border-transparent hover:border-black/8 hover:bg-white/80'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => void openConversation(conversation.id)}
                        className="flex min-w-0 flex-1 items-start gap-2 text-left"
                      >
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#d7ddea] text-[11px] font-bold uppercase text-[#3f4d63]">
                          {conversation.title.trim().charAt(0) || 'C'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="line-clamp-1 text-sm font-semibold leading-snug text-neutral-900">
                              {conversation.title}
                            </p>
                            <span className="shrink-0 text-[10px] text-neutral-400">
                              {formatConversationTime(conversation.updatedAt)}
                            </span>
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-500">
                            {conversation.lastMessage || t('chat.noMessagesYet')}
                          </p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteConversation(conversation.id)}
                        disabled={Boolean(deletingConversationId)}
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        aria-label="Delete chat"
                        title="Delete chat"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {filteredConversations.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-neutral-300 px-3 py-4 text-xs text-neutral-500">
                    No chats found.
                  </p>
                ) : null}
              </div>
            </aside>

              <section className="flex min-h-[72vh] flex-1 flex-col bg-[#f7f8fa]">
                <header className="border-b border-black/6 bg-white/90 px-4 py-3 backdrop-blur-sm sm:px-6">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setSidebarOpen(true)}
                        className="inline-flex shrink-0 items-center justify-center text-neutral-600 transition-colors hover:text-neutral-900 lg:hidden"
                        aria-label="Open chats"
                      >
                        <Menu size={22} strokeWidth={1.5} />
                      </button>
                      <div className="min-w-0 flex-1">
                        <h1 className={`text-xl font-extrabold leading-none tracking-tight text-neutral-900 ${outfit.className}`}>
                          soso. ai
                        </h1>
                      </div>
                    </div>
                  </div>
                </header>

                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="flex-1 space-y-5 overflow-y-auto bg-[#f7f8fa] px-4 py-5 sm:px-8 sm:py-8">
                    {messages.length === 0 ? (
                      <div className="flex h-full min-h-56 flex-col items-start justify-center px-0 sm:px-2">
                        <p
                          className={`text-[11px] font-extrabold uppercase tracking-[0.2em] text-neutral-400 ${outfit.className}`}
                        >
                          soso.
                        </p>
                        <p className="mt-4 max-w-md text-sm leading-[1.7] text-neutral-600">{t('chat.emptyHint')}</p>
                      </div>
                    ) : null}

                    {messages.map((message) =>
                      message.role === 'assistant' ? (
                        <article key={message.id} className="max-w-[min(100%,40rem)]">
                          <div className="rounded-[20px] rounded-bl-md border border-black/8 bg-white px-4 py-3 text-[15px] leading-[1.65] text-neutral-900 shadow-[0_2px_8px_rgba(15,23,42,0.05)] sm:px-5">
                            {message.replyToText ? (
                              <div className="mb-2 rounded-lg border border-black/8 bg-[#f4f6f9] px-3 py-2 text-xs text-neutral-600">
                                <p className="font-semibold">
                                  Reply to {message.replyToRole === 'assistant' ? 'soso. ai' : t('chat.youLabel')}
                                </p>
                                <p className="line-clamp-2">{message.replyToText}</p>
                              </div>
                            ) : null}
                            {message.content ? <AssistantMessageBody content={message.content} /> : null}
                            {message.attachmentDataUrl ? (
                              <div className="mt-4 space-y-1 border-t border-black/6 pt-4">
                                {message.attachmentName ? (
                                  <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                                    {message.attachmentName}
                                  </p>
                                ) : null}
                                <Image
                                  src={message.attachmentDataUrl}
                                  alt={message.attachmentName || 'Attached image'}
                                  width={640}
                                  height={360}
                                  unoptimized
                                  className="max-h-52 w-full rounded-xl border border-black/8 bg-[#f8fafc] object-contain"
                                />
                              </div>
                            ) : null}
                            <div className="mt-2">
                              <button
                                type="button"
                                onClick={() => setReplyTarget(message)}
                                className="text-xs font-medium text-neutral-500 hover:text-neutral-800"
                              >
                                Reply
                              </button>
                            </div>
                          </div>
                        </article>
                      ) : (
                        <div key={message.id} className="flex justify-end">
                          <div className="max-w-[min(100%,34rem)] rounded-[20px] rounded-br-md bg-[#0a84ff] px-4 py-3 text-[15px] leading-[1.65] text-white shadow-[0_8px_20px_-12px_rgba(10,132,255,0.9)] sm:px-5">
                            {message.replyToText ? (
                              <div className="mb-2 rounded-lg border border-white/30 bg-white/18 px-3 py-2 text-xs text-blue-50">
                                <p className="font-semibold">
                                  Reply to {message.replyToRole === 'assistant' ? 'soso. ai' : t('chat.youLabel')}
                                </p>
                                <p className="line-clamp-2">{message.replyToText}</p>
                              </div>
                            ) : null}
                            {message.content ? (
                              <p className="whitespace-pre-wrap">{message.content}</p>
                            ) : null}
                            {message.attachmentDataUrl ? (
                              <div className="mt-3 space-y-1">
                                {message.attachmentName ? (
                                  <p className="text-[11px] text-blue-100">{message.attachmentName}</p>
                                ) : null}
                                <Image
                                  src={message.attachmentDataUrl}
                                  alt={message.attachmentName || 'Attached image'}
                                  width={640}
                                  height={360}
                                  unoptimized
                                  className="max-h-52 w-full rounded-xl border border-white/35 bg-white/90 object-contain"
                                />
                              </div>
                            ) : null}
                            <div className="mt-2 flex justify-end">
                              <button
                                type="button"
                                onClick={() => setReplyTarget(message)}
                                className="text-xs font-medium text-blue-100 hover:text-white"
                              >
                                Reply
                              </button>
                            </div>
                          </div>
                        </div>
                      ),
                    )}

                    {sending ? (
                      <div className="max-w-[min(100%,40rem)] rounded-[20px] rounded-bl-md border border-black/8 bg-white px-4 py-3 text-neutral-600 shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
                        <div className="flex items-center gap-2 text-sm">
                          <Loader2 size={16} className="animate-spin text-neutral-400" />
                          {t('chat.thinking')}
                        </div>
                      </div>
                    ) : null}
                    <div ref={messagesEndRef} className="h-1 w-full shrink-0" aria-hidden />
                  </div>

                  <div className="sticky bottom-0 z-10 border-t border-black/6 bg-white/92 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:px-8 sm:py-4">
                    {replyTarget ? (
                      <div className="mb-3 rounded-xl border border-black/10 bg-[#f7f8fa] px-3 py-2.5">
                        <div className="flex items-start justify-between gap-3 text-xs">
                          <div className="min-w-0">
                            <p className="font-semibold text-neutral-700">
                              Replying to {replyTarget.role === 'assistant' ? 'soso. ai' : t('chat.youLabel')}
                            </p>
                            <p className="line-clamp-2 text-neutral-500">
                              {replyTarget.content || replyTarget.attachmentName || '[image]'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setReplyTarget(null)}
                            className="shrink-0 text-neutral-500 hover:text-neutral-800"
                            aria-label="Cancel reply"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ) : null}
                    {screenshotDataUrl ? (
                      <div className="mb-4 rounded-2xl border border-black/10 bg-[#f7f8fa] p-3 sm:p-4">
                        <div className="flex items-center justify-between text-xs text-neutral-500">
                          <span className="truncate pr-2 font-medium">{screenshotName || 'screenshot'}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setScreenshotDataUrl(null);
                              setScreenshotName(null);
                            }}
                            className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-neutral-600 hover:bg-white hover:text-neutral-900"
                          >
                            <X size={12} />
                            {t('chat.remove')}
                          </button>
                        </div>
                        <Image
                          src={screenshotDataUrl}
                          alt="Screenshot preview"
                          width={640}
                          height={360}
                          unoptimized
                          className="mt-2 max-h-44 w-full rounded-xl border border-neutral-200 bg-white object-contain"
                        />
                      </div>
                    ) : null}

                    <form
                      onSubmit={sendMessage}
                      onDragEnter={handleDragEnter}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className="relative mx-auto max-w-4xl"
                    >
                      <div
                        className={`flex items-end gap-2 rounded-[22px] border bg-[#f3f4f6] px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition-colors sm:gap-3 sm:px-3 ${
                          isDragActive ? 'border-[#0a84ff]' : 'border-black/10'
                        }`}
                      >
                        <label className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-white hover:text-neutral-900 sm:h-11 sm:w-11">
                          <Paperclip size={20} strokeWidth={1.5} />
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            className="hidden"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (!file) return;
                              handleMediaFile(file);
                              event.currentTarget.value = '';
                            }}
                          />
                        </label>
                        <textarea
                          value={input}
                          onChange={(event) => setInput(event.target.value)}
                          onKeyDown={handleComposerKeyDown}
                          rows={2}
                          placeholder={t('chat.messagePlaceholder')}
                          className="max-h-40 min-h-10 flex-1 resize-none bg-transparent py-2 text-[15px] text-neutral-900 placeholder:text-neutral-400 outline-none focus:ring-0"
                        />
                        <button
                          type="submit"
                          disabled={(!input.trim() && !screenshotDataUrl) || sending}
                          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all disabled:opacity-35 sm:h-11 sm:w-11 ${
                            !input.trim() && !screenshotDataUrl
                              ? 'border-neutral-300 bg-white text-neutral-300'
                              : 'border-[#0a84ff] bg-[#0a84ff] text-white hover:bg-[#0077ed]'
                          }`}
                          aria-label="Send message"
                        >
                          <Send size={18} strokeWidth={1.75} />
                        </button>
                      </div>
                      {isDragActive ? (
                        <p className="mt-3 text-center text-[11px] text-neutral-500">{t('chat.dropImage')}</p>
                      ) : null}
                    </form>

                    {error ? (
                      <p className="mt-4 border border-red-200/80 bg-red-50/80 px-3 py-2 text-xs text-red-800">
                        {error}
                      </p>
                    ) : null}
                  </div>
                </div>
              </section>
            </div>
          </div>
      </section>

    </main>
  );
}
