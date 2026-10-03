"use client";

import { useMemo, useRef, useState } from "react";
import { collection, doc } from "firebase/firestore";
import { AlertCircle, CheckCircle2, FileDown, FileUp, Loader2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFirestore, useUser } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { commitInChunks } from "@/lib/firestore-batch";
import { LEVELS, normalizeLevel, type Level } from "@/lib/levels";
import type { Institution, Student } from "@/lib/types";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_ROWS = 3000;
const FROM_FILE = "__from_file__";
const TEMPLATE_HEADERS = ["اللقب", "الإسم", "الجنس", "تاريخ الميلاد", "المستوى", "الحالة"];

type NewStudent = Omit<Student, "id" | "studentId" | "userId" | "institutionId">;
type Parsed = { students: NewStudent[]; skipped: { row: number; reason: string }[]; duplicates: number };

const clean = (value: unknown, max: number) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const fold = (value: string) => value.replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").toLowerCase();

function parseGender(value: unknown): "male" | "female" | null {
  const v = fold(clean(value, 20));
  if (["انثي", "انثى", "بنت", "female", "f", "أ"].some((k) => v === fold(k))) return "female";
  if (["ذكر", "ولد", "male", "m", "ذ"].some((k) => v === fold(k))) return "male";
  return null;
}

/** يقبل أسماء الأعمدة بصيغها الشائعة (الإسم/الاسم…) بعد توحيد الهمزات. */
function readCell(row: Record<string, unknown>, ...names: string[]): unknown {
  const wanted = names.map(fold);
  for (const [key, value] of Object.entries(row)) {
    if (wanted.includes(fold(key.trim()))) return value;
  }
  return "";
}

