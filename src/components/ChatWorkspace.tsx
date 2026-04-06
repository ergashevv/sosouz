'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Outfit } from 'next/font/google';
import {
  Loader2,
  MessageCircle,
  Plus,
  Send,
  Paperclip,
  X,
  Search,
  ArrowLeft,
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

export default function ChatWorkspace({ user }: ChatWorkspaceProps) {
  const router = useRouter();
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
    const initialize = async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await refreshConversations();
        if (list.length === 0) {
          const create = await authFetch('/api/chat/conversations', { method: 'POST' });
          if (!create.ok) throw new Error('Failed to create a conversation.');
          const createdPayload = (await create.json()) as { conversation: ConversationItem };
          const createdConversation = createdPayload.conversation;
          setConversations([createdConversation]);
          setActiveConversationId(createdConversation.id);
          setMessages([]);
        } else {
          setActiveConversationId(list[0].id);
          await loadMessages(list[0].id);
        }
      } catch (initError: unknown) {
        setError(initError instanceof Error ? initError.message : 'Failed to initialize chat.');
      } finally {
        setLoading(false);
      }
    };

    void initialize();
  }, [loadMessages, refreshConversations]);

  const startNewChat = async () => {
    setError(null);
    try {
      const response = await authFetch('/api/chat/conversations', { method: 'POST' });
      if (!response.ok) throw new Error('Could not create a new chat.');
      const payload = (await response.json()) as { conversation: ConversationItem };
      const createdConversation = payload.conversation;
      setConversations((prev) => [createdConversation, ...prev]);
      setActiveConversationId(createdConversation.id);
      setMessages([]);
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
    if (!activeConversationId || !input.trim() || sending) return;

    const optimisticUserMessage: ChatMessage = {
      id: `tmp-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      createdAt: new Date().toISOString(),
    };
    const pendingContent = input.trim();
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
          screenshotDataUrl,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(typeof payload.error === 'string' ? payload.error : 'Message failed.');
      }

      const assistantMessage = payload.message as ChatMessage;
      setMessages((prev) => [...prev, assistantMessage]);
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-neutral-500">
          <Loader2 size={18} className="animate-spin" />
          Loading your AI workspace...
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white flex flex-col">
      <nav className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-neutral-100 bg-white relative z-40">
        <div className="flex items-center cursor-pointer" onClick={() => router.push('/')}>
          <span className={`text-3xl sm:text-4xl tracking-tight text-neutral-900 leading-none ${outfit.className}`}>
            soso.
          </span>
        </div>

        <div className="flex items-center flex-wrap justify-center sm:justify-end gap-3 sm:gap-5">
          <Link
            href="/search"
            className="text-[10px] sm:text-[11px] font-bold text-neutral-500 hover:text-black transition-colors uppercase tracking-widest"
          >
            {t('nav.search')}
          </Link>
          <Link
            href="/about"
            className="text-[10px] sm:text-[11px] font-bold text-neutral-500 hover:text-black transition-colors uppercase tracking-widest"
          >
            {t('nav.about')}
          </Link>
          <Link
            href="/students"
            className="text-[10px] sm:text-[11px] font-bold text-neutral-500 hover:text-black transition-colors uppercase tracking-widest"
          >
            {t('nav.students')}
          </Link>
          <span className="text-[10px] sm:text-[11px] font-black text-black uppercase tracking-widest underline underline-offset-4">
            AI Chat
          </span>
          <div className="hidden sm:block h-4 w-px bg-neutral-200 mx-1" />
          <div className="flex items-center gap-3 sm:gap-4">
            {(['en', 'ru', 'uz'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`text-[10px] font-black uppercase tracking-widest transition-all ${
                  language === lang ? 'text-black underline underline-offset-4' : 'text-neutral-300 hover:text-neutral-500'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
          <HeaderAccountActions />
        </div>
      </nav>

      <section className="flex-1 py-6 sm:py-8 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4 sm:mb-6 flex flex-wrap items-center justify-between gap-3">
            <Link href="/" className="inline-flex items-center gap-2 text-xs text-neutral-500 hover:text-black">
              <ArrowLeft size={14} />
              Back to home
            </Link>
            <div className="text-xs text-neutral-500 uppercase tracking-wider">
              Signed in as <span className="font-semibold text-neutral-800">{user.firstName} {user.lastName}</span>
            </div>
          </div>

          <div className="border border-neutral-200 bg-white relative overflow-hidden">
            {sidebarOpen ? (
              <button
                type="button"
                aria-label="Close chats"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden absolute inset-0 z-20 bg-black/30"
              />
            ) : null}

            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] min-h-[65vh] sm:min-h-[72vh]">
              <aside
                className={`absolute inset-y-0 left-0 z-30 w-[85%] max-w-[320px] border-r border-neutral-200 bg-white p-3 sm:p-4 space-y-3 transition-transform lg:static lg:z-auto lg:w-auto lg:max-w-none lg:translate-x-0 ${
                  sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
              >
                <div className="flex items-center justify-between lg:hidden">
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-700">Chats</p>
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    className="inline-flex h-8 w-8 items-center justify-center border border-neutral-200 bg-white text-neutral-700"
                  >
                    <X size={14} />
                  </button>
                </div>

                <button
                  onClick={() => void startNewChat()}
                  className="w-full inline-flex items-center justify-center gap-2 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-widest py-2.5 transition-colors"
                >
                  <Plus size={15} />
                  New chat
                </button>

                <div className="space-y-2 max-h-[58vh] overflow-y-auto">
                  {conversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      onClick={() => void openConversation(conversation.id)}
                      className={`w-full text-left border px-3 py-2.5 transition-colors ${
                        activeConversationId === conversation.id
                          ? 'border-black bg-neutral-100'
                          : 'border-neutral-200 bg-white hover:bg-neutral-50'
                      }`}
                    >
                      <p className="text-sm font-semibold text-neutral-900 truncate">{conversation.title}</p>
                      <p className="mt-1 text-[11px] text-neutral-500 line-clamp-2">
                        {conversation.lastMessage || 'No messages yet'}
                      </p>
                    </button>
                  ))}
                </div>
              </aside>

              <section className="p-3 sm:p-4 lg:p-5 flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-200 pb-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSidebarOpen(true)}
                      className="inline-flex h-8 w-8 items-center justify-center border border-neutral-200 bg-white text-neutral-700 lg:hidden"
                      aria-label="Open chats"
                    >
                      <MessageCircle size={14} />
                    </button>
                    <MessageCircle size={16} className="text-neutral-700" />
                    <h1 className="text-sm sm:text-base font-semibold text-neutral-900">SOSO AI Chat</h1>
                  </div>
                  <div className="flex items-center gap-2 border border-neutral-200 bg-white px-3 py-2 sm:w-[260px] max-w-full">
                    <Search size={14} className="text-neutral-400" />
                    <input
                      value={country}
                      onChange={(event) => setCountry(event.target.value)}
                      className="w-full bg-transparent text-xs text-neutral-800 outline-none placeholder:text-neutral-400"
                      placeholder="Recommendation country"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto py-4 space-y-3 min-h-[34vh]">
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-sm text-neutral-400 text-center max-w-md">
                        Ask anything about university choice, admissions, scholarships, or documents and get clear next steps.
                      </p>
                    </div>
                  ) : null}
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`max-w-[88%] px-3 py-2 text-sm whitespace-pre-wrap leading-relaxed border ${
                        message.role === 'assistant'
                          ? 'bg-white border-neutral-200 text-neutral-800'
                          : 'ml-auto bg-black text-white border-black'
                      }`}
                    >
                      {message.role === 'assistant' ? normalizeAssistantText(message.content) : message.content}
                    </div>
                  ))}
                  {sending ? (
                    <div className="inline-flex items-center gap-2 border border-neutral-200 bg-white text-neutral-600 text-sm px-3 py-2">
                      <Loader2 size={14} className="animate-spin" />
                      Thinking...
                    </div>
                  ) : null}
                </div>

                {screenshotDataUrl ? (
                  <div className="mb-3 border border-neutral-200 bg-neutral-50 p-3">
                    <div className="flex items-center justify-between text-xs text-neutral-500">
                      <span className="truncate">{screenshotName || 'screenshot'}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setScreenshotDataUrl(null);
                          setScreenshotName(null);
                        }}
                        className="inline-flex items-center gap-1 hover:text-black transition-colors"
                      >
                        <X size={12} />
                        Remove
                      </button>
                    </div>
                    <Image
                      src={screenshotDataUrl}
                      alt="Screenshot preview"
                      width={640}
                      height={360}
                      unoptimized
                      className="mt-2 w-full max-h-44 object-contain bg-white border border-neutral-200"
                    />
                  </div>
                ) : null}

                <form onSubmit={sendMessage} className="border-t border-neutral-200 pt-3 sticky bottom-0 bg-white">
                  <div className="border border-neutral-200 bg-white p-2 flex items-end gap-2">
                    <textarea
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      rows={3}
                      placeholder="Ask anything about university choice, registration, or what to click next..."
                      className="flex-1 bg-transparent px-2 py-2 text-sm text-neutral-800 placeholder:text-neutral-400 outline-none resize-none"
                    />
                    <div className="flex flex-col gap-2">
                      <label className="inline-flex items-center justify-center w-9 h-9 border border-neutral-200 bg-white hover:bg-neutral-50 cursor-pointer transition-colors">
                        <Paperclip size={15} className="text-neutral-500" />
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/gif"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (!file) return;
                            void fileToDataUrl(file).then((dataUrl) => {
                              setScreenshotDataUrl(dataUrl);
                              setScreenshotName(file.name);
                            });
                            event.currentTarget.value = '';
                          }}
                        />
                      </label>
                      <button
                        type="submit"
                        disabled={!input.trim() || sending}
                        className="inline-flex items-center justify-center w-9 h-9 bg-black text-white hover:bg-neutral-800 disabled:opacity-40 transition-colors"
                      >
                        <Send size={15} />
                      </button>
                    </div>
                  </div>
                </form>

                {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
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
