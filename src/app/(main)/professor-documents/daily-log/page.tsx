
'use client';

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
import { useCollection, useFirestore, useUser } from "@/firebase";
import { collection, query, where, doc, writeBatch } from "firebase/firestore";
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useMemoFirebase } from "@/firebase/provider";
import type { Institution, DailyLog } from "@/lib/types";
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
  field: z.string().optional(),
  memoNumber: z.string().optional(),
  learnings: z.string().optional(),
  learningContent: z.string().optional(),
  observation: z.string().optional(),
});

type DailyLogFormValues = z.infer<typeof dailyLogSchema>;

export default function DailyLogPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [logToDelete, setLogToDelete] = useState<DailyLog | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: institutions, isLoading: loadingInstitutions } = useCollection<Institution>(
    useMemoFirebase(() => firestore ? collection(firestore, 'institutions') : null, [firestore])
  );
  
  const institutionsMapByName = useMemo(() => {
    return new Map(institutions?.map(inst => [inst.name.toLowerCase(), inst.id]));
  }, [institutions]);

  const userLogsQuery = useMemoFirebase(() => 
    user ? query(collection(firestore, 'daily_logs'), where('userId', '==', user.uid)) : null, 
  [firestore, user]);
  const { data: dailyLogs, isLoading: loadingLogs } = useCollection<DailyLog>(userLogsQuery);

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
        });
        form.reset();
        form.setValue('date', undefined);
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

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const fileContent = e.target?.result;
        if (typeof fileContent !== 'string') {
          toast({ title: "خطأ في الملف", description: "لا يمكن قراءة محتوى الملف.", variant: "destructive" });
          return;
        }
        
        const data = JSON.parse(fileContent);
        const batch = writeBatch(firestore);
        let importedCount = 0;

        const artifacts = data.artifacts || {};
        for (const artifactKey in artifacts) {
          const users = artifacts[artifactKey]?.users || {};
          for (const userId in users) {
             const userLogs = users[userId]?.dailyLogs || {};
             for (const logId in userLogs) {
                const log = userLogs[logId];
                const institutionId = institutionsMapByName.get(String(log.school || '').toLowerCase());
                
                if (institutionId) {
                    const newLogData: Omit<DailyLog, 'id'> = {
                        userId: user.uid,
                        institutionId: institutionId,
                        level: log.level || '',
                        date: log.date, // Assuming YYYY-MM-DD format
                        startTime: log.timeFrom || '',
                        endTime: log.timeTo || '',
                        field: log.field || '',
                        memoNumber: log.noteNumber || '',
                        learnings: log.learning || '',
                        learningContent: log.content || '',
                        observation: log.observation || '',
                    };
                    const newLogRef = doc(collection(firestore, 'daily_logs'));
                    batch.set(newLogRef, newLogData);
                    importedCount++;
                }
             }
          }
        }

        if (importedCount > 0) {
          await batch.commit();
          toast({
            title: "تم الاستيراد بنجاح",
            description: `تم استيراد ${importedCount} قيد/قيود من السجل القديم.`,
          });
        } else {
          toast({
            title: "لم يتم استيراد أي شيء",
            description: "لم يتم العثور على قيود صالحة في الملف أو أن أسماء المدارس غير مطابقة.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Import error:", error);
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
    });
    setLogToDelete(null);
  }

  const isLoading = isUserLoading || loadingInstitutions;

  return (
    <div className="container mx-auto p-4 space-y-8">
       <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileImport}
        className="hidden" 
        accept=".json"
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center font-bold text-primary">إضافة قيد جديد (الكراس اليومي)</CardTitle>
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
              <Button type="submit" disabled={isLoading || form.formState.isSubmitting} className="bg-green-600 hover:bg-green-700">
                {form.formState.isSubmitting ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Save className="me-2 h-4 w-4" />}
                حفظ النموذج
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold text-primary">سجل الكراس اليومي</CardTitle>
            <div className="flex gap-2">
                <Button variant="secondary" className="bg-purple-600 text-white hover:bg-purple-700" onClick={handleImportClick} disabled={!user}>
                    <History className="me-2 h-4 w-4" />
                    استيراد السجل القديم
                </Button>
                <Button variant="default">
                    <Printer className="me-2 h-4 w-4" />
                    طباعة السجل
                </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-green-700">
                        <TableRow>
                            <TableHead className="text-white">المدرسة</TableHead>
                            <TableHead className="text-white">التاريخ</TableHead>
                            <TableHead className="text-white">التوقيت (من)</TableHead>
                            <TableHead className="text-white">التوقيت (إلى)</TableHead>
                            <TableHead className="text-white">المستوى</TableHead>
                            <TableHead className="text-white">الميدان</TableHead>
                            <TableHead className="text-white">التعلمات</TableHead>
                            <TableHead className="text-white">محتوى التعلم</TableHead>
                            <TableHead className="text-white">رقم المذكرة</TableHead>
                            <TableHead className="text-white">الملاحظة</TableHead>
                            <TableHead className="text-white">العمليات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loadingLogs ? (
                            <TableRow><TableCell colSpan={11} className="text-center">جاري تحميل السجلات...</TableCell></TableRow>
                        ) : sortedLogs.length > 0 ? (
                            sortedLogs.map(log => (
                                <TableRow key={log.id}>
                                    <TableCell>{institutions?.find(i => i.id === log.institutionId)?.name}</TableCell>
                                    <TableCell>{log.date}</TableCell>
                                    <TableCell>{log.startTime}</TableCell>
                                    <TableCell>{log.endTime}</TableCell>
                                    <TableCell>{log.level}</TableCell>
                                    <TableCell>{log.field}</TableCell>
                                    <TableCell className="max-w-[150px] truncate">{log.learnings}</TableCell>
                                    <TableCell className="max-w-[150px] truncate">{log.learningContent}</TableCell>
                                    <TableCell>{log.memoNumber}</TableCell>
                                    <TableCell className="max-w-[150px] truncate">{log.observation}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(log)}>
                                            <Trash2 className="h-4 w-4 text-red-600"/>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={11} className="text-center h-24">لا توجد سجلات بعد.</TableCell></TableRow>
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
                    <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">تأكيد الحذف</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}

    </div>
  );
}