export function ImportStudentsDialog({
  open,
  onOpenChange,
  institutions,
  existingStudents,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  institutions: Institution[] | null;
  existingStudents: Student[] | null;
}) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [institutionId, setInstitutionId] = useState("");
  const [levelChoice, setLevelChoice] = useState<string>(FROM_FILE);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<Record<string, unknown>[] | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const reset = () => {
    setRows(null);
    setFileName("");
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const downloadTemplate = async () => {
    const XLSX = await import("xlsx");
    const sheet = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS]);
    sheet["!cols"] = [{ wch: 20 }, { wch: 20 }, { wch: 10 }, { wch: 15 }, { wch: 18 }, { wch: 10 }];
    const help = XLSX.utils.aoa_to_sheet([
      ["العمود", "القيم المقبولة"],
      ["اللقب", "إلزامي"],
      ["الإسم", "إلزامي"],
      ["الجنس", "ذكر أو أنثى (إلزامي)"],
      ["تاريخ الميلاد", "اختياري — مثال: 2017-03-25"],
      ["المستوى", LEVELS.join(" / ")],
      ["الحالة", "يمارس أو معفي (الافتراضي: يمارس)"],
    ]);
    help["!cols"] = [{ wch: 18 }, { wch: 70 }];
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "التلاميذ");
    XLSX.utils.book_append_sheet(book, help, "تعليمات");
    XLSX.writeFile(book, "نموذج_رفع_التلاميذ.xlsx");
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    setFileError(null);
    setRows(null);
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "xlsx" && ext !== "xls") {
      setFileError("الرجاء اختيار ملف إكسيل بصيغة xlsx أو xls.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setFileError("حجم الملف يتجاوز 10 ميغابايت.");
      return;
    }
    setIsReading(true);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onerror = () => {
      setFileError("تعذّرت قراءة الملف.");
      setIsReading(false);
    };
    reader.onload = async (e) => {
      try {
        const XLSX = await import("xlsx");
        const book = XLSX.read(new Uint8Array(e.target?.result as ArrayBuffer), { type: "array", cellDates: true });
        const sheetName = book.SheetNames.find((n) => n.includes("التلاميذ")) ?? book.SheetNames[0];
        const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(book.Sheets[sheetName], {
          raw: false,
          defval: "",
          dateNF: "yyyy-mm-dd",
        });
        if (data.length === 0) {
          setFileError("الملف لا يحتوي أي سطر. تأكد من استعمال النموذج.");
        } else if (data.length > MAX_ROWS) {
          setFileError(`الملف يحتوي ${data.length} سطراً، والحد الأقصى ${MAX_ROWS} في المرة الواحدة.`);
        } else {
          setRows(data);
        }
      } catch {
        setFileError("تعذّرت معالجة الملف. تأكد من أنه ملف إكسيل سليم.");
      } finally {
        setIsReading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const parsed = useMemo<Parsed | null>(() => {
    if (!rows) return null;
    const forcedLevel = levelChoice === FROM_FILE ? null : (levelChoice as Level);
    const keyOf = (s: { lastName: string; firstName: string; level: string }) =>
      fold(`${s.lastName}|${s.firstName}|${s.level}`);
    const seen = new Set(
      (existingStudents ?? []).filter((s) => s.institutionId === institutionId).map(keyOf)
    );

    const result: Parsed = { students: [], skipped: [], duplicates: 0 };
    rows.forEach((row, index) => {
      const line = index + 2; // السطر 1 هو رأس الجدول
      const lastName = clean(readCell(row, "اللقب"), 80);
      const firstName = clean(readCell(row, "الإسم", "الاسم"), 80);
      if (!lastName && !firstName) return; // سطر فارغ
      if (!lastName || !firstName) {
        result.skipped.push({ row: line, reason: "اللقب أو الاسم ناقص" });
        return;
      }
      const gender = parseGender(readCell(row, "الجنس"));
      if (!gender) {
        result.skipped.push({ row: line, reason: "الجنس غير محدد (ذكر/أنثى)" });
        return;
      }
      const level = forcedLevel ?? normalizeLevel(readCell(row, "المستوى"));
      if (!level) {
        result.skipped.push({ row: line, reason: "المستوى غير معروف" });
        return;
      }
      const student: NewStudent = {
        lastName,
        firstName,
        gender,
        level,
        dateOfBirth: clean(readCell(row, "تاريخ الميلاد"), 20),
        status: fold(clean(readCell(row, "الحالة"), 20)).startsWith("معف") ? "exempt" : "active",
        departmentId: null,
      };
      const key = keyOf(student);
      if (seen.has(key)) {
        result.duplicates++;
        return;
      }
      seen.add(key);
      result.students.push(student);
    });
    return result;
  }, [rows, levelChoice, existingStudents, institutionId]);

  const perLevel = useMemo(() => {
    const counts = new Map<string, number>();
    parsed?.students.forEach((s) => counts.set(s.level, (counts.get(s.level) ?? 0) + 1));
    return LEVELS.filter((l) => counts.has(l)).map((l) => ({ level: l, count: counts.get(l)! }));
  }, [parsed]);

  const handleImport = async () => {
    if (!user || !parsed || parsed.students.length === 0 || !institutionId) return;
    setIsSaving(true);
    try {
      await commitInChunks(firestore, parsed.students, (batch, student) =>
        batch.set(doc(collection(firestore, "students")), { ...student, institutionId, userId: user.uid })
      );
      toast({ title: "تم الرفع", description: `أُضيف ${parsed.students.length} تلميذ(ة) بنجاح.`, variant: "success" });
      handleOpenChange(false);
    } catch {
      toast({ title: "تعذّر الرفع", description: "لم تُحفظ كل البيانات. تحقق من الاتصال وحاول مرة أخرى.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const canImport = !!institutionId && !!parsed && parsed.students.length > 0 && !isSaving;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>رفع قائمة التلاميذ من ملف إكسيل</DialogTitle>
          <DialogDescription>
            حمّل النموذج، املأه (أو استعمل ملف «محوّل قوائم الرقمنة»)، ثم ارفعه هنا. تُراجع النتيجة قبل الحفظ.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3">
            <p className="text-sm">
              <span className="font-semibold">1.</span> النموذج: {TEMPLATE_HEADERS.join("، ")}
            </p>
            <Button type="button" variant="outline" size="sm" onClick={downloadTemplate}>
              <FileDown /> تحميل النموذج
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="import-institution"><span className="font-semibold">2.</span> المؤسسة</Label>
              <Select value={institutionId} onValueChange={setInstitutionId}>
                <SelectTrigger id="import-institution"><SelectValue placeholder="اختر المؤسسة" /></SelectTrigger>
                <SelectContent>
                  {institutions?.map((inst) => <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {institutions?.length === 0 && (
                <p className="text-xs text-destructive">أضف مؤسسة من صفحة الإعدادات أولاً.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="import-level"><span className="font-semibold">3.</span> المستوى</Label>
              <Select value={levelChoice} onValueChange={setLevelChoice}>
                <SelectTrigger id="import-level"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={FROM_FILE}>حسب عمود «المستوى» في الملف</SelectItem>
                  {LEVELS.map((l) => <SelectItem key={l} value={l}>الكل في: {l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}
              className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-input p-6 text-center transition-colors hover:border-primary/50 hover:bg-accent/40"
            >
              {isReading ? <Loader2 className="h-7 w-7 animate-spin text-primary" /> : <FileUp className="h-7 w-7 text-muted-foreground" />}
              <span className="text-sm font-semibold"><span>4.</span> {fileName || "اضغط لاختيار الملف أو اسحبه إلى هنا"}</span>
              <span className="text-xs text-muted-foreground">xlsx أو xls — 10 ميغابايت و{MAX_ROWS} سطر كحد أقصى. الملف يُقرأ في متصفحك.</span>
            </button>
          </div>

          {fileError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{fileError}</AlertDescription>
            </Alert>
          )}

          {parsed && (
            <Alert variant={parsed.students.length > 0 ? "success" : "warning"}>
              {parsed.students.length > 0 ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertTitle className="text-foreground">
                {parsed.students.length > 0 ? `${parsed.students.length} تلميذ(ة) جاهز للرفع` : "لا يوجد تلاميذ صالحون للرفع"}
              </AlertTitle>
              <AlertDescription className="space-y-2 text-foreground">
                {perLevel.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {perLevel.map(({ level, count }) => (
                      <Badge key={level} variant="outline" className="bg-card">{level}: <span className="tabular">{count}</span></Badge>
                    ))}
                  </div>
                )}
                {parsed.duplicates > 0 && (
                  <p>تُجوهل {parsed.duplicates} تلميذ(ة) موجودون مسبقاً في هذه المؤسسة بنفس الاسم والمستوى.</p>
                )}
                {parsed.skipped.length > 0 && (
                  <div>
                    <p>تُجوهل {parsed.skipped.length} سطر لنقص البيانات:</p>
                    <ul className="mt-1 list-inside list-disc text-xs text-muted-foreground">
                      {parsed.skipped.slice(0, 5).map((s) => <li key={s.row}>السطر {s.row}: {s.reason}</li>)}
                      {parsed.skipped.length > 5 && <li>… و{parsed.skipped.length - 5} أسطر أخرى</li>}
                    </ul>
                  </div>
                )}
                {!institutionId && parsed.students.length > 0 && <p className="font-medium text-destructive">اختر المؤسسة لإتمام الرفع.</p>}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isSaving}>إلغاء</Button>
          <Button type="button" onClick={handleImport} disabled={!canImport}>
            {isSaving ? <Loader2 className="animate-spin" /> : <FileUp />}
            {parsed?.students.length ? `رفع ${parsed.students.length} تلميذ(ة)` : "رفع التلاميذ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
