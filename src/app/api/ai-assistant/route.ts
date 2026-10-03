import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyFirebaseIdToken } from '@/lib/server/firebase-token';
import { rateLimit } from '@/lib/server/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const MODEL = 'claude-opus-5-5';
const MAX_BODY_BYTES = 96 * 1024;
const MAX_MESSAGES = 40;
const MAX_MESSAGE_CHARS = 8000;
const RATE_LIMIT = 20; // طلباً
const RATE_WINDOW_MS = 10 * 60 * 1000; // لكل 10 دقائق لكل مستخدم

const SYSTEM_PROMPT = `أنت المساعد التربوي لمنصة «أستاذي»، منصة جزائرية لأساتذة التربية البدنية والرياضية في المرحلة الابتدائية.

تساعد الأستاذ في:
- تحليل نتائج التقييم التشخيصي: تفسير مؤشرات الأداء الحركي ونقاط القوة والضعف.
- اقتراح خطط علاجية: أنشطة وتمارين مناسبة لكل حالة بناءً على نتائج التشخيص.
- كتابة التقارير التربوية بصياغة مهنية.
- الأسئلة التربوية: منهاج التربية البدنية في الجزائر، طرائق التدريس، تسيير القسم.
- تحليل الغياب: تفسير أنماطه وكيفية التعامل معها.
- الوثائق الإدارية: المساعدة في إعداد الوثائق والتقارير الرسمية.

أجب بالعربية الفصحى وبمصطلحات المنهاج الجزائري. اجعل اقتراحاتك عملية وقابلة للتطبيق في حصة حقيقية بوسائل مدرسة ابتدائية. عند تحليل نتائج، ابدأ بنقاط القوة ثم نقاط الضعف. واجهة المحادثة تعرض النص كما هو دون تنسيق Markdown، فاكتب نصاً واضحاً بفقرات وقوائم بسيطة مرقّمة أو بشرطات، دون رموز عناوين أو نجوم للتغليظ. إن طُلب منك شيء خارج المجال التربوي والإداري للأستاذ فاعتذر بإيجاز ووجّه إلى ما تستطيع المساعدة فيه.`;

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().min(1).max(MAX_MESSAGE_CHARS),
      })
    )
    .min(1)
    .max(MAX_MESSAGES),
});

const json = (body: unknown, status: number, headers?: Record<string, string>) =>
  NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });

export async function POST(request: NextRequest) {
  // الخدمة موقوفة (قيد التطوير): المسار مغلق لكل الطلبات ما لم تُفعَّل صراحةً في إعدادات الخادم.
  if (process.env.AI_ASSISTANT_ENABLED !== 'true') {
    return json({ error: 'المساعد الذكي قيد التطوير وغير متاح حالياً.' }, 503);
  }

  // 1) المصادقة: رمز هوية Firebase صالح لحساب مفعَّل.
  const user = await verifyFirebaseIdToken(request.headers.get('authorization'));
  if (!user) {
    return json({ error: 'يجب تسجيل الدخول لاستعمال المساعد.' }, 401);
  }

  // 2) تحديد المعدّل لكل مستخدم.
  const limit = rateLimit(`ai:${user.uid}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!limit.ok) {
    return json(
      { error: 'بلغت الحد المسموح من الطلبات. حاول بعد قليل.' },
      429,
      { 'Retry-After': String(limit.retryAfterSec) }
    );
  }

  // 3) المفتاح يبقى في الخادم فقط؛ لا يُقبل مفتاح ولا عنوان خدمة من العميل.
  if (!process.env.ANTHROPIC_API_KEY) {
    return json({ error: 'المساعد الذكي غير مفعَّل على هذا الخادم بعد.' }, 503);
  }

  // 4) التحقق من الحمولة: الحجم ثم البنية.
  const raw = await request.text();
  if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) {
    return json({ error: 'المحادثة طويلة جداً. امسحها وابدأ محادثة جديدة.' }, 413);
  }
  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(JSON.parse(raw));
  } catch {
    return json({ error: 'صيغة الطلب غير صحيحة.' }, 400);
  }
  const { messages } = parsed;
  if (messages[0].role !== 'user' || messages[messages.length - 1].role !== 'user') {
    return json({ error: 'صيغة الطلب غير صحيحة.' }, 400);
  }

  const client = new Anthropic();
  const stream = client.beta.messages.stream(
    {
      model: MODEL,
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      output_config: { effort: 'low' },
      // عند رفض مصنِّفات الأمان، تعيد المنصة المحاولة على النموذج البديل الموصى به.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      messages,
    },
    { signal: request.signal }
  );

  // بثّ NDJSON: {"t":"delta","v":"..."} ثم {"t":"done"} أو {"t":"error","v":"..."}.
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: { t: 'delta' | 'error' | 'done'; v?: string }) =>
        controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));

      try {
        let produced = false;
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            produced = true;
            send({ t: 'delta', v: event.delta.text });
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === 'refusal') {
          send({ t: 'error', v: 'تعذّر على المساعد الإجابة عن هذا الطلب. أعد صياغته في إطار العمل التربوي.' });
        } else if (!produced) {
          send({ t: 'error', v: 'لم يصل ردّ من المساعد. حاول مرة أخرى.' });
        } else {
          if (final.stop_reason === 'max_tokens') {
            send({ t: 'delta', v: '\n\n… (اقتُطع الرد لطوله؛ اطلب «أكمل» للمتابعة)' });
          }
          send({ t: 'done' });
        }
      } catch (error) {
        if (request.signal.aborted) return;
        // التفاصيل تبقى في سجلات الخادم؛ العميل يستلم رسالة عامة فقط.
        let message = 'حدث خطأ أثناء الاتصال بالمساعد. حاول مرة أخرى.';
        if (error instanceof Anthropic.RateLimitError) {
          message = 'الخدمة مشغولة حالياً. حاول بعد لحظات.';
        } else if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
          message = 'إعداد المساعد الذكي على الخادم غير صحيح. أبلغ المشرف.';
          console.error('[ai-assistant] credential error', error.status);
        } else if (error instanceof Anthropic.APIError) {
          console.error('[ai-assistant] api error', error.status, error.name);
        } else {
          console.error('[ai-assistant] unexpected error', error instanceof Error ? error.name : 'unknown');
        }
        send({ t: 'error', v: message });
      } finally {
        controller.close();
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}
