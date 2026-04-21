
'use client';

import { useState, useMemo, useEffect, Suspense, FC, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getCriteriaFor } from '@/lib/evaluation-criteria';
import type { EvaluationCriteria } from '@/lib/types';
import { Save, Loader2, Printer, FileDown, PlusCircle, Trash2, Pencil, Users, User, X, ExternalLink, FileUp } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';


// Simplified student type for local state
type LocalStudent = {
    id: string;
    firstName: string;
    lastName: string;
};

const studentFormSchema = z.object({
  firstName: z.string().min(1, "الإسم الأول مطلوب"),
  lastName: z.string().min(1, "اللقب مطلوب"),
});
type StudentFormValues = z.infer<typeof studentFormSchema>;


const StudentDialog: FC<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
    student: LocalStudent | null;
    onSave: (student: LocalStudent) => void;
}> = ({ open, onOpenChange, student, onSave }) => {
    const form = useForm<StudentFormValues>({
        resolver: zodResolver(studentFormSchema),
        defaultValues: { firstName: '', lastName: '' },
    });

    useEffect(() => {
        if (student) {
            form.reset(student);
        } else {
            form.reset({ firstName: '', lastName: '' });
        }
    }, [student, form, open]);

    const onSubmit = (data: StudentFormValues) => {
        onSave({
            id: student?.id || new Date().toISOString(),
            ...data
        });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{student ? 'تعديل تلميذ' : 'إضافة تلميذ'}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                                <FormItem><FormLabel>اللقب</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                                <FormItem><FormLabel>الإسم</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit">حفظ</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

const bulkStudentAddSchema = z.object({
  students: z.array(z.object({
    fullName: z.string().min(3, "الاسم يجب أن يكون 3 أحرف على الأقل"),
  })).min(1, "يجب إضافة تلميذ واحد على الأقل"),
});
type BulkStudentAddFormValues = z.infer<typeof bulkStudentAddSchema>;

const BulkStudentDialog: FC<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (students: { fullName: string }[]) => void;
}> = ({ open, onOpenChange, onSave }) => {
    const { toast } = useToast();
    const form = useForm<BulkStudentAddFormValues>({
        resolver: zodResolver(bulkStudentAddSchema),
        defaultValues: { students: [{ fullName: '' }] },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "students"
    });

    useEffect(() => {
        if(open) {
            form.reset({ students: [{ fullName: '' }] });
        }
    }, [open, form]);

    const onSubmit = (data: BulkStudentAddFormValues) => {
        onSave(data.students);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>إضافة تلاميذ جدد</DialogTitle>
                    <DialogDescription>أدخل الأسماء الكاملة للتلاميذ. سيتم تحليل اللقب والإسم تلقائياً.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <ScrollArea className="h-60 w-full rounded-md border p-4">
                            <div className="space-y-4">
                               {fields.map((field, index) => (
                                   <div key={field.id} className="flex gap-2 items-end">
                                       <FormField
                                            control={form.control}
                                            name={`students.${index}.fullName`}
                                            render={({ field }) => (
                                                <FormItem className="flex-grow">
                                                    <FormLabel className={cn(index !== 0 && "sr-only")}>الاسم الكامل (اللقب ثم الإسم)</FormLabel>
                                                    <FormControl><Input placeholder="مثال: بن علي محمد" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Button type="button" variant="ghost" size="icon" className="text-red-500 shrink-0" onClick={() => remove(index)}>
                                           <Trash2 className="h-4 w-4" />
                                        </Button>
                                   </div>
                               ))}
                            </div>
                        </ScrollArea>
                         <Button type="button" variant="outline" size="sm" onClick={() => append({ fullName: '' })}>
                           <PlusCircle className="me-2 h-4 w-4" /> إضافة تلميذ آخر
                        </Button>

                        <DialogFooter>
                            <Button type="submit">حفظ التلاميذ</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};



function EvaluationDemoPage() {
    const { toast } = useToast();
    const [level, setLevel] = useState<string>('');
    const [semester, setSemester] = useState<string>('');
    const [students, setStudents] = useState<LocalStudent[]>([{id: '1', lastName: 'تلميذ', firstName: 'تجريبي'}]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Student Dialog State
    const [isStudentDialogOpen, setStudentDialogOpen] = useState(false);
    const [isBulkAddOpen, setBulkAddOpen] = useState(false);
    const [studentToEdit, setStudentToEdit] = useState<LocalStudent | null>(null);
    const [studentToDelete, setStudentToDelete] = useState<LocalStudent | null>(null);

    const handleSaveStudent = (studentData: LocalStudent) => {
        setStudents(prev => {
            const exists = prev.some(s => s.id === studentData.id);
            if (exists) {
                return prev.map(s => s.id === studentData.id ? studentData : s);
            }
            return [...prev, studentData];
        });
    };
    
    const handleOpenStudentDialog = (student: LocalStudent | null = null) => {
        setStudentToEdit(student);
        setStudentDialogOpen(true);
    }

    const handleSaveBulkStudents = (newStudents: { fullName: string }[]) => {
        const studentsToAdd: LocalStudent[] = newStudents
            .map((s, index) => {
                const nameParts = s.fullName.trim().split(/\s+/);
                const lastName = nameParts[0] || '';
                const firstName = nameParts.slice(1).join(' ') || '';
                if (!firstName || !lastName) return null;
                return {
                    id: `${new Date().toISOString()}_${index}`,
                    lastName,
                    firstName,
                };
            })
            .filter((s): s is LocalStudent => s !== null);

        if (studentsToAdd.length > 0) {
            setStudents(prev => [...prev, ...studentsToAdd]);
            toast({
                title: 'تمت الإضافة',
                description: `تمت إضافة ${studentsToAdd.length} تلميذ/تلاميذ بنجاح.`,
            });
        }
    };
    
    const confirmDeleteStudent = () => {
        if (studentToDelete) {
            setStudents(prev => prev.filter(s => s.id !== studentToDelete.id));
            setStudentToDelete(null);
        }
    };
    
    const handleViewTable = () => {
        if (!level || !semester) {
            toast({
                title: "بيانات ناقصة",
                description: "الرجاء اختيار الفصل والمستوى الدراسي أولاً.",
                variant: "destructive"
            });
            return;
        }
        if (students.length === 0) {
             toast({
                title: "لا يوجد تلاميذ",
                description: "الرجاء إضافة تلميذ واحد على الأقل.",
                variant: "destructive"
            });
            return;
        }
        
        try {
            const demoData = { students, level, semester };
            sessionStorage.setItem('evaluationDemoData', JSON.stringify(demoData));
            window.open('/evaluations-demo/view', '_blank');
        } catch (error) {
            console.error("Failed to save to sessionStorage", error);
            toast({ title: "خطأ", description: "لم نتمكن من فتح نافذة التقييم.", variant: "destructive" });
        }
    };
    
    const handleImportClick = () => {
      fileInputRef.current?.click();
    };

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!level) {
            toast({
                title: "خطأ",
                description: "الرجاء تحديد المستوى الدراسي أولاً قبل استيراد الملف.",
                variant: "destructive",
            });
            if(fileInputRef.current) fileInputRef.current.value = ''; // Reset file input
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array' });
                
                const levelToSheetMap: { [key: string]: string[] } = {
                    'أولى ابتدائي': ['ت البدنية والرياضية 1', 'Worksheet'],
                    'ثانية ابتدائي': ['ت البدنية والرياضية 2'],
                    'ثالثة ابتدائي': ['ت البدنية والرياضية 3'],
                    'رابعة ابتدائي': ['ت البدنية والرياضية 4'],
                    'خامسة ابتدائي': ['ت البدنية والرياضية 5'],
                };
                
                const possibleSheetNames = levelToSheetMap[level] || [];
                const sheetName = workbook.SheetNames.find(name => possibleSheetNames.some(pn => name.includes(pn)));

                if (!sheetName) {
                    toast({
                        title: "لم يتم العثور على الصفحة",
                        description: `لم نتمكن من العثور على صفحة "${level}" في الملف.`,
                        variant: "destructive",
                    });
                    return;
                }

                const worksheet = workbook.Sheets[sheetName];
                const importedData: any[] = XLSX.utils.sheet_to_json(worksheet);

                const importedStudents: LocalStudent[] = importedData
                    .map((row, index) => {
                        const lastName = row['اللقب'];
                        const firstName = row['الإسم'];

                        if (lastName && firstName) {
                            return {
                                id: `${new Date().toISOString()}_${index}`, // More robust ID
                                lastName: String(lastName),
                                firstName: String(firstName),
                            };
                        }
                        return null;
                    })
                    .filter((student): student is LocalStudent => student !== null);

                if (importedStudents.length > 0) {
                    setStudents(importedStudents);
                    toast({
                        title: "تم الاستيراد بنجاح",
                        description: `تم استيراد ${importedStudents.length} تلميذ/تلاميذ من مستوى "${level}".`,
                    });
                } else {
                    toast({
                        title: "لا توجد بيانات",
                        description: "لم يتم العثور على تلاميذ بأسماء وألقاب صالحة في الصفحة المحددة.",
                        variant: "destructive",
                    });
                }

            } catch (error) {
                console.error("File import error:", error);
                toast({
                    title: "خطأ في معالجة الملف",
                    description: "حدث خطأ أثناء قراءة الملف. يرجى التأكد من أنه ملف Excel صالح.",
                    variant: "destructive",
                });
            } finally {
                if(fileInputRef.current) fileInputRef.current.value = ''; // Reset file input
            }
        };
        reader.readAsArrayBuffer(file);
    };


    return (
        <div className="space-y-6">
             <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileImport}
                className="hidden"
                accept=".xlsx, .xls"
            />
             <StudentDialog open={isStudentDialogOpen} onOpenChange={setStudentDialogOpen} student={studentToEdit} onSave={handleSaveStudent} />
             <BulkStudentDialog open={isBulkAddOpen} onOpenChange={setBulkAddOpen} onSave={handleSaveBulkStudents} />
             <AlertDialog open={!!studentToDelete} onOpenChange={() => setStudentToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>تأكيد الحذف</AlertDialogTitle><AlertDialogDescription>هل أنت متأكد من حذف التلميذ {studentToDelete?.lastName} {studentToDelete?.firstName}؟</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteStudent}>حذف</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
             </AlertDialog>

            <div className="text-center no-print">
                <h1 className="text-3xl font-bold text-primary">محاكي التقييم المستمر</h1>
                <p className="text-muted-foreground mt-2">أداة لتجربة إدخال وطباعة كشوف التقييم. البيانات لا يتم حفظها.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="no-print">
                    <CardHeader><CardTitle>1. إعداد التقييم</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <Select onValueChange={setLevel} value={level}>
                            <SelectTrigger><SelectValue placeholder="اختر المستوى الدراسي..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="أولى ابتدائي">أولى ابتدائي</SelectItem><SelectItem value="ثانية ابتدائي">ثانية ابتدائي</SelectItem><SelectItem value="ثالثة ابتدائي">ثالثة ابتدائي</SelectItem>
                                <SelectItem value="رابعة ابتدائي">رابعة ابتدائي</SelectItem><SelectItem value="خامسة ابتدائي">خامسة ابتدائي</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select onValueChange={setSemester} value={semester}>
                            <SelectTrigger><SelectValue placeholder="اختر الفصل الدراسي..." /></SelectTrigger>
                            <SelectContent><SelectItem value="1">الفصل الأول</SelectItem><SelectItem value="2">الفصل الثاني</SelectItem><SelectItem value="3">الفصل الثالث</SelectItem></SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                <Card className="no-print">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>2. إدارة التلاميذ ({students.length})</CardTitle>
                             <div className="flex gap-2">
                                <Button size="sm" onClick={handleImportClick} variant="outline"><FileUp className="me-2" />استيراد</Button>
                                <Button size="sm" onClick={() => setBulkAddOpen(true)}><PlusCircle className="me-2" />إضافة</Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="max-h-48 overflow-y-auto">
                        {students.length > 0 ? (
                            <div className="space-y-2">
                                {students.map(s => (
                                    <div key={s.id} className="flex items-center justify-between bg-gray-100 p-2 rounded-md">
                                        <p>{s.lastName} {s.firstName}</p>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenStudentDialog(s)}><Pencil className="h-4 w-4 text-blue-600" /></Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setStudentToDelete(s)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-muted-foreground text-center">الرجاء إضافة تلاميذ.</p>}
                    </CardContent>
                    <CardFooter className="pt-4">
                        <Button onClick={handleViewTable} className="w-full" disabled={!level || !semester}>
                            <ExternalLink className="me-2" />
                            عرض جدول التقييم
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}

export default function Page() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <EvaluationDemoPage />
        </Suspense>
    );
}

    