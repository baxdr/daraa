'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { InputAffordance, MessageResponse, QuickReply, StartResponse, Turn } from './types';

const START_TIMEOUT_MS = 15_000;
const MESSAGE_TIMEOUT_MS = 30_000;

export interface ChatSession {
  sessionId: string | null;
  turns: Turn[];
  suggestions: QuickReply[];
  input: InputAffordance | null;
  freeText: string;
  submitting: boolean;
  error: string | null;
  done: boolean;
  bottomRef: React.RefObject<HTMLDivElement>;
  setFreeText: (v: string) => void;
  handleQuickReply: (opt: QuickReply) => void;
  handleFreeSubmit: (e: React.FormEvent) => void;
  handleSkipInput: () => void;
  dismissError: () => void;
  retryStart: () => void;
}

export function useChatSession(): ChatSession {
  const router = useRouter();
  const searchParams = useSearchParams();
  const continueFrom = searchParams.get('continueFrom');

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [suggestions, setSuggestions] = useState<QuickReply[]>([]);
  const [input, setInput] = useState<InputAffordance | null>(null);
  const [freeText, setFreeText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [startRetry, setStartRetry] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), START_TIMEOUT_MS);
      try {
        const body = continueFrom ? { continueFromProjectId: continueFrom } : {};
        const res = await fetch('/api/chat/start', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error('تعذّر بدء المحادثة — تحقّق من الخادم');
        const data = (await res.json()) as StartResponse;
        if (cancelled) return;
        setSessionId(data.sessionId);
        setTurns([{ role: 'agent', message: data.agentMessage }]);
        setSuggestions(data.suggestions ?? []);
        setInput(data.input);
        setError(null);
      } catch (e) {
        clearTimeout(timeoutId);
        if (cancelled) return;
        const msg =
          e instanceof Error && e.name === 'AbortError'
            ? 'انتهت المهلة — الخادم بطيء، حاول مجدداً'
            : e instanceof Error
              ? e.message
              : 'خطأ غير متوقع';
        setError(msg);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [continueFrom, startRetry]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, done]);

  async function submitAnswer(rawAnswer: string, displayText: string) {
    if (!sessionId || submitting) return;
    const trimmed = rawAnswer.trim();
    if (!trimmed) return;
    const snapshotSuggestions = suggestions;
    const snapshotInput = input;
    setError(null);
    setSubmitting(true);
    setTurns((t) => [...t, { role: 'user', text: displayText }]);
    setFreeText('');
    setSuggestions([]);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), MESSAGE_TIMEOUT_MS);

    try {
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId, answer: trimmed }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        // Server error (500, 429, etc.) — surface a friendly message AND
        // restore the user's turn + typed text so they can retry without
        // retyping. The server's own error JSON (if any) takes priority.
        let serverMsg: string | undefined;
        try {
          const body = (await res.json()) as { error?: string };
          serverMsg = body.error;
        } catch {
          /* non-JSON body */
        }
        setError(serverMsg ?? `تعذّر الاتصال (${res.status}) — حاول مرة أخرى`);
        setTurns((t) => t.slice(0, -1));
        setFreeText(displayText);
        setSuggestions(snapshotSuggestions);
        setInput(snapshotInput);
        return;
      }

      const data = (await res.json()) as MessageResponse;

      if (data.error) {
        setError(data.error);
        setTurns((t) => t.slice(0, -1));
        setFreeText(displayText);
        setSuggestions(snapshotSuggestions);
        setInput(snapshotInput);
        return;
      }

      setTurns((t) => [...t, { role: 'agent', message: data.agentMessage }]);

      if (data.done) {
        setDone(true);
        setSuggestions([]);
        setInput(null);

        const res2 = await fetch('/api/project/start', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
        if (!res2.ok) {
          const msg =
            res2.status === 429
              ? 'تجاوزت الحد المسموح — انتظر دقيقة وحاول.'
              : `تعذّر بدء المشروع (${res2.status})`;
          setError(msg);
          setDone(false);
          setInput({ kind: 'text', placeholder: 'اكتب جوابك' });
          return;
        }
        const body = (await res2.json()) as { projectId?: string; error?: string };
        if (body.projectId) {
          router.push(`/project/${body.projectId}/agents`);
        } else {
          setError(body.error ?? 'تعذّر بدء الخطوة التالية');
          setDone(false);
          setInput({ kind: 'text', placeholder: 'اكتب جوابك' });
        }
        return;
      }

      setSuggestions(data.suggestions ?? []);
      setInput(data.input ?? { kind: 'text', placeholder: 'اكتب جوابك' });
    } catch (e) {
      clearTimeout(timeoutId);
      const msg =
        e instanceof Error && e.name === 'AbortError'
          ? 'انتهت المهلة — الخادم بطيء. حاول مجدداً.'
          : e instanceof Error
            ? e.message
            : 'خطأ غير متوقع';
      setError(msg);
      setTurns((t) => t.slice(0, -1));
      setFreeText(displayText);
      setSuggestions(snapshotSuggestions);
      setInput(snapshotInput);
    } finally {
      setSubmitting(false);
    }
  }

  function handleQuickReply(opt: QuickReply) {
    void submitAnswer(opt.value, opt.label);
  }

  function handleFreeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!freeText.trim()) return;
    void submitAnswer(freeText, freeText);
  }

  function handleSkipInput() {
    // Show the same label the user actually clicked — not a generic "تخطى".
    // Makes the chat log match their action instead of showing a short "تخطى"
    // bubble after clicking "تخطى — أبي التقرير بدون فحص الموقع".
    const label = input?.skipLabel?.trim() || 'تخطى';
    void submitAnswer('__skip__', label);
  }

  function dismissError() {
    setError(null);
  }

  function retryStart() {
    setError(null);
    setStartRetry((n) => n + 1);
  }

  return {
    sessionId,
    turns,
    suggestions,
    input,
    freeText,
    submitting,
    error,
    done,
    bottomRef,
    setFreeText,
    handleQuickReply,
    handleFreeSubmit,
    handleSkipInput,
    dismissError,
    retryStart,
  };
}
