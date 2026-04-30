
'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useCollection, useFirestore, useUser } from "@/firebase";
import { UserPlus, Search, Trash2, Pencil, FileDown, FileUp, FileText, Users, Activity, ShieldOff, PersonStanding, Printer, PlusCircle, ArrowRightLeft, Info, Loader2 } from "lucide-react";
import { collection, doc, query, where, writeBatch } from "firebase/firestore";
import { useMemoFirebase } from "@/firebase/provider";
import { Input } from "@/components/ui/input";
import type { Student, Department, Institution } from "@/lib/types";
import { useMemo, useState, type FC, useEffect } from "react";
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { deleteDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { StatCard } from "@/components/dashboard/stat-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const studentSchema = z.object({
  firstName: z.string().min(1, { message: "الإسم مطلوب" }),
  lastName: z.string().min(1, { message: "اللقب مطلوب" }),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female'], { required_error: "الجنس مطلوب" }),
  level: z.string().min(1, { message: "المستوى مطلوب" }),
  institutionId: z.string().min(1, { message: "المؤسسة مطلوبة" }),
  status: z.enum(['active', 'exempt'], { required_error: "الحالة مطلوبة" }),
  departmentId: z.string().optional().nullable(),
});

type StudentFormValues = z.infer<typeof studentSchema>;

const bulkStudentSchema = z.object({
  institutionId: z.string().min(1, { message: "المؤسسة مطلوبة" }),
  level: z.string().min(1, { message: "المستوى مطلوب" }),
  departmentId: z.string().optional().nullable(),
  status: z.enum(['active', 'exempt'], { required_error: "الحالة مطلوبة" }),
  students: z.array(z.object({
    fullName: z.string().min(3, { message: "الاسم الكامل يجب أن يكون 3 أحرف على الأقل" }),
    gender: z.enum(['male', 'female'], { required_error: "الجنس مطلوب" }),
    dateOfBirth: z.string().optional(),
  })).min(1, "يجب إضافة تلميذ واحد على الأقل."),
});
type BulkStudentFormValues = z.infer<typeof bulkStudentSchema>;


