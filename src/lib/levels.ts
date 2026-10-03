export const LEVELS = ["أولى ابتدائي", "ثانية ابتدائي", "ثالثة ابتدائي", "رابعة ابتدائي", "خامسة ابتدائي"] as const;
export type Level = (typeof LEVELS)[number];

const LEVEL_KEYS: [string, Level][] = [
  ["اول", "أولى ابتدائي"],
  ["ثاني", "ثانية ابتدائي"],
  ["ثالث", "ثالثة ابتدائي"],
  ["رابع", "رابعة ابتدائي"],
  ["خامس", "خامسة ابتدائي"],
];

/** يوحّد كتابات المستوى المختلفة («أولى إبتدائي 2»، «السنة الأولى»، «1»…) إلى الصيغة المعتمدة في المنصة. */
export function normalizeLevel(input: unknown): Level | null {
  const text = String(input ?? "").replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").trim();
  if (!text) return null;
  for (const [key, level] of LEVEL_KEYS) {
    if (text.includes(key)) return level;
  }
  const digit = text.match(/^[1-5]$/);
  return digit ? LEVELS[Number(digit[0]) - 1] : null;
}
