'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useCollection, useFirestore } from "@/firebase";
import { UserPlus, Search, Trash2, Pencil, FileDown, FileUp, FileText, Users, Activity, ShieldOff, User, Printer } from "lucide-react";
import { collection, doc, writeBatch } from "firebase/firestore";
import { useMemoFirebase } from "@/firebase/provider";
import { Input } from "@/components/ui/input";
import type { Student, Department, Institution } from "@/lib/types";
import { useMemo, useState, type FC, useEffect, useRef } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { StatCard } from "@/components/dashboard/stat-card";

const studentSchema = z.object({
  firstName: z.string().min(1, { message: "الإسم مطلوب" }),
  lastName: z.string().min(1, { message: "اللقب مطلوب" }),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female'], { required_error: "الجنس مطلوب" }),
  level: z.string().min(1, { message: "المستوى مطلوب" }),
  institutionId: z.string().min(1, { message: "المؤسسة مطلوبة" }),
  status: z.enum(['active', 'exempt'], { required_error: "الحالة مطلوبة" }),
  departmentId: z.string().optional(),
});

type StudentFormValues = z.infer<typeof studentSchema>;

interface StudentFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    student?: Student | null; 
}

const StudentForm: FC<StudentFormProps> = ({ open, onOpenChange, student }) => {
    const firestore = useFirestore();
    const { toast } = useToast();
    const institutionsQuery = useMemoFirebase(() => collection(firestore, 'institutions'), [firestore]);
    const { data: institutions } = useCollection<Institution>(institutionsQuery);
    const departmentsQuery = useMemoFirebase(() => collection(firestore, 'departments'), [firestore]);
    const { data: departments } = useCollection<Department>(departmentsQuery);

    const form = useForm<StudentFormValues>({
        resolver: zodResolver(studentSchema),
        defaultValues: student ? {
            ...student,
            dateOfBirth: student.dateOfBirth || '',
            departmentId: student.departmentId || '',
        } : {
            firstName: '',
            lastName: '',
            dateOfBirth: '',
            level: '',
            institutionId: '',
            departmentId: '',
        }
    });

    useEffect(() => {
        if (open) {
            if (student) {
                form.reset({
                    ...student,
                    dateOfBirth: student.dateOfBirth || '',
                    departmentId: student.departmentId || '',
                });
            } else {
                form.reset({
                    firstName: '',
                    lastName: '',
                    dateOfBirth: '',
                    level: '',
                    institutionId: '',
                    gender: undefined,
                    status: undefined,
                    departmentId: '',
                });
            }
        }
    }, [student, form, open]);
    

    const onSubmit = (data: StudentFormValues) => {
        const finalData = {
            ...data,
            departmentId: data.departmentId === '___none___' ? null : data.departmentId
        };
        if (student) {
            const studentDocRef = doc(firestore, 'students', student.id);
            setDocumentNonBlocking(studentDocRef, finalData, { merge: true });
            toast({
                title: "تم التحديث بنجاح",
                description: `تم تحديث بيانات التلميذ ${data.firstName} ${data.lastName}.`,
            });
        } else {
            addDocumentNonBlocking(collection(firestore, 'students'), finalData);
            toast({
                title: "تم الحفظ بنجاح",
                description: `تمت إضافة التلميذ ${data.firstName} ${data.lastName}.`,
            });
        }
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{student ? 'تعديل بيانات التلميذ' : 'إضافة تلميذ جديد'}</DialogTitle>
                    <DialogDescription>
                       {student ? 'قم بتحديث التفاصيل أدناه.' : 'أدخل تفاصيل التلميذ الجديد هنا. انقر على "حفظ" عند الانتهاء.'}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                        <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>اللقب</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>الإسم</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="dateOfBirth"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>تاريخ الميلاد</FormLabel>
                                    <FormControl><Input {...field} type="date" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="gender"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>الجنس</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="اختر الجنس" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="male">ذكر</SelectItem>
                                            <SelectItem value="female">أنثى</SelectItem>
                                        </SelectContent>
                                    </Select>
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
                        <FormField
                            control={form.control}
                            name="institutionId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>المؤسسة</FormLabel>
                                     <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="اختر المؤسسة" /></SelectTrigger></FormControl>
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
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>الحالة</FormLabel>
                                     <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="اختر الحالة" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="active">يمارس</SelectItem>
                                            <SelectItem value="exempt">معفي</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="departmentId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>القسم (اختياري)</FormLabel>
                                     <Select onValueChange={field.onChange} value={field.value ?? ''}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="اختر القسم" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="___none___">بلا قسم</SelectItem>
                                            {departments?.map(dept => <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter className="col-span-1 md:col-span-2">
                            <Button type="submit">{student ? 'حفظ التعديلات' : 'حفظ التلميذ'}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}


export default function StudentsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const studentsQuery = useMemoFirebase(() => collection(firestore, 'students'), [firestore]);
  const { data: students, isLoading } = useCollection<Student>(studentsQuery);
  const institutionsQuery = useMemoFirebase(() => collection(firestore, 'institutions'), [firestore]);
  const { data: institutions } = useCollection<Institution>(institutionsQuery);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [institutionFilter, setInstitutionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [isFormOpen, setFormOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

  const stats = useMemo(() => {
    if (!students) return { total: 0, males: 0, females: 0, active: 0, exempt: 0 };
    return {
        total: students.length,
        males: students.filter(s => s.gender === 'male').length,
        females: students.filter(s => s.gender === 'female').length,
        active: students.filter(s => s.status === 'active').length,
        exempt: students.filter(s => s.status === 'exempt').length,
    }
  }, [students]);


  const institutionMap = useMemo(() => {
    if (!institutions) return new Map();
    return new Map(institutions.map(inst => [inst.id, inst.name]));
  }, [institutions]);

  const filteredStudents = useMemo(() => {
    if (!students) return [];
    return students.filter(student =>
      (`${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (levelFilter === 'all' || student.level === levelFilter) &&
      (genderFilter === 'all' || student.gender === genderFilter) &&
      (institutionFilter === 'all' || student.institutionId === institutionFilter) &&
      (statusFilter === 'all' || student.status === statusFilter)
    );
  }, [students, searchTerm, levelFilter, genderFilter, institutionFilter, statusFilter]);

  const handleAddNew = () => {
    setSelectedStudent(null);
    setFormOpen(true);
  };

  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setFormOpen(true);
  };
  
  const handleDelete = (student: Student) => {
      setStudentToDelete(student);
      setDeleteAlertOpen(true);
  };
  
  const confirmDelete = () => {
      if (studentToDelete) {
          const studentDocRef = doc(firestore, 'students', studentToDelete.id);
          deleteDocumentNonBlocking(studentDocRef);
          toast({ title: "تم الحذف", description: `تم حذف التلميذ ${studentToDelete.firstName} ${studentToDelete.lastName}.` });
      }
      setDeleteAlertOpen(false);
      setStudentToDelete(null);
  };

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudents(prev => {
        const newSelection = new Set(prev);
        if (newSelection.has(studentId)) {
            newSelection.delete(studentId);
        } else {
            newSelection.add(studentId);
        }
        return newSelection;
    });
  };

  const handleSelectAll = () => {
      if (selectedStudents.size === filteredStudents.length && filteredStudents.length > 0) {
          setSelectedStudents(new Set());
      } else {
          setSelectedStudents(new Set(filteredStudents.map(s => s.id)));
      }
  };

  const handleDeleteSelected = () => {
    if (confirm(`هل أنت متأكد من أنك تريد حذف ${selectedStudents.size} تلميذ/تلاميذ؟`)) {
        const batch = writeBatch(firestore);
        selectedStudents.forEach(id => {
            const studentDocRef = doc(firestore, 'students', id);
            batch.delete(studentDocRef);
        });
        batch.commit().then(() => {
             toast({ title: "تم الحذف", description: `تم حذف ${selectedStudents.size} تلميذ/تلاميذ بنجاح.` });
             setSelectedStudents(new Set());
        }).catch(err => {
            console.error(err);
            toast({ title: "خطأ", description: "حدث خطأ أثناء حذف التلاميذ.", variant: "destructive" });
        });
    }
  };

  const exportToXLSX = (data: Student[], fileName: string) => {
    const dataToExport = data.map(student => ({
      'اللقب': student.lastName,
      'الإسم': student.firstName,
      'تاريخ الميلاد': student.dateOfBirth ?? '',
      'المستوى': student.level ?? '',
      'الجنس': student.gender === 'male' ? 'ذكر' : 'أنثى',
      'المؤسسة': institutionMap.get(student.institutionId) ?? student.institutionId,
      'الحالة': student.status === 'active' ? 'يمارس' : 'معفي',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "التلاميذ");
    XLSX.writeFile(workbook, fileName);
  };

  const handleExportSelected = () => {
    const selectedData = students?.filter(s => selectedStudents.has(s.id)) || [];
    if (selectedData.length > 0) {
        exportToXLSX(selectedData, 'قائمة_التلاميذ_المحددين.xlsx');
    } else {
        toast({ title: "لا توجد بيانات", description: "الرجاء تحديد التلاميذ للتصدير." });
    }
  };
  
  const handleDownloadAll = () => {
    if (students && students.length > 0) {
        exportToXLSX(students, 'قائمة_كل_التلاميذ.xlsx');
    } else {
        toast({ title: "لا توجد بيانات", description: "لا يوجد تلاميذ مسجلين للتصدير." });
    }
  };

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const importedStudents: any[] = XLSX.utils.sheet_to_json(worksheet);

            const batch = writeBatch(firestore);
            let count = 0;
            
            const institutionsMapByName = new Map(institutions?.map(inst => [inst.name.toLowerCase(), inst.id]));

            importedStudents.forEach(row => {
                const studentData = {
                    lastName: row['اللقب'] || '',
                    firstName: row['الإسم'] || '',
                    dateOfBirth: row['تاريخ الميلاد'] || '',
                    gender: (row['الجنس'] === 'ذكر' ? 'male' : (row['الجنس'] === 'أنثى' ? 'female' : 'male')),
                    level: row['المستوى'] || '',
                    institutionId: institutionsMapByName.get(String(row['المؤسسة'] || '').toLowerCase()) || '',
                    status: (row['الحالة'] === 'يمارس' ? 'active' : (row['الحالة'] === 'معفي' ? 'exempt' : 'active')),
                };

                if (studentData.firstName && studentData.lastName && studentData.institutionId) {
                    const newStudentRef = doc(collection(firestore, 'students'));
                    batch.set(newStudentRef, studentData);
                    count++;
                }
            });

            if (count > 0) {
                batch.commit().then(() => {
                    toast({ title: "تم الاستيراد بنجاح", description: `تمت إضافة ${count} تلميذ/تلاميذ.` });
                }).catch(err => {
                    console.error(err);
                    toast({ title: "خطأ في الاستيراد", description: "حدث خطأ أثناء حفظ التلاميذ. تأكد من صحة أسماء المؤسسات.", variant: "destructive" });
                });
            } else {
                toast({ title: "لا توجد بيانات صالحة للاستيراد", description: "يرجى التحقق من تنسيق الملف ومحتواه.", variant: "destructive" });
            }
        } catch(error) {
            console.error(error);
            toast({ title: "خطأ في قراءة الملف", description: "تأكد من أن الملف بتنسيق XLSX صحيح.", variant: "destructive" });
        }
    };
    reader.readAsBinaryString(file);
    if(fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePrint = () => {
    const params = new URLSearchParams();
    if (levelFilter !== 'all') {
      params.set('level', levelFilter);
    }
    if (institutionFilter !== 'all') {
      params.set('institutionId', institutionFilter);
    }
    const printWindow = window.open(`/students/print?${params.toString()}`, '_blank');
    printWindow?.focus();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2">
        <h1 className="font-bold text-3xl text-center text-primary relative">
          إدارة التلاميذ
          <span className="absolute -bottom-2 start-1/2 -translate-x-1/2 w-20 h-1 bg-accent rounded-full"></span>
        </h1>
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <StatCard title="إجمالي التلاميذ" value={stats.total} icon={Users} />
            <StatCard title="عدد الذكور" value={stats.males} icon={User} />
            <StatCard title="عدد الإناث" value={stats.females} icon={User} />
            <StatCard title="التلاميذ الممارسون" value={stats.active} icon={Activity} />
            <StatCard title="التلاميذ المعفيون" value={stats.exempt} icon={ShieldOff} />
        </div>

      <Card className="shadow-md">
        <CardContent className="p-4 flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
                <Button onClick={handleAddNew} className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full">
                <UserPlus className="me-2" />
                تسجيل تلميذ
                </Button>
                <StudentForm open={isFormOpen} onOpenChange={setFormOpen} student={selectedStudent} />
            <Button onClick={handleDownloadAll} variant="outline" className="rounded-full border-primary text-primary hover:bg-primary/10">
                <FileText className="me-2" />
                تحميل الكل (Excel)
            </Button>
            <Button onClick={handleImportClick} variant="outline" className="rounded-full border-primary text-primary hover:bg-primary/10">
                <FileUp className="me-2" />
                استيراد (Excel)
            </Button>
             <Button onClick={handlePrint} variant="outline" className="rounded-full border-primary text-primary hover:bg-primary/10">
                <Printer className="me-2" />
                طباعة القائمة
            </Button>
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileImport}
                className="hidden" 
                accept=".xlsx"
            />
            {selectedStudents.size > 0 && (
                <>
                    <Button variant="destructive" onClick={handleDeleteSelected} className="rounded-full">
                        <Trash2 className="me-2" />
                        حذف المحدد ({selectedStudents.size})
                    </Button>
                    <Button variant="outline" onClick={handleExportSelected} className="rounded-full border-green-600 text-green-600 hover:bg-green-50">
                        <FileDown className="me-2" />
                        تصدير المحدد ({selectedStudents.size})
                    </Button>
                </>
            )}
            <div className="relative ms-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input 
                placeholder="ابحث عن تلميذ..." 
                className="ps-10 rounded-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 items-center gap-2">
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                    <SelectTrigger><SelectValue placeholder="فلترة حسب المستوى" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">الكل</SelectItem>
                        <SelectItem value="أولى ابتدائي">أولى ابتدائي</SelectItem>
                        <SelectItem value="ثانية ابتدائي">ثانية ابتدائي</SelectItem>
                        <SelectItem value="ثالثة ابتدائي">ثالثة ابتدائي</SelectItem>
                        <SelectItem value="رابعة ابتدائي">رابعة ابتدائي</SelectItem>
                        <SelectItem value="خامسة ابتدائي">خامسة ابتدائي</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={genderFilter} onValueChange={setGenderFilter}>
                    <SelectTrigger><SelectValue placeholder="فلترة حسب الجنس" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">الكل</SelectItem>
                        <SelectItem value="male">ذكر</SelectItem>
                        <SelectItem value="female">أنثى</SelectItem>
                    </SelectContent>
                </Select>
                 <Select value={institutionFilter} onValueChange={setInstitutionFilter}>
                    <SelectTrigger><SelectValue placeholder="فلترة حسب المؤسسة" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">الكل</SelectItem>
                        {institutions?.map(inst => (
                            <SelectItem key={inst.id} value={inst.id}>
                                {inst.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger><SelectValue placeholder="فلترة حسب الحالة" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">الكل</SelectItem>
                        <SelectItem value="active">يمارس</SelectItem>
                        <SelectItem value="exempt">معفي</SelectItem>
                    </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                 <Button onClick={() => {
                     setLevelFilter('all');
                     setGenderFilter('all');
                     setInstitutionFilter('all');
                     setStatusFilter('all');
                     setSearchTerm('');
                 }} variant="ghost">إلغاء الفلاتر</Button>
                  <Badge variant="secondary" className="px-3 py-1">
                    العدد: {filteredStudents.length}
                  </Badge>
                </div>
            </div>
        </CardContent>
      </Card>

      <div className="overflow-x-auto">
          <Table className="bg-card rounded-lg">
            <TableHeader className="bg-primary text-primary-foreground">
              <TableRow>
                <TableHead className="w-[50px] text-center">
                    <Checkbox 
                        checked={filteredStudents.length > 0 && selectedStudents.size === filteredStudents.length}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                    />
                </TableHead>
                <TableHead className="text-white">#</TableHead>
                <TableHead className="text-white">الإسم الكامل</TableHead>
                <TableHead className="text-white">تاريخ الميلاد</TableHead>
                <TableHead className="text-white">المستوى</TableHead>
                <TableHead className="text-white">الجنس</TableHead>
                <TableHead className="text-white">المؤسسة</TableHead>
                <TableHead className="text-white">الحالة</TableHead>
                <TableHead className="text-white text-center">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={9} className="text-center">جاري تحميل التلاميذ...</TableCell></TableRow>}
              {!isLoading && filteredStudents?.map((student, index) => (
                <TableRow key={student.id} className="hover:bg-muted/50" data-state={selectedStudents.has(student.id) ? "selected" : ""}>
                   <TableCell className="text-center">
                    <Checkbox
                        checked={selectedStudents.has(student.id)}
                        onCheckedChange={() => handleSelectStudent(student.id)}
                        aria-label={`Select student ${student.firstName}`}
                    />
                  </TableCell>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">{student.lastName} {student.firstName}</TableCell>
                  <TableCell>{student.dateOfBirth || 'غير محدد'}</TableCell>
                  <TableCell>{student.level ?? 'غير محدد'}</TableCell>
                  <TableCell>
                    {student.gender === 'male' ? 'ذكر' : 'أنثى'}
                  </TableCell>
                  <TableCell>{institutionMap.get(student.institutionId) ?? 'غير محدد'}</TableCell>
                  <TableCell>
                    <Badge variant={student.status === 'active' ? 'default' : 'destructive'} className={student.status === 'active' ? 'bg-green-500' : 'bg-red-500'}>
                      {student.status === 'active' ? 'يمارس' : 'معفي'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-700" onClick={() => handleEdit(student)}>
                      <Pencil className="h-5 w-5" />
                    </Button>
                     <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(student)}>
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
      </div>

       <AlertDialog open={isDeleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
                    <AlertDialogDescription>
                        هذا الإجراء لا يمكن التراجع عنه. سيؤدي هذا إلى حذف بيانات التلميذ بشكل دائم.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDelete}>تأكيد الحذف</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
