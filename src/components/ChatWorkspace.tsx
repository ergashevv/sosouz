'use client';

import { DragEvent, FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Outfit } from 'next/font/google';
import { Loader2, MessageCircle, Plus, Send, Paperclip, X, Search, Menu } from 'lucide-react';
import HeaderAccountActions from '@/components/HeaderAccountActions';
import { useLanguage } from '@/contexts/LanguageContext';
import { authFetch } from '@/lib/client-auth';
import ContactMailtoLink from '@/components/ContactMailtoLink';

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
    <div className="space-y-4 text-[15px] sm:text-[0.9375rem] leading-[1.7] text-neutral-800/95">
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
  /** When false and focus-university had a country, we show a compact summary instead of the full field. */
  const [countryPickerOpen, setCountryPickerOpen] = useState(true);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sending]);

  useEffect(() => {
    if (advisorContext?.country) {
      setCountryPickerOpen(false);
    }
  }, [advisorContext?.country]);

  useEffect(() => {
    if (!advisorContext) {
      setCountryPickerOpen(true);
    }
  }, [advisorContext]);

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
    setCountryPickerOpen(true);
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
      <div className="flex min-h-screen items-center justify-center bg-[#f5f4f0]">
        <div className="flex items-center gap-3 text-sm text-neutral-500">
          <Loader2 size={18} className="animate-spin text-neutral-500" />
          {t('chat.loadingWorkspace')}
        </div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#f5f4f0] text-neutral-900 antialiased">
      <nav className="sticky top-0 z-40 border-b border-black/[0.06] bg-[#f5f4f0]/92 px-4 py-3 backdrop-blur-md sm:px-6 lg:px-8 sm:py-4">
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
              <span className="shrink-0 border border-neutral-900 bg-neutral-900 px-2.5 py-1 text-[10px] sm:text-[11px] font-black text-white uppercase tracking-[0.18em]">
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

      <section className="flex-1 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex min-h-[72vh] flex-col overflow-hidden lg:flex-row lg:ring-1 lg:ring-neutral-900/10 lg:shadow-[0_2px_28px_-6px_rgba(0,0,0,0.07)]">
            {sidebarOpen ? (
              <button
                type="button"
                aria-label="Close chats"
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 z-20 bg-neutral-900/20 backdrop-blur-[2px] lg:hidden"
              />
            ) : null}

            <aside
              className={`fixed inset-y-0 left-0 z-30 flex w-[min(100%,19.5rem)] flex-col gap-5 bg-[#eae8e3] p-4 shadow-2xl transition-transform duration-200 ease-out lg:static lg:w-[17.5rem] lg:max-w-none lg:translate-x-0 lg:shadow-none ${
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
                className="group flex w-full items-center justify-center gap-2 border border-dashed border-neutral-500/50 bg-transparent py-3.5 text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-700 transition-all hover:border-neutral-900 hover:bg-[#f5f4f0] hover:text-neutral-900"
              >
                <Plus size={15} strokeWidth={2} />
                {t('chat.newChat')}
              </button>

              <div className="min-h-0 flex-1 space-y-0 overflow-y-auto lg:max-h-[calc(72vh-10rem)]">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => void openConversation(conversation.id)}
                    className={`w-full border-l-2 py-3.5 pl-4 pr-2 text-left transition-colors ${
                      activeConversationId === conversation.id
                        ? 'border-neutral-900 bg-white/50'
                        : 'border-transparent hover:border-neutral-400/80 hover:bg-white/25'
                    }`}
                  >
                    <p className="line-clamp-2 text-sm font-semibold leading-snug text-neutral-900">
                      {conversation.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-500">
                      {conversation.lastMessage || t('chat.noMessagesYet')}
                    </p>
                  </button>
                ))}
              </div>
            </aside>

              <section className="flex min-h-[72vh] flex-1 flex-col bg-[#f5f4f0]">
                <header className="border-b border-black/[0.07] px-5 py-6 sm:px-8 sm:py-8">
                  <div className="flex items-start gap-4 sm:gap-5">
                    <button
                      type="button"
                      onClick={() => setSidebarOpen(true)}
                      className="mt-2 inline-flex shrink-0 items-center justify-center text-neutral-600 transition-colors hover:text-neutral-900 lg:hidden"
                      aria-label="Open chats"
                    >
                      <Menu size={22} strokeWidth={1.5} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-[10px] font-extrabold uppercase tracking-[0.22em] text-neutral-400 sm:text-[11px] ${outfit.className}`}
                      >
                        {t('chat.sectionEyebrow')}
                      </p>
                      <h1
                        className={`mt-3 text-2xl font-extrabold leading-none tracking-tight text-neutral-900 sm:text-3xl ${outfit.className}`}
                      >
                        {t('chat.title')}
                      </h1>
                      <p className="mt-3 max-w-xl text-sm leading-[1.65] text-neutral-600">{t('chat.subtitle')}</p>
                      <div className="mt-6 h-px max-w-[4.5rem] bg-neutral-900" aria-hidden />
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:max-w-3xl">
                    {advisorContext ? (
                      <div>
                        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                          {t('chat.focus')}
                        </p>
                        <div className="border border-black/[0.09] bg-white/60 px-3 py-3 text-sm text-neutral-900">
                          <span className="font-semibold">{advisorContext.name}</span>
                          {typeof advisorContext.nationalRank === 'number' ? (
                            <span className="text-neutral-500"> · #{advisorContext.nationalRank}</span>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                    <div className={advisorContext ? '' : 'sm:col-span-2 lg:max-w-md'}>
                      {advisorContext?.country && !countryPickerOpen ? (
                        <div>
                          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                            {t('chat.regionLabel')}
                          </p>
                          <div className="flex flex-col gap-2 border border-black/[0.09] bg-white/60 px-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                            <p className="min-w-0 text-neutral-800">
                              <span className="text-neutral-500">{t('chat.regionInUse')}:</span>{' '}
                              <span className="font-semibold text-neutral-900">{country}</span>
                            </p>
                            <button
                              type="button"
                              onClick={() => setCountryPickerOpen(true)}
                              className="shrink-0 self-start text-xs font-bold uppercase tracking-wide text-neutral-800 underline decoration-neutral-400 underline-offset-4 hover:text-neutral-950 sm:self-auto"
                            >
                              {t('chat.regionChange')}
                            </button>
                          </div>
                          <p className="mt-2 text-xs leading-relaxed text-neutral-500">{t('chat.regionHint')}</p>
                        </div>
                      ) : (
                        <div>
                          <label className="block" htmlFor="chat-region-country">
                            <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                              {t('chat.regionLabel')}
                            </span>
                            <div className="flex items-center gap-2 border border-black/[0.09] border-b-2 border-b-neutral-900/15 bg-white/60 px-3 py-2.5 transition-colors focus-within:border-b-neutral-900">
                              <Search size={16} className="shrink-0 text-neutral-400" aria-hidden />
                              <input
                                id="chat-region-country"
                                value={country}
                                onChange={(event) => setCountry(event.target.value)}
                                className="min-w-0 flex-1 bg-transparent text-neutral-900 outline-none placeholder:text-neutral-400 focus:ring-0"
                                placeholder={t('chat.regionPlaceholder')}
                                aria-label={t('chat.regionLabel')}
                              />
                            </div>
                          </label>
                          <p className="mt-2 text-xs leading-relaxed text-neutral-500">{t('chat.regionHint')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </header>

                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="flex-1 space-y-10 overflow-y-auto px-5 py-8 sm:px-8 sm:py-10">
                    {messages.length === 0 ? (
                      <div className="flex h-full min-h-[14rem] flex-col items-start justify-center px-0 sm:px-2">
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
                          <p
                            className={`mb-3 text-[11px] font-extrabold uppercase tracking-[0.18em] text-neutral-400 ${outfit.className}`}
                          >
                            soso.
                          </p>
                          <div className="border-l-2 border-neutral-900 pl-5 sm:pl-6">
                            {message.content ? <AssistantMessageBody content={message.content} /> : null}
                            {message.attachmentDataUrl ? (
                              <div className="mt-5 space-y-1 border-t border-black/[0.06] pt-5">
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
                                  className="max-h-52 w-full border border-black/[0.08] bg-white object-contain"
                                />
                              </div>
                            ) : null}
                          </div>
                        </article>
                      ) : (
                        <div key={message.id} className="flex flex-col items-end gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400">
                            {t('chat.youLabel')}
                          </span>
                          <div className="max-w-[min(100%,34rem)] border border-black/[0.1] bg-white/80 px-4 py-4 text-[15px] leading-[1.65] text-neutral-900 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
                            {message.content ? (
                              <p className="whitespace-pre-wrap">{message.content}</p>
                            ) : null}
                            {message.attachmentDataUrl ? (
                              <div className="mt-3 space-y-1">
                                {message.attachmentName ? (
                                  <p className="text-[11px] text-neutral-500">{message.attachmentName}</p>
                                ) : null}
                                <Image
                                  src={message.attachmentDataUrl}
                                  alt={message.attachmentName || 'Attached image'}
                                  width={640}
                                  height={360}
                                  unoptimized
                                  className="max-h-52 w-full border border-black/[0.08] bg-neutral-50 object-contain"
                                />
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ),
                    )}

                    {sending ? (
                      <div className="max-w-[min(100%,40rem)] border-l-2 border-neutral-900/30 pl-5 sm:pl-6">
                        <p
                          className={`mb-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-neutral-400 ${outfit.className}`}
                        >
                          soso.
                        </p>
                        <div className="flex items-center gap-2 text-sm text-neutral-500">
                          <Loader2 size={16} className="animate-spin text-neutral-400" />
                          {t('chat.thinking')}
                        </div>
                      </div>
                    ) : null}
                    <div ref={messagesEndRef} className="h-1 w-full shrink-0" aria-hidden />
                  </div>

                  <div className="border-t border-black/[0.07] bg-[#ebe8e2]/40 px-5 py-6 sm:px-8">
                    {screenshotDataUrl ? (
                      <div className="mb-4 border border-black/[0.1] bg-white/70 p-3 sm:p-4">
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
                      className="relative mx-auto max-w-3xl"
                    >
                      <div
                        className={`flex items-end gap-3 border-b-2 pb-2 transition-colors ${
                          isDragActive ? 'border-neutral-900' : 'border-neutral-900/20'
                        }`}
                      >
                        <label className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center text-neutral-500 transition-colors hover:text-neutral-900">
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
                          rows={2}
                          placeholder={t('chat.messagePlaceholder')}
                          className="max-h-40 min-h-11 flex-1 resize-none bg-transparent py-2.5 text-base text-neutral-900 placeholder:text-neutral-400 outline-none focus:ring-0 sm:text-[15px]"
                        />
                        <button
                          type="submit"
                          disabled={(!input.trim() && !screenshotDataUrl) || sending}
                          className={`inline-flex h-11 w-11 shrink-0 items-center justify-center border transition-all disabled:opacity-35 ${
                            !input.trim() && !screenshotDataUrl
                              ? 'border-neutral-300 text-neutral-300'
                              : 'border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-800'
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

      <footer className="flex flex-col justify-center border-t border-neutral-900/10 bg-[#f5f4f0] px-4 py-10 sm:px-6 sm:py-12">
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
            <ContactMailtoLink className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] hover:text-black" />
          </div>
          <div className="flex flex-1 justify-center md:justify-end items-center gap-2 text-black font-bold text-[10px] uppercase tracking-widest">
            {t('footer.status')}
          </div>
        </div>
      </footer>
    </main>
  );
}
