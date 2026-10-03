'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  Calendar,
  Check,
  Copy,
  FileText,
  GraduationCap,
  Send,
  ShieldCheck,
  Sparkles,
  Square,
  Trash2,
  type LucideIcon,
} from 'lucide-react';

import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type StreamEvent = { t: 'delta' | 'error' | 'done'; v?: string };

const MAX_INPUT_CHARS = 8000;

const QUICK_PROMPTS: { icon: LucideIcon; label: string; hint: string; prompt: string }[] = [
  {
    icon: Activity,
    label: 'تحليل نتائج التشخيص',
    hint: 'نقاط القوة والضعف وأنشطة علاجية',
    prompt:
      'لدي تلميذ في السنة الثانية ابتدائي يعاني من صعوبة في الحركات القاعدية (المشي الثنائي والجري)، لكنه يتقن الوضعيات الأساسية. ساعدني في تحليل هذه النتيجة واقتراح أنشطة علاجية مناسبة.',
  },
  {
    icon: FileText,
    label: 'كتابة تقرير تربوي',
    hint: 'صياغة مهنية جاهزة للتسليم',
    prompt:
      'اكتب لي تقريراً تربوياً لتلميذ في السنة الثالثة ابتدائي، أداؤه جيد في الوضعيات والتنقلات لكنه يواجه صعوبة في الحركات القاعدية الثنائية.',
  },
  {
    icon: Calendar,
    label: 'تحليل نمط الغياب',
    hint: 'تفسير وخطوات التعامل',
    prompt:
      'تلميذ تغيب 8 مرات خلال الفصل الأول، وغيابه في الغالب يومي الأحد والإثنين. كيف أتعامل مع هذا الوضع وما الخطوات المناسبة؟',
  },
  {
    icon: GraduationCap,
    label: 'مذكرة حصة',
    hint: 'حصة 45 دقيقة بمراحلها',
    prompt:
      'أريد مذكرة حصة في التربية البدنية لتلاميذ السنة الأولى ابتدائي حول الوضعيات الأساسية والحركات القاعدية. المدة: 45 دقيقة.',
  },
];

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

function MessageBubble({ message, streaming }: { message: Message; streaming: boolean }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // الحافظة غير متاحة (سياق غير آمن أو إذن مرفوض)
    }
  };

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <span
        aria-hidden="true"
        className={cn(
          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'
        )}
      >
        {isUser ? <GraduationCap className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      </span>
      <div className={cn('flex min-w-0 max-w-[85%] flex-col gap-1.5', isUser && 'items-end')}>
        <div
          className={cn(
            'whitespace-pre-wrap break-words rounded-xl px-4 py-3 text-sm leading-7',
            isUser ? 'bg-primary text-primary-foreground' : 'border bg-card'
          )}
        >
          {message.content}
          {streaming && <span className="ms-1 inline-block h-4 w-[3px] animate-pulse rounded-full bg-primary align-middle" />}
        </div>
        {!isUser && !streaming && message.content && (
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded px-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'نُسخ' : 'نسخ'}
          </button>
        )}
      </div>
    </div>
  );
}

