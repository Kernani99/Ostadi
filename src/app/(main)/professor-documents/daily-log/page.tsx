
'use client';

import { PageHeader } from "@/components/layout/page-header";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useDoc, useFirestore, useUser } from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";
import { commitInChunks } from "@/lib/firestore-batch";
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useMemoFirebase } from "@/firebase/provider";
import type { Institution, DailyLog, ProfessorProfile } from "@/lib/types";
import { Loader2, Save, CalendarIcon, History, Printer, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ar } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useState, useMemo, useRef } from "react";

const dailyLogSchema = z.object({
  institutionId: z.string().min(1, "المدرسة مطلوبة"),
  level: z.string().min(1, "المستوى مطلوب"),
  date: z.date({ required_error: "التاريخ مطلوب" }),
  startTime: z.string().min(1, "توقيت البدء مطلوب"),
  endTime: z.string().min(1, "توقيت الانتهاء مطلوب"),
  field: z.string().max(2000, "النص طويل جداً").optional(),
  memoNumber: z.string().max(2000, "النص طويل جداً").optional(),
  learnings: z.string().max(2000, "النص طويل جداً").optional(),
  learningContent: z.string().max(2000, "النص طويل جداً").optional(),
  observation: z.string().max(2000, "النص طويل جداً").optional(),
});

type DailyLogFormValues = z.infer<typeof dailyLogSchema>;

