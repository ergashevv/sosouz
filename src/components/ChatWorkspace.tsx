'use client';

import { DragEvent, FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Outfit } from 'next/font/google';
import {
  Loader2,
  MessageCircle,
  Plus,
  Send,
  Paperclip,
  X,
  Search,
  Menu,
  Sparkles,
} from 'lucide-react';
import HeaderAccountActions from '@/components/HeaderAccountActions';
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
    <div className="space-y-3 text-[13px] sm:text-sm leading-[1.65] text-neutral-800">
      {blocks.map((block, i) => (
        <p key={`b-${i}-${block.length}`} className="whitespace-pre-wrap">
          {block}
        </p>
      ))}
    </div>
  );
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, setLanguage, t } = useLanguage();
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
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const dragDepthRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [advisorContext, setAdvisorContext] = useState<ClientAdvisorContextPayload | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sending]);

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
    setError(null);
    try {
      await loadMessages(conversationId);
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load chat messages.');
    }
  };

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeConversationId || sending || (!input.trim() && !screenshotDataUrl)) return;

    const pendingContent = input.trim();
    const pendingScreenshotDataUrl = screenshotDataUrl;
    const pendingScreenshotName = screenshotName;

    const optimisticUserMessage: ChatMessage = {
      id: `tmp-${Date.now()}`,
      role: 'user',
      content: pendingContent,
      attachmentDataUrl: pendingScreenshotDataUrl,
      attachmentName: pendingScreenshotName,
      createdAt: new Date().toISOString(),
    };
    setInput('');
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
      setError(sendError instanceof Error ? sendError.message : 'Could not send message.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-neutral-500">
          <Loader2 size={18} className="animate-spin text-neutral-400" />
          {t('chat.loadingWorkspace')}
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#fafafa] flex flex-col">
      <nav className="sticky top-0 z-40 border-b border-neutral-200/80 bg-white/90 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => router.push('/')}
              className={`text-left text-3xl sm:text-4xl tracking-tight text-neutral-900 leading-none ${outfit.className}`}
            >
              soso.
            </button>
            <div className="flex items-center gap-2 sm:gap-3">
              <p className="hidden text-right text-[11px] text-neutral-500 sm:block">
                <span className="font-medium text-neutral-800">
                  {user.firstName} {user.lastName}
                </span>
              </p>
              <HeaderAccountActions />
              <button
                type="button"
                onClick={() => setHeaderMenuOpen((prev) => !prev)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-700 sm:hidden"
                aria-label={headerMenuOpen ? 'Close header menu' : 'Open header menu'}
              >
                {headerMenuOpen ? <X size={16} /> : <Menu size={16} />}
              </button>
            </div>
          </div>

          <div
            className={`${headerMenuOpen ? 'flex' : 'hidden'} flex-col gap-3 border-t border-neutral-100 pt-3 sm:flex sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:border-0 sm:pt-0`}
          >
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:gap-3 sm:pb-0">
              <Link
                href="/search"
                onClick={() => setHeaderMenuOpen(false)}
                className="shrink-0 rounded-lg px-2 py-1 text-[10px] sm:text-[11px] font-bold text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-black uppercase tracking-widest"
              >
                {t('nav.search')}
              </Link>
              <Link
                href="/about"
                onClick={() => setHeaderMenuOpen(false)}
                className="shrink-0 rounded-lg px-2 py-1 text-[10px] sm:text-[11px] font-bold text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-black uppercase tracking-widest"
              >
                {t('nav.about')}
              </Link>
              <Link
                href="/students"
                onClick={() => setHeaderMenuOpen(false)}
                className="shrink-0 rounded-lg px-2 py-1 text-[10px] sm:text-[11px] font-bold text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-black uppercase tracking-widest"
              >
                {t('nav.students')}
              </Link>
              <span className="shrink-0 rounded-lg bg-neutral-900 px-2.5 py-1 text-[10px] sm:text-[11px] font-black text-white uppercase tracking-widest">
                {t('chat.navActive')}
              </span>
            </div>

            <div className="flex items-center gap-1 border-t border-neutral-100 pt-2 sm:border-t-0 sm:border-l sm:border-neutral-200 sm:pl-4 sm:pt-0">
              <span className="pr-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                {t('chat.langShort')}
              </span>
              {(['en', 'ru', 'uz'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => {
                    setLanguage(lang);
                    setHeaderMenuOpen(false);
                  }}
                  className={`rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-wider transition-colors ${
                    language === lang
                      ? 'bg-neutral-900 text-white'
                      : 'text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <section className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="overflow-hidden rounded-3xl border border-neutral-200/90 bg-white shadow-sm">
            {sidebarOpen ? (
              <button
                type="button"
                aria-label="Close chats"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden fixed inset-0 z-20 bg-black/25 backdrop-blur-[1px]"
              />
            ) : null}

            <div className="grid min-h-[70vh] grid-cols-1 lg:grid-cols-[minmax(0,288px)_1fr]">
              <aside
                className={`fixed inset-y-0 left-0 z-30 flex w-[min(100%,20rem)] flex-col gap-4 border-neutral-200 bg-white p-4 shadow-xl transition-transform lg:static lg:w-auto lg:max-w-none lg:translate-x-0 lg:border-r lg:shadow-none ${
                  sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
              >
                <div className="flex items-center justify-between lg:hidden">
                  <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">{t('chat.sidebarTitle')}</p>
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-700"
                  >
                    <X size={16} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => void startNewChat()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 py-3 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-neutral-800"
                >
                  <Plus size={16} strokeWidth={2.5} />
                  {t('chat.newChat')}
                </button>

                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-0.5 lg:max-h-[calc(70vh-8rem)]">
                  {conversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => void openConversation(conversation.id)}
                      className={`w-full rounded-xl border px-3 py-3 text-left transition-all ${
                        activeConversationId === conversation.id
                          ? 'border-neutral-900 bg-neutral-50 shadow-sm'
                          : 'border-transparent bg-neutral-50/80 hover:border-neutral-200 hover:bg-white'
                      }`}
                    >
                      <p className="text-sm font-semibold leading-snug text-neutral-900 line-clamp-2">
                        {conversation.title}
                      </p>
                      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-neutral-500">
                        {conversation.lastMessage || t('chat.noMessagesYet')}
                      </p>
                    </button>
                  ))}
                </div>
              </aside>

              <section className="flex min-h-[70vh] flex-col bg-[#fafafa]/50">
                <div className="border-b border-neutral-100 bg-white px-4 py-4 sm:px-5 sm:py-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => setSidebarOpen(true)}
                        className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 lg:hidden"
                        aria-label="Open chats"
                      >
                        <MessageCircle size={18} />
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-white">
                            <Sparkles size={18} strokeWidth={2} />
                          </div>
                          <div>
                            <h1 className="text-lg font-bold tracking-tight text-neutral-900 sm:text-xl">
                              AI advisor
                            </h1>
                            <p className="text-xs text-neutral-500 sm:text-[13px]">
                              Universities, admissions, and next steps
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
                      {advisorContext ? (
                        <div className="flex flex-col justify-center rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 sm:max-w-xs">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                            {t('chat.focus')}
                          </span>
                          <p className="mt-0.5 text-sm font-medium text-neutral-900 line-clamp-2">
                            {advisorContext.name}
                            {typeof advisorContext.nationalRank === 'number' ? (
                              <span className="font-normal text-neutral-500"> · #{advisorContext.nationalRank}</span>
                            ) : null}
                          </p>
                        </div>
                      ) : null}
                      <label className="flex flex-col gap-1 sm:min-w-[220px]">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                          {t('chat.regionLabel')}
                        </span>
                        <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 shadow-sm">
                          <Search size={16} className="shrink-0 text-neutral-400" />
                          <input
                            value={country}
                            onChange={(event) => setCountry(event.target.value)}
                            className="min-w-0 flex-1 bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
                            placeholder={t('chat.regionPlaceholder')}
                            aria-label={t('chat.regionLabel')}
                          />
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
                    {messages.length === 0 ? (
                      <div className="flex h-full min-h-[12rem] flex-col items-center justify-center px-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-neutral-200 bg-white shadow-sm">
                          <MessageCircle className="text-neutral-400" size={26} strokeWidth={1.5} />
                        </div>
                        <p className="mt-4 max-w-sm text-center text-sm leading-relaxed text-neutral-500">
                          {t('chat.emptyHint')}
                        </p>
                      </div>
                    ) : null}

                    {messages.map((message) =>
                      message.role === 'assistant' ? (
                        <div key={message.id} className="flex gap-3">
                          <div
                            className="mt-1 hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 sm:flex"
                            aria-hidden
                          >
                            <Sparkles size={15} />
                          </div>
                          <div className="min-w-0 max-w-[min(100%,42rem)] rounded-2xl rounded-tl-md border border-neutral-200/80 bg-white px-4 py-3 shadow-sm">
                            {message.content ? <AssistantMessageBody content={message.content} /> : null}
                            {message.attachmentDataUrl ? (
                              <div className="mt-3 space-y-1 border-t border-neutral-100 pt-3">
                                {message.attachmentName ? (
                                  <p className="text-[10px] text-neutral-500">{message.attachmentName}</p>
                                ) : null}
                                <Image
                                  src={message.attachmentDataUrl}
                                  alt={message.attachmentName || 'Attached image'}
                                  width={640}
                                  height={360}
                                  unoptimized
                                  className="max-h-52 w-full rounded-lg border border-neutral-200 bg-neutral-50 object-contain"
                                />
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ) : (
                        <div key={message.id} className="flex justify-end">
                          <div className="max-w-[min(100%,36rem)] space-y-2 rounded-2xl rounded-tr-md bg-neutral-900 px-4 py-3 text-[13px] sm:text-sm leading-relaxed text-white shadow-md">
                            {message.content ? (
                              <p className="whitespace-pre-wrap">{message.content}</p>
                            ) : null}
                            {message.attachmentDataUrl ? (
                              <div className="space-y-1">
                                {message.attachmentName ? (
                                  <p className="text-[10px] text-neutral-400">{message.attachmentName}</p>
                                ) : null}
                                <Image
                                  src={message.attachmentDataUrl}
                                  alt={message.attachmentName || 'Attached image'}
                                  width={640}
                                  height={360}
                                  unoptimized
                                  className="max-h-52 w-full rounded-lg border border-white/10 bg-black/30 object-contain"
                                />
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ),
                    )}

                    {sending ? (
                      <div className="flex gap-3">
                        <div
                          className="mt-1 hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white sm:flex"
                          aria-hidden
                        >
                          <Sparkles size={15} className="text-neutral-400" />
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-600 shadow-sm">
                          <Loader2 size={15} className="animate-spin text-neutral-400" />
                          {t('chat.thinking')}
                        </div>
                      </div>
                    ) : null}
                    <div ref={messagesEndRef} className="h-1 w-full shrink-0" aria-hidden />
                  </div>

                  <div className="border-t border-neutral-200 bg-white p-4 sm:p-5">
                    {screenshotDataUrl ? (
                      <div className="mb-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
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
                          className="mt-2 max-h-44 w-full rounded-lg border border-neutral-200 object-contain"
                        />
                      </div>
                    ) : null}

                    <form
                      onSubmit={sendMessage}
                      onDragEnter={handleDragEnter}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className="relative"
                    >
                      <div
                        className={`flex items-end gap-2 rounded-2xl border-2 bg-white p-2 transition-colors sm:p-3 ${
                          isDragActive ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200'
                        }`}
                      >
                        <textarea
                          value={input}
                          onChange={(event) => setInput(event.target.value)}
                          rows={2}
                          placeholder={t('chat.messagePlaceholder')}
                          className="max-h-40 min-h-[2.75rem] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none sm:text-[15px]"
                        />
                        <div className="flex shrink-0 flex-col gap-2 pb-0.5">
                          <label className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 transition-colors hover:bg-neutral-100">
                            <Paperclip size={18} className="text-neutral-500" />
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
                          <button
                            type="submit"
                            disabled={(!input.trim() && !screenshotDataUrl) || sending}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-white transition-colors hover:bg-neutral-800 disabled:opacity-40"
                            aria-label="Send message"
                          >
                            <Send size={18} />
                          </button>
                        </div>
                      </div>
                      {isDragActive ? (
                        <p className="mt-2 text-center text-[11px] text-neutral-500">{t('chat.dropImage')}</p>
                      ) : null}
                    </form>

                    {error ? (
                      <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
                    ) : null}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-10 sm:py-12 px-4 sm:px-6 border-t border-black/10 bg-white flex flex-col justify-center">
        <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8">
          <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] sm:tracking-[0.4em] text-center md:text-left flex-1">
            {t('footer.copyright')}
          </div>
          <div className="flex flex-1 justify-center items-center gap-6 sm:gap-8 flex-wrap">
            <Link href="/about" className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] hover:text-black">
              {t('nav.about')}
            </Link>
            <Link href="/terms" className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] hover:text-black">
              {t('nav.terms')}
            </Link>
          </div>
          <div className="flex flex-1 justify-center md:justify-end items-center gap-2 text-black font-bold text-[10px] uppercase tracking-widest">
            {t('footer.status')}
          </div>
        </div>
      </footer>
    </main>
  );
}