export function AssistantChat() {
  const { toast } = useToast();
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const sendMessage = useCallback(
    async (content?: string) => {
      const text = (content ?? input).trim();
      if (!text || isLoading || !user) return;
      if (text.length > MAX_INPUT_CHARS) {
        toast({ title: 'الرسالة طويلة جداً', description: `الحد الأقصى ${MAX_INPUT_CHARS} حرف.`, variant: 'destructive' });
        return;
      }

      const userMessage: Message = { id: newId(), role: 'user', content: text };
      const assistantId = newId();
      const history = [...messages, userMessage];

      setMessages([...history, { id: assistantId, role: 'assistant', content: '' }]);
      setInput('');
      setIsLoading(true);

      const controller = new AbortController();
      abortRef.current = controller;

      const append = (chunk: string) =>
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m)));
      const dropEmptyAssistant = () =>
        setMessages((prev) => prev.filter((m) => m.id !== assistantId || m.content.length > 0));

      try {
        // المفتاح السري يبقى في الخادم؛ المتصفح يرسل رمز هوية Firebase فقط.
        const idToken = await user.getIdToken();
        const response = await fetch('/api/ai-assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ messages: history.map(({ role, content: c }) => ({ role, content: c })) }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.error || 'تعذّر الاتصال بالمساعد. حاول مرة أخرى.');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let streamError: string | null = null;

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (!line) continue;
            let event: StreamEvent;
            try {
              event = JSON.parse(line);
            } catch {
              continue;
            }
            if (event.t === 'delta' && event.v) append(event.v);
            else if (event.t === 'error') streamError = event.v || 'حدث خطأ غير متوقع.';
          }
        }

        if (streamError) throw new Error(streamError);
      } catch (error) {
        if (!controller.signal.aborted) {
          toast({
            title: 'تعذّر إكمال الرد',
            description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع.',
            variant: 'destructive',
          });
        }
      } finally {
        dropEmptyAssistant();
        abortRef.current = null;
        setIsLoading(false);
      }
    },
    [input, isLoading, messages, toast, user]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      sendMessage();
    }
  };

  const lastId = messages[messages.length - 1]?.id;

  return (
    <div className="flex h-[calc(100dvh-8rem)] min-h-[520px] flex-col gap-5 lg:h-[calc(100dvh-9rem)]">
      <PageHeader
        title="المساعد الذكي"
        description="مساعد تربوي متخصص في منهاج التربية البدنية للمرحلة الابتدائية، يعمل بنموذج Claude."
        actions={
          messages.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => { abortRef.current?.abort(); setMessages([]); }}>
              <Trash2 /> محادثة جديدة
            </Button>
          )
        }
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-muted/30">
        <div ref={scrollRef} className="scroll-thin flex-1 space-y-5 overflow-y-auto p-4 sm:p-6" aria-live="polite">
          {messages.length === 0 ? (
            <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center gap-6 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <Sparkles className="h-7 w-7" />
              </span>
              <div className="space-y-1.5">
                <h2 className="text-lg font-semibold">بماذا أساعدك اليوم؟</h2>
                <p className="text-sm text-muted-foreground">اختر أحد الاقتراحات أو اكتب سؤالك مباشرة.</p>
              </div>
              <div className="grid w-full gap-3 sm:grid-cols-2">
                {QUICK_PROMPTS.map((qp) => (
                  <button
                    key={qp.label}
                    type="button"
                    onClick={() => sendMessage(qp.prompt)}
                    disabled={isLoading}
                    className="flex items-start gap-3 rounded-lg border bg-card p-3.5 text-start shadow-xs transition-colors hover:border-primary/40 hover:bg-accent/40 disabled:opacity-50"
                  >
                    <qp.icon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-primary" />
                    <span>
                      <span className="block text-sm font-semibold">{qp.label}</span>
                      <span className="block text-xs text-muted-foreground">{qp.hint}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} streaming={isLoading && msg.id === lastId && msg.role === 'assistant'} />
            ))
          )}
        </div>

        <div className="border-t bg-card p-3 sm:p-4">
          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب سؤالك هنا…"
              aria-label="رسالتك إلى المساعد"
              className="max-h-40 min-h-[44px] resize-none"
              rows={1}
              maxLength={MAX_INPUT_CHARS}
              disabled={isLoading}
            />
            {isLoading ? (
              <Button type="button" variant="outline" size="icon" className="h-11 w-11 shrink-0" onClick={() => abortRef.current?.abort()} aria-label="إيقاف الرد">
                <Square />
              </Button>
            ) : (
              <Button type="button" size="icon" className="h-11 w-11 shrink-0" onClick={() => sendMessage()} disabled={!input.trim()} aria-label="إرسال">
                <Send className="rtl:-scale-x-100" />
              </Button>
            )}
          </div>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            لا تُدرج الأسماء الكاملة للتلاميذ في رسائلك. Enter للإرسال، Shift+Enter لسطر جديد.
          </p>
        </div>
      </div>
    </div>
  );
}