export default function DailyLogPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [logToDelete, setLogToDelete] = useState<DailyLog | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: institutions, isLoading: loadingInstitutions } = useCollection<Institution>(
    useMemoFirebase(() => user ? query(collection(firestore, 'institutions'), where('userId', '==', user.uid)) : null, [firestore, user])
  );
  
  const institutionsMapByName = useMemo(() => {
    return new Map(institutions?.map(inst => [inst.name.toLowerCase(), inst.id]));
  }, [institutions]);

  const userLogsQuery = useMemoFirebase(() => 
    user ? query(collection(firestore, 'daily_logs'), where('userId', '==', user.uid)) : null, 
  [firestore, user]);
  const { data: dailyLogs, isLoading: loadingLogs } = useCollection<DailyLog>(userLogsQuery);

  const { data: profile } = useDoc<ProfessorProfile>(
    useMemoFirebase(() => user ? doc(firestore, 'professor_profile', user.uid) : null, [firestore, user])
  );
  const professorName = `${profile?.lastName || ''} ${profile?.firstName || ''}`.trim();

  const sortedLogs = useMemo(() => {
    if (!dailyLogs) return [];
    return [...dailyLogs].sort((a,b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
    });
  }, [dailyLogs]);


  const form = useForm<DailyLogFormValues>({
    resolver: zodResolver(dailyLogSchema),
    defaultValues: {
      institutionId: '',
      level: '',
      startTime: '',
      endTime: '',
      field: '',
      memoNumber: '',
      learnings: '',
      learningContent: '',
      observation: '',
    },
  });

  async function onSubmit(data: DailyLogFormValues) {
    if (!user) {
        toast({ title: "خطأ", description: "يجب أن تكون مسجلاً للدخول لحفظ السجل.", variant: "destructive" });
        return;
    }

    const logData = {
        ...data,
        date: format(data.date, 'yyyy-MM-dd'),
        userId: user.uid,
    };
    
    try {
        await addDocumentNonBlocking(collection(firestore, 'daily_logs'), logData);
        toast({
          title: "تم الحفظ بنجاح",
          description: "تمت إضافة قيد جديد إلى الكراس اليومي.",
          variant: 'success'
        });
        form.reset();
    } catch (error) {
        // The error is already handled globally by the non-blocking-updates logic
        // but you could add specific UI feedback here if needed.
    }
  }
  
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) {
      if (!user) toast({ title: "خطأ", description: "يجب تسجيل الدخول أولاً.", variant: "destructive" });
      return;
    }

    // حدّ للحجم قبل القراءة: ملف JSON ضخم يجمّد المتصفح.
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "الملف كبير جداً", description: "الحد الأقصى لحجم ملف الاستيراد 5 ميغابايت.", variant: "destructive" });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const fileContent = e.target?.result;
        if (typeof fileContent !== 'string') {
          toast({ title: "خطأ في الملف", description: "لا يمكن قراءة محتوى الملف.", variant: "destructive" });
          return;
        }

        // الملف مصدر غير موثوق: كل حقل يُحوَّل إلى نص ويُقصّ، والتاريخ يُتحقق من صيغته.
        const text = (value: unknown, max: number) => (typeof value === 'string' || typeof value === 'number' ? String(value).slice(0, max) : '');
        const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
        const MAX_IMPORT = 2000;

        const data: unknown = JSON.parse(fileContent);
        const newLogs: Omit<DailyLog, 'id'>[] = [];

        const artifacts = isRecord(data) && isRecord(data.artifacts) ? data.artifacts : {};
        for (const artifact of Object.values(artifacts)) {
          const users = isRecord(artifact) && isRecord(artifact.users) ? artifact.users : {};
          for (const entry of Object.values(users)) {
            const userLogs = isRecord(entry) && isRecord(entry.dailyLogs) ? entry.dailyLogs : {};
            for (const log of Object.values(userLogs)) {
              if (!isRecord(log) || newLogs.length >= MAX_IMPORT) continue;
              const institutionId = institutionsMapByName.get(text(log.school, 200).toLowerCase());
              const date = text(log.date, 10);
              if (!institutionId || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;

              newLogs.push({
                userId: user.uid,
                institutionId,
                level: text(log.level, 60),
                date,
                startTime: text(log.timeFrom, 10),
                endTime: text(log.timeTo, 10),
                field: text(log.field, 300),
                memoNumber: text(log.noteNumber, 60),
                learnings: text(log.learning, 2000),
                learningContent: text(log.content, 2000),
                observation: text(log.observation, 2000),
              });
            }
          }
        }

        if (newLogs.length > 0) {
          await commitInChunks(firestore, newLogs, (batch, log) => batch.set(doc(collection(firestore, 'daily_logs')), log));
          toast({
            title: "تم الاستيراد بنجاح",
            description: `تم استيراد ${newLogs.length} قيد/قيود من السجل القديم.`,
            variant: 'success'
          });
        } else {
          toast({
            title: "لم يتم استيراد أي شيء",
            description: "لم يتم العثور على قيود صالحة في الملف أو أن أسماء المدارس غير مطابقة.",
            variant: "destructive"
          });
        }
      } catch {
        toast({ title: "خطأ في الاستيراد", description: "حدث خطأ أثناء معالجة الملف. تأكد من أنه ملف JSON صحيح.", variant: "destructive" });
      }
    };
    reader.readAsText(file);
    if(fileInputRef.current) fileInputRef.current.value = '';
  };


  const handleDelete = (log: DailyLog) => {
    setLogToDelete(log);
  }

  const confirmDelete = async () => {
    if (!logToDelete) return;
    await deleteDocumentNonBlocking(doc(firestore, 'daily_logs', logToDelete.id));
    toast({
        title: "تم الحذف",
        description: "تم حذف القيد من السجل بنجاح.",
        variant: 'success'
    });
    setLogToDelete(null);
  }
  
  const handlePrint = () => {
    const printWindow = window.open('/professor-documents/daily-log/print', '_blank');
    printWindow?.focus();
  };


  const isLoading = isUserLoading || loadingInstitutions;

  return (
    <div className="space-y-6">
      <PageHeader title="الكراس اليومي" description="تدوين الحصص اليومية وطباعة السجل." />
       <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileImport}
        className="hidden" 
        accept=".json"
      />
      <Card>
        <CardHeader>
          <CardTitle>إضافة قيد جديد</CardTitle>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <FormField
                  control={form.control}
                  name="institutionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المدرسة</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={loadingInstitutions}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="اختر المدرسة" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {institutions?.map(inst => <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>التاريخ</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? format(field.value, "PPP", { locale: ar }) : <span>اختر تاريخ</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المستوى</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="اختر المستوى" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="أولى ابتدائي">أولى ابتدائي</SelectItem>
                          <SelectItem value="ثانية ابتدائي">ثانية ابتدائي</SelectItem>
                          <SelectItem value="ثالثة ابتدائي">ثالثة ابتدائي</SelectItem>
                          <SelectItem value="رابعة ابتدائي">رابعة ابتدائي</SelectItem>
                          <SelectItem value="خامسة ابتدائي">خامسة ابتدائي</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>توقيت الحصة (من)</FormLabel>
                      <FormControl><Input type="time" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>توقيت الحصة (إلى)</FormLabel>
                      <FormControl><Input type="time" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="field"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الميدان</FormLabel>
                      <FormControl><Input placeholder="الميدان" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
                <FormField
                  control={form.control}
                  name="memoNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم المذكرة</FormLabel>
                      <FormControl><Input placeholder="رقم المذكرة" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="learnings"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>التعلمات</FormLabel>
                      <FormControl><Textarea placeholder="التعلمات" {...field} className="h-32" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="learningContent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>محتوى التعلم</FormLabel>
                      <FormControl><Textarea placeholder="محتوى التعلم" {...field} className="h-32" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="observation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الملاحظة</FormLabel>
                      <FormControl><Textarea placeholder="الملاحظة" {...field} className="h-32" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-start">
              <Button type="submit" disabled={isLoading || form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : <Save />}
                حفظ القيد
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>سجل الكراس اليومي</CardTitle>
            <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleImportClick} disabled={!user}>
                    <History />
                    استيراد السجل القديم
                </Button>
                <Button variant="default" onClick={handlePrint}>
                    <Printer />
                    طباعة السجل
                </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
            {/* رأس الصفحة: نفس ترويسة الوثيقة المطبوعة */}
            <div className="rounded-lg border bg-muted/40 p-4 text-center">
                <p className="text-xs text-muted-foreground">الجمهورية الجزائرية الديمقراطية الشعبية — وزارة التربية الوطنية</p>
                <p className="mt-1 font-semibold">مديرية التربية لولاية {profile?.wilaya || '…'}</p>
                <p className="mt-2 text-lg font-bold">الكراس اليومي — مادة التربية البدنية والرياضية</p>
                <div className="mt-3 flex flex-wrap justify-between gap-2 text-sm">
                    <span>الأستاذ(ة): <b>{professorName || '…'}</b></span>
                    <span>السنة الدراسية: <b className="tabular">{profile?.schoolYear || '…'}</b></span>
                </div>
            </div>

            <div className="overflow-x-auto rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>المدرسة</TableHead>
                            <TableHead>التاريخ</TableHead>
                            <TableHead>الوقت</TableHead>
                            <TableHead>التعلمات</TableHead>
                            <TableHead>محتوى التعلم</TableHead>
                            <TableHead>رقم المذكرة</TableHead>
                            <TableHead>الملاحظة</TableHead>
                            <TableHead className="no-print w-12"><span className="sr-only">العمليات</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loadingLogs ? (
                            <TableRow><TableCell colSpan={8} className="text-center">جاري تحميل السجلات...</TableCell></TableRow>
                        ) : sortedLogs.length > 0 ? (
                            sortedLogs.map(log => (
                                <TableRow key={log.id}>
                                    <TableCell className="font-medium">{institutions?.find(i => i.id === log.institutionId)?.name}</TableCell>
                                    <TableCell className="tabular whitespace-nowrap">{log.date}</TableCell>
                                    <TableCell className="tabular whitespace-nowrap" dir="ltr">{[log.startTime, log.endTime].filter(Boolean).join(' – ')}</TableCell>
                                    <TableCell className="min-w-[160px] whitespace-pre-wrap">{log.learnings}</TableCell>
                                    <TableCell className="min-w-[160px] whitespace-pre-wrap">{log.learningContent}</TableCell>
                                    <TableCell className="tabular">{log.memoNumber}</TableCell>
                                    <TableCell className="min-w-[140px] whitespace-pre-wrap">{log.observation}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" aria-label="حذف القيد" onClick={() => handleDelete(log)}>
                                            <Trash2 className="h-4 w-4"/>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={8} className="text-center h-24 text-muted-foreground">لا توجد سجلات بعد.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>
      
      {logToDelete && (
        <AlertDialog open={!!logToDelete} onOpenChange={(open) => !open && setLogToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
                    <AlertDialogDescription>
                        هذا الإجراء لا يمكن التراجع عنه. سيتم حذف هذا القيد من الكراس اليومي بشكل دائم.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setLogToDelete(null)}>إلغاء</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">تأكيد الحذف</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}

    </div>
  );
}
