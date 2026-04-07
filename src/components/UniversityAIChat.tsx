'use client';

import React, { FormEvent, useMemo, useState } from 'react';
import { Loader2, MessageCircle, Send, Paperclip, X, Globe2 } from 'lucide-react';
import Image from 'next/image';
import type { Language } from '@/lib/i18n';

type ChatRole = 'user' | 'assistant';

interface ChatMessage {
  role: ChatRole;
  content: string;
}

interface AdvisorLink {
  title: string;
  url: string;
}

interface AdvisorContext {
  name: string;
  country: string;
  domain: string;
  officialWebsite: string | null;
  programs: string[];
  links: AdvisorLink[];
}

interface UniversityAIChatProps {
  lang: Language;
  defaultCountry: string;
  context?: AdvisorContext;
}

const CHAT_COPY: Record<
  Language,
  {
    title: string;
    subtitle: string;
    placeholder: string;
    send: string;
    attach: string;
    remove: string;
    country: string;
    thinking: string;
    welcome: string;
  }
> = {
  uz: {
    title: 'AI Maslahatchi',
    subtitle:
      "Universitet tanlash, yo'nalish, hujjat topshirish va rasmiy sayt bo'yicha bosqichma-bosqich yordam oling.",
    placeholder: "Savolingizni yozing... Masalan: bu screenshotda keyin nima bosaman?",
    send: 'Yuborish',
    attach: 'Screenshot biriktirish',
    remove: "O'chirish",
    country: 'Tavsiya davlati',
    thinking: "AI javob tayyorlayapti...",
    welcome:
      "Salom! Men SOSO AI maslahatchiman. Universitet tanlash, yo'nalish va ro'yxatdan o'tish bosqichlarida yordam beraman.",
  },
  ru: {
    title: 'AI Консультант',
    subtitle:
      'Помогу выбрать университет, направление и пройти регистрацию шаг за шагом, включая разбор скриншотов.',
    placeholder: 'Напишите вопрос... Например: что нажать дальше на этом скриншоте?',
    send: 'Отправить',
    attach: 'Прикрепить скриншот',
    remove: 'Удалить',
    country: 'Страна для рекомендаций',
    thinking: 'AI готовит ответ...',
    welcome:
      'Здравствуйте! Я AI-консультант SOSO. Помогу с выбором университета, направления и шагами подачи заявки.',
  },
  en: {
    title: 'AI Advisor',
    subtitle:
      'Get step-by-step help for university choice, major selection, and admission/registration tasks, including screenshots.',
    placeholder: 'Ask anything... e.g. what should I click next on this screenshot?',
    send: 'Send',
    attach: 'Attach screenshot',
    remove: 'Remove',
    country: 'Recommendation country',
    thinking: 'AI is preparing a reply...',
    welcome:
      "Hi! I'm SOSO AI advisor. I can help you choose universities, programs, and complete admission steps.",
  },
};

async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Invalid file payload'));
      }
    };
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

export default function UniversityAIChat({ lang, defaultCountry, context }: UniversityAIChatProps) {
  const copy = CHAT_COPY[lang] || CHAT_COPY.en;
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: copy.welcome },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendationCountry, setRecommendationCountry] = useState(defaultCountry || 'United Kingdom');
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string | null>(null);

  const hasInput = input.trim().length > 0;
  const canSend = hasInput && !loading;
  const fileAccept = 'image/png,image/jpeg,image/webp,image/gif';

  const visibleMessages = useMemo(() => messages.slice(-12), [messages]);

  const onScreenshotSelect = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file only.');
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setScreenshotDataUrl(dataUrl);
      setScreenshotName(file.name);
      setError(null);
    } catch {
      setError('Failed to load screenshot.');
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSend) return;

    const userMessage: ChatMessage = { role: 'user', content: input.trim() };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: lang,
          recommendationCountry,
          messages: updatedMessages,
          screenshotDataUrl,
          context: context || null,
        }),
      });

      const payload: unknown = await response.json();
      if (!response.ok) {
        const errorMessage =
          payload && typeof payload === 'object' && typeof (payload as { error?: unknown }).error === 'string'
            ? (payload as { error: string }).error
            : 'AI request failed.';
        throw new Error(errorMessage);
      }

      const reply =
        payload && typeof payload === 'object' && typeof (payload as { reply?: unknown }).reply === 'string'
          ? (payload as { reply: string }).reply
          : '';
      if (!reply.trim()) {
        throw new Error('AI returned an empty answer.');
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: reply.trim() }]);
      setScreenshotDataUrl(null);
      setScreenshotName(null);
    } catch (requestError: unknown) {
      const message = requestError instanceof Error ? requestError.message : 'Unexpected chat error.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-5">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-white">
          <MessageCircle size={16} />
          <h4 className="text-sm font-bold tracking-wide uppercase">{copy.title}</h4>
        </div>
        <p className="text-xs text-neutral-300 leading-relaxed">{copy.subtitle}</p>
      </div>

      <label className="block text-[11px] text-neutral-400">
        {copy.country}
        <div className="mt-2 relative">
          <Globe2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            value={recommendationCountry}
            onChange={(event) => setRecommendationCountry(event.target.value)}
            className="w-full rounded-xl border border-white/15 bg-black/30 text-sm text-white pl-9 pr-3 py-2.5 outline-none focus:border-blue-300"
          />
        </div>
      </label>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-3 space-y-3 max-h-72 overflow-y-auto">
        {visibleMessages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`rounded-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
              message.role === 'assistant'
                ? 'bg-white/10 text-neutral-100'
                : 'bg-blue-500/20 border border-blue-300/20 text-blue-100'
            }`}
          >
            {message.content}
          </div>
        ))}
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-neutral-300">
            <Loader2 size={14} className="animate-spin" />
            {copy.thinking}
          </div>
        ) : null}
      </div>

      {screenshotDataUrl ? (
        <div className="rounded-xl border border-white/10 bg-black/25 p-3">
          <div className="flex items-center justify-between gap-3 text-xs text-neutral-300">
            <span className="truncate">{screenshotName || 'screenshot'}</span>
            <button
              type="button"
              onClick={() => {
                setScreenshotDataUrl(null);
                setScreenshotName(null);
              }}
              className="inline-flex items-center gap-1 text-neutral-300 hover:text-white"
            >
              <X size={13} />
              {copy.remove}
            </button>
          </div>
          <Image
            src={screenshotDataUrl}
            alt="Uploaded screenshot"
            width={640}
            height={360}
            unoptimized
            className="mt-3 rounded-lg max-h-40 w-full object-contain bg-black/20"
          />
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={copy.placeholder}
          rows={3}
          className="w-full rounded-2xl border border-white/15 bg-black/30 text-sm text-white placeholder:text-neutral-500 px-3 py-3 outline-none focus:border-blue-300 resize-none"
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2 text-xs text-neutral-300 hover:text-white cursor-pointer">
            <Paperclip size={14} />
            <span>{copy.attach}</span>
            <input
              type="file"
              accept={fileAccept}
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                void onScreenshotSelect(file);
                event.currentTarget.value = '';
              }}
            />
          </label>

          <button
            type="submit"
            disabled={!canSend}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-400 transition-colors"
          >
            <Send size={14} />
            {copy.send}
          </button>
        </div>
      </form>

      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </div>
  );
}
