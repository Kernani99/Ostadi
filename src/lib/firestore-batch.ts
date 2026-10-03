import { writeBatch, type Firestore, type WriteBatch } from "firebase/firestore";

/** حدّ Firestore لعدد العمليات في الدفعة الواحدة هو 500؛ نترك هامشاً. */
const CHUNK = 400;

/**
 * ينفّذ عملية كتابة لكل عنصر على دفعات متتالية، حتى لا تفشل العمليات الجماعية
 * (حذف/تحويل/استيراد) عند تجاوز 500 عنصر.
 */
export async function commitInChunks<T>(
  firestore: Firestore,
  items: readonly T[],
  apply: (batch: WriteBatch, item: T) => void
): Promise<void> {
  for (let i = 0; i < items.length; i += CHUNK) {
    const batch = writeBatch(firestore);
    for (const item of items.slice(i, i + CHUNK)) apply(batch, item);
    await batch.commit();
  }
}