const AddStudentForm: FC<{ open: boolean; onOpenChange: (open: boolean) => void }> = ({ open, onOpenChange }) => {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const institutionsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'institutions'), where('userId', '==', user.uid)) : null, [firestore, user]);
    const { data: institutions } = useCollection<Institution>(institutionsQuery);
    const departmentsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'departments'), where('userId', '==', user.uid)) : null, [firestore, user]);
    const { data: departments } = useCollection<Department>(departmentsQuery);

    const bulkForm = useForm<BulkStudentFormValues>({
        resolver: zodResolver(bulkStudentSchema),
        defaultValues: {
            institutionId: '', level: '', departmentId: null, status: 'active',
            students: [{ fullName: '', gender: 'male', dateOfBirth: ''}]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control: bulkForm.control,
        name: "students"
    });

    const selectedInst = bulkForm.watch('institutionId');
    const selectedLevel = bulkForm.watch('level');

    const availableDepartments = useMemo(() => {
        if (!departments || !selectedInst || !selectedLevel) return [];
        return departments.filter(d => d.institutionId === selectedInst && d.level === selectedLevel);
    }, [departments, selectedInst, selectedLevel]);

    useEffect(() => {
        if (open) {
            bulkForm.reset({
                institutionId: '', level: '', departmentId: null, status: 'active',
                students: [{ fullName: '', gender: 'male', dateOfBirth: ''}]
            });
        }
    }, [open, bulkForm]);

    const onBulkSubmit = async (data: BulkStudentFormValues) => {
        if (!user) return;
        const batch = writeBatch(firestore);
        data.students.forEach(s => {
            const parts = s.fullName.trim().split(/\s+/);
            const lastName = parts[0] || '';
            const firstName = parts.slice(1).join(' ') || '';
            if(firstName && lastName) {
                const ref = doc(collection(firestore, 'students'));
                batch.set(ref, {
                    lastName, firstName, gender: s.gender, dateOfBirth: s.dateOfBirth || '',
                    institutionId: data.institutionId, level: data.level, status: data.status,
                    departmentId: data.departmentId === '___none___' ? null : data.departmentId,
                    userId: user.uid,
                });
            }
        });
        await batch.commit();
        toast({ title: "تم الحفظ", description: `تمت إضافة التلاميذ بنجاح.`, variant: 'success' });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
             <DialogContent className="sm:max-w-4xl">
                <DialogHeader><DialogTitle>إضافة تلاميذ جدد</DialogTitle></DialogHeader>
                <Form {...bulkForm}>
                    <form onSubmit={bulkForm.handleSubmit(onBulkSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/30">
                           <FormField control={bulkForm.control} name="institutionId" render={({ field }) => (<FormItem><FormLabel>المؤسسة</FormLabel><Select onValueChange={(val) => { field.onChange(val); bulkForm.setValue('departmentId', null); }} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="المؤسسة" /></SelectTrigger></FormControl><SelectContent>{institutions?.map(inst => <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                           <FormField control={bulkForm.control} name="level" render={({ field }) => (
                               <FormItem><FormLabel className="flex items-center gap-2">المستوى {availableDepartments.length > 1 && <Badge variant="outline" className="bg-yellow-100 text-yellow-800 text-[10px] px-1 h-4 border-yellow-200">{availableDepartments.length} أقسام</Badge>}</FormLabel>
                                   <Select onValueChange={(val) => { field.onChange(val); bulkForm.setValue('departmentId', null); }} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="المستوى" /></SelectTrigger></FormControl><SelectContent><SelectItem value="أولى ابتدائي">أولى ابتدائي</SelectItem><SelectItem value="ثانية ابتدائي">ثانية ابتدائي</SelectItem><SelectItem value="ثالثة ابتدائي">ثالثة ابتدائي</SelectItem><SelectItem value="رابعة ابتدائي">رابعة ابتدائي</SelectItem><SelectItem value="خامسة ابتدائي">خامسة ابتدائي</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                           )} />
                           <FormField control={bulkForm.control} name="departmentId" render={({ field }) => (
                               <FormItem><FormLabel>القسم (اختياري)</FormLabel><Select onValueChange={field.onChange} value={field.value || '___none___'} disabled={!selectedLevel || !selectedInst}><FormControl><SelectTrigger><SelectValue placeholder="اختر القسم" /></SelectTrigger></FormControl><SelectContent><SelectItem value="___none___">بلا قسم (عام)</SelectItem>{availableDepartments.map(dept => <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                           )} />
                           <FormField control={bulkForm.control} name="status" render={({ field }) => (<FormItem><FormLabel>الحالة</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="الحالة" /></SelectTrigger></FormControl><SelectContent><SelectItem value="active">يمارس</SelectItem><SelectItem value="exempt">معفي</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                        </div>
                        <ScrollArea className="h-60 w-full rounded-md border p-4">
                            <div className="space-y-4">
                               {fields.map((field, index) => (
                                   <div key={field.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 items-start border-b pb-4">
                                       <FormField control={bulkForm.control} name={`students.${index}.fullName`} render={({ field }) => (<FormItem><FormLabel>الاسم الكامل</FormLabel><FormControl><Input placeholder="اللقب ثم الإسم" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                       <FormField control={bulkForm.control} name={`students.${index}.gender`} render={({ field }) => (<FormItem><FormLabel>الجنس</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="male">ذكر</SelectItem><SelectItem value="female">أنثى</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                                       <FormField control={bulkForm.control} name={`students.${index}.dateOfBirth`} render={({ field }) => (<FormItem><FormLabel>تاريخ الميلاد</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                       <Button type="button" variant="ghost" size="icon" className="text-red-500 mt-8" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
                                   </div>
                               ))}
                            </div>
                        </ScrollArea>
                        <Button type="button" variant="outline" onClick={() => append({ fullName: '', gender: 'male', dateOfBirth: '' })}><PlusCircle className="me-2 h-4 w-4" /> إضافة تلميذ آخر</Button>
                        <DialogFooter><Button type="submit" disabled={bulkForm.formState.isSubmitting}>حفظ التلاميذ</Button></DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

const EditStudentForm: FC<{ open: boolean; onOpenChange: (open: boolean) => void; student: Student }> = ({ open, onOpenChange, student }) => {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const institutionsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'institutions'), where('userId', '==', user.uid)) : null, [firestore, user]);
    const { data: institutions } = useCollection<Institution>(institutionsQuery);
    const departmentsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'departments'), where('userId', '==', user.uid)) : null, [firestore, user]);
    const { data: departments } = useCollection<Department>(departmentsQuery);

    const form = useForm<StudentFormValues>({
        resolver: zodResolver(studentSchema),
        defaultValues: { ...student, dateOfBirth: student.dateOfBirth || '', departmentId: student.departmentId || null }
    });

    useEffect(() => {
        if (open) {
            form.reset({ ...student, dateOfBirth: student.dateOfBirth || '', departmentId: student.departmentId || null });
        }
    }, [student, open, form]);

    const onSubmit = (data: StudentFormValues) => {
        if (!user) return;
        const finalData = { ...data, departmentId: data.departmentId === '___none___' ? null : data.departmentId, userId: user.uid };
        const studentDocRef = doc(firestore, 'students', student.id);
        setDocumentNonBlocking(studentDocRef, finalData, { merge: true });
        toast({ title: "تم التحديث", description: `تم تحديث بيانات التلميذ.`, variant: 'success' });
        onOpenChange(false);
    };

    const singleAvailableDepts = departments?.filter(d => d.institutionId === form.watch('institutionId') && d.level === form.watch('level')) || [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader><DialogTitle>تعديل بيانات التلميذ</DialogTitle></DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                        <FormField control={form.control} name="lastName" render={({ field }) => (<FormItem><FormLabel>اللقب</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="firstName" render={({ field }) => (<FormItem><FormLabel>الإسم</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="dateOfBirth" render={({ field }) => (<FormItem><FormLabel>تاريخ الميلاد</FormLabel><FormControl><Input {...field} type="date" /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="gender" render={({ field }) => (<FormItem><FormLabel>الجنس</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="الجنس" /></SelectTrigger></FormControl><SelectContent><SelectItem value="male">ذكر</SelectItem><SelectItem value="female">أنثى</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="level" render={({ field }) => (<FormItem><FormLabel>المستوى</FormLabel><Select onValueChange={(val) => { field.onChange(val); form.setValue('departmentId', null); }} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="المستوى" /></SelectTrigger></FormControl><SelectContent><SelectItem value="أولى ابتدائي">أولى ابتدائي</SelectItem><SelectItem value="ثانية ابتدائي">ثانية ابتدائي</SelectItem><SelectItem value="ثالثة ابتدائي">ثالثة ابتدائي</SelectItem><SelectItem value="رابعة ابتدائي">رابعة ابتدائي</SelectItem><SelectItem value="خامسة ابتدائي">خامسة ابتدائي</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="institutionId" render={({ field }) => (<FormItem><FormLabel>المؤسسة</FormLabel><Select onValueChange={(val) => { field.onChange(val); form.setValue('departmentId', null); }} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="المؤسسة" /></SelectTrigger></FormControl><SelectContent>{institutions?.map(inst => <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>الحالة</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="الحالة" /></SelectTrigger></FormControl><SelectContent><SelectItem value="active">يمارس</SelectItem><SelectItem value="exempt">معفي</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="departmentId" render={({ field }) => (
                            <FormItem><FormLabel>القسم (اختياري)</FormLabel><Select onValueChange={field.onChange} value={field.value || '___none___'}><FormControl><SelectTrigger><SelectValue placeholder="اختر القسم" /></SelectTrigger></FormControl><SelectContent><SelectItem value="___none___">بلا قسم</SelectItem>{singleAvailableDepts.map(dept => <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                        )} />
                        <DialogFooter className="col-span-1 md:col-span-2"><Button type="submit">حفظ التعديلات</Button></DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

function TransferStudentsTab({ students, institutions, departments }: { students: Student[] | null, institutions: Institution[] | null, departments: Department[] | null }) {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const [srcInst, setSrcInst] = useState<string>('');
    const [srcLevel, setSrcLevel] = useState<string>('');
    const [srcDept, setSrcDept] = useState<string>('');
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
    const [destInst, setDestInst] = useState<string>('');
    const [destLevel, setDestLevel] = useState<string>('');
    const [destDept, setDestDept] = useState<string>('');
    const [isTransferring, setIsTransferring] = useState(false);

    const sourceStudents = useMemo(() => {
        if (!students) return [];
        return students.filter(s => (srcInst === '' || s.institutionId === srcInst) && (srcLevel === '' || s.level === srcLevel) && (srcDept === '' || (srcDept === 'all_depts' ? true : (srcDept === 'none' ? !s.departmentId : s.departmentId === srcDept)))).sort((a,b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`));
    }, [students, srcInst, srcLevel, srcDept]);

    const handleTransfer = async () => {
        if (!user || selectedStudentIds.size === 0 || !destInst || !destLevel) return;
        setIsTransferring(true);
        const batch = writeBatch(firestore);
        selectedStudentIds.forEach(id => {
            batch.update(doc(firestore, 'students', id), { institutionId: destInst, level: destLevel, departmentId: destDept === 'none' || destDept === '' ? null : destDept });
        });
        await batch.commit();
        toast({ title: "تم التحويل", description: `تم نقل ${selectedStudentIds.size} تلميذ بنجاح.`, variant: 'success' });
        setSelectedStudentIds(new Set());
        setIsTransferring(false);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-md">
                <CardHeader className="bg-primary/5 border-b"><CardTitle className="text-lg flex items-center gap-2">المصدر (الحالي)</CardTitle></CardHeader>
                <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <Select value={srcInst} onValueChange={(val) => { setSrcInst(val); setSrcDept(''); setSelectedStudentIds(new Set()); }}><SelectTrigger><SelectValue placeholder="المؤسسة" /></SelectTrigger><SelectContent>{institutions?.map(inst => <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>)}</SelectContent></Select>
                        <Select value={srcLevel} onValueChange={(val) => { setSrcLevel(val); setSrcDept(''); setSelectedStudentIds(new Set()); }}><SelectTrigger><SelectValue placeholder="المستوى" /></SelectTrigger><SelectContent><SelectItem value="أولى ابتدائي">أولى ابتدائي</SelectItem><SelectItem value="ثانية ابتدائي">ثانية ابتدائي</SelectItem><SelectItem value="ثالثة ابتدائي">ثالثة ابتدائي</SelectItem><SelectItem value="رابعة ابتدائي">رابعة ابتدائي</SelectItem><SelectItem value="خامسة ابتدائي">خامسة ابتدائي</SelectItem></SelectContent></Select>
                        <Select value={srcDept} onValueChange={(val) => { setSrcDept(val); setSelectedStudentIds(new Set()); }}><SelectTrigger><SelectValue placeholder="القسم" /></SelectTrigger><SelectContent><SelectItem value="all_depts">الكل</SelectItem><SelectItem value="none">بدون قسم</SelectItem>{departments?.filter(d => d.institutionId === srcInst && d.level === srcLevel).map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select>
                    </div>
                    <div className="border rounded-md overflow-hidden">
                        <div className="bg-muted/50 p-2 border-b flex justify-between items-center"><div className="flex items-center gap-2"><Checkbox checked={sourceStudents.length > 0 && selectedStudentIds.size === sourceStudents.length} onCheckedChange={() => setSelectedStudentIds(selectedStudentIds.size === sourceStudents.length ? new Set() : new Set(sourceStudents.map(s => s.id)))} /><span className="text-sm font-medium">تحديد الكل</span></div><Badge variant="outline">{selectedStudentIds.size}</Badge></div>
                        <ScrollArea className="h-[400px]">{sourceStudents.length > 0 ? <div className="divide-y">{sourceStudents.map(s => <div key={s.id} className="flex items-center gap-3 p-3 hover:bg-muted/30"><Checkbox checked={selectedStudentIds.has(s.id)} onCheckedChange={() => { const n = new Set(selectedStudentIds); if (n.has(s.id)) n.delete(s.id); else n.add(s.id); setSelectedStudentIds(n); }} /><div className="flex flex-col"><span className="font-medium text-sm">{s.lastName} {s.firstName}</span></div></div>)}</div> : <div className="p-8 text-center text-muted-foreground text-sm">لا يوجد تلاميذ.</div>}</ScrollArea>
                    </div>
                </CardContent>
            </Card>
            <Card className="shadow-md">
                <CardHeader className="bg-accent/10 border-b"><CardTitle className="text-lg">الوجهة (الجديدة)</CardTitle></CardHeader>
                <CardContent className="p-6 space-y-6">
                    <Select value={destInst} onValueChange={(val) => { setDestInst(val); setDestDept(''); }}><SelectTrigger className="h-12"><SelectValue placeholder="اختر المؤسسة" /></SelectTrigger><SelectContent>{institutions?.map(inst => <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>)}</SelectContent></Select>
                    <Select value={destLevel} onValueChange={(val) => { setDestLevel(val); setDestDept(''); }}><SelectTrigger className="h-12"><SelectValue placeholder="اختر المستوى" /></SelectTrigger><SelectContent><SelectItem value="أولى ابتدائي">أولى ابتدائي</SelectItem><SelectItem value="ثانية ابتدائي">ثانية ابتدائي</SelectItem><SelectItem value="ثالثة ابتدائي">ثالثة ابتدائي</SelectItem><SelectItem value="رابعة ابتدائي">رابعة ابتدائي</SelectItem><SelectItem value="خامسة ابتدائي">خامسة ابتدائي</SelectItem></SelectContent></Select>
                    <Select value={destDept} onValueChange={setDestDept} disabled={!destLevel || !destInst}><SelectTrigger className="h-12"><SelectValue placeholder="اختر القسم" /></SelectTrigger><SelectContent><SelectItem value="none">بدون قسم (عام)</SelectItem>{departments?.filter(d => d.institutionId === destInst && d.level === destLevel).map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select>
                    <Button className="w-full h-12 text-base font-bold bg-accent text-accent-foreground" disabled={selectedStudentIds.size === 0 || !destInst || !destLevel || isTransferring} onClick={handleTransfer}>{isTransferring ? "جاري النقل..." : "تنفيذ عملية التحويل"}</Button>
                </CardContent>
            </Card>
        </div>
    );
}

export default function StudentsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const { data: students, isLoading: loadingStudents } = useCollection<Student>(useMemoFirebase(() => user ? query(collection(firestore, 'students'), where('userId', '==', user.uid)) : null, [firestore, user]));
  const { data: institutions } = useCollection<Institution>(useMemoFirebase(() => user ? query(collection(firestore, 'institutions'), where('userId', '==', user.uid)) : null, [firestore, user]));
  const { data: departments } = useCollection<Department>(useMemoFirebase(() => user ? query(collection(firestore, 'departments'), where('userId', '==', user.uid)) : null, [firestore, user]));

  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [instFilter, setInstFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');

  const [isAddOpen, setAddOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

  const filteredStudents = useMemo(() => {
    if (!students) return [];
    return students.filter(s => 
      (`${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (levelFilter === 'all' || s.level === levelFilter) &&
      (instFilter === 'all' || s.institutionId === instFilter) &&
      (deptFilter === 'all' || (deptFilter === 'none' ? !s.departmentId : s.departmentId === deptFilter))
    ).sort((a,b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`));
  }, [students, searchTerm, levelFilter, instFilter, deptFilter]);

  const confirmDelete = async () => {
      if (studentToDelete) {
          await deleteDocumentNonBlocking(doc(firestore, 'students', studentToDelete.id));
          toast({ title: "تم الحذف", variant: 'success' });
          setStudentToDelete(null);
      }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col items-center gap-2"><h1 className="font-bold text-3xl text-primary relative">إدارة التلاميذ<span className="absolute -bottom-2 start-1/2 -translate-x-1/2 w-20 h-1 bg-accent rounded-full"></span></h1></div>
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="إجمالي التلاميذ" value={students?.length || 0} icon={Users} />
            <StatCard title="الذكور" value={students?.filter(s => s.gender === 'male').length || 0} icon={PersonStanding} color="bg-blue-500" />
            <StatCard title="الإناث" value={students?.filter(s => s.gender === 'female').length || 0} icon={PersonStanding} color="bg-pink-500" />
            <StatCard title="المؤسسات" value={institutions?.length || 0} icon={Users} color="bg-orange-500" />
        </div>
        <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-6 h-12"><TabsTrigger value="list" className="gap-2"><Users className="h-4 w-4" /> قائمة التلاميذ</TabsTrigger><TabsTrigger value="transfer" className="gap-2"><ArrowRightLeft className="h-4 w-4" /> تحويل التلاميذ</TabsTrigger></TabsList>
            <TabsContent value="list" className="space-y-4">
                <Card className="shadow-md"><CardContent className="p-4 space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <Button onClick={() => setAddOpen(true)} className="bg-accent text-accent-foreground rounded-full"><UserPlus className="me-2" /> تسجيل تلاميذ</Button>
                            <div className="relative ms-auto"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input placeholder="ابحث..." className="ps-10 rounded-full w-full md:w-64" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <Select value={instFilter} onValueChange={(v) => { setInstFilter(v); setDeptFilter('all'); }}><SelectTrigger><SelectValue placeholder="فلترة حسب المؤسسة" /></SelectTrigger><SelectContent><SelectItem value="all">كل المؤسسات</SelectItem>{institutions?.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent></Select>
                            <Select value={levelFilter} onValueChange={(v) => { setLevelFilter(v); setDeptFilter('all'); }}><SelectTrigger><SelectValue placeholder="فلترة حسب المستوى" /></SelectTrigger><SelectContent><SelectItem value="all">كل المستويات</SelectItem><SelectItem value="أولى ابتدائي">أولى ابتدائي</SelectItem><SelectItem value="ثانية ابتدائي">ثانية ابتدائي</SelectItem><SelectItem value="ثالثة ابتدائي">ثالثة ابتدائي</SelectItem><SelectItem value="رابعة ابتدائي">رابعة ابتدائي</SelectItem><SelectItem value="خامسة ابتدائي">خامسة ابتدائي</SelectItem></SelectContent></Select>
                            <Select value={deptFilter} onValueChange={setDeptFilter} disabled={instFilter === 'all' || levelFilter === 'all'}><SelectTrigger><SelectValue placeholder="فلترة حسب القسم" /></SelectTrigger><SelectContent><SelectItem value="all">كل الأقسام</SelectItem><SelectItem value="none">بدون قسم</SelectItem>{departments?.filter(d => d.institutionId === instFilter && d.level === levelFilter).map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select>
                        </div>
                    </CardContent></Card>
                
                <div className="border rounded-lg overflow-hidden bg-card shadow-md">
                    <ScrollArea className="h-[500px]">
                        <Table>
                            <TableHeader className="bg-primary sticky top-0 z-20">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="text-white text-center w-[120px]">الإجراءات</TableHead>
                                    <TableHead className="text-white">الحالة</TableHead>
                                    <TableHead className="text-white">القسم</TableHead>
                                    <TableHead className="text-white">المستوى</TableHead>
                                    <TableHead className="text-white">اللقب والإسم</TableHead>
                                    <TableHead className="text-white">#</TableHead>
                                    <TableHead className="w-[50px] text-center">
                                        <Checkbox checked={filteredStudents.length > 0 && selectedStudents.size === filteredStudents.length} onCheckedChange={() => setSelectedStudents(selectedStudents.size === filteredStudents.length ? new Set() : new Set(filteredStudents.map(s => s.id)))} className="border-white" />
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                            {loadingStudents ? (
                                <TableRow><TableCell colSpan={7} className="text-center h-40"><Loader2 className="animate-spin h-8 w-8 mx-auto text-primary" /></TableCell></TableRow>
                            ) : filteredStudents.length > 0 ? (
                                filteredStudents.map((s, idx) => (
                                    <TableRow key={s.id} className="hover:bg-muted/30">
                                        <TableCell className="text-center">
                                            <Button variant="ghost" size="icon" className="text-blue-600 h-8 w-8" onClick={() => { setStudentToEdit(s); setEditOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="text-red-500 h-8 w-8" onClick={() => setStudentToDelete(s)}><Trash2 className="h-4 w-4" /></Button>
                                        </TableCell>
                                        <TableCell><Badge variant={s.status === 'active' ? 'default' : 'destructive'} className={s.status === 'active' ? 'bg-green-500' : ''}>{s.status === 'active' ? 'يمارس' : 'معفي'}</Badge></TableCell>
                                        <TableCell>{departments?.find(d => d.id === s.departmentId)?.name || <span className="text-muted-foreground text-xs">غير معين</span>}</TableCell>
                                        <TableCell><Badge variant="outline">{s.level}</Badge></TableCell>
                                        <TableCell className="font-semibold">{s.lastName} {s.firstName}</TableCell>
                                        <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                                        <TableCell className="text-center">
                                            <Checkbox checked={selectedStudents.has(s.id)} onCheckedChange={() => { const n = new Set(selectedStudents); if (n.has(s.id)) n.delete(s.id); else n.add(s.id); setSelectedStudents(n); }} />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={7} className="text-center h-40 text-muted-foreground">لا يوجد تلاميذ مطابقين للفلاتر المحددة.</TableCell></TableRow>
                            )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </div>
            </TabsContent>
            <TabsContent value="transfer"><TransferStudentsTab students={students} institutions={institutions} departments={departments} /></TabsContent>
        </Tabs>
        <AddStudentForm open={isAddOpen} onOpenChange={setAddOpen} />
        {studentToEdit && <EditStudentForm open={isEditOpen} onOpenChange={setEditOpen} student={studentToEdit} />}
        <AlertDialog open={!!studentToDelete} onOpenChange={() => setStudentToDelete(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>تأكيد الحذف</AlertDialogTitle><AlertDialogDescription>هل أنت متأكد من حذف هذا التلميذ نهائياً؟</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="bg-destructive text-white">تأكيد الحذف</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
}
