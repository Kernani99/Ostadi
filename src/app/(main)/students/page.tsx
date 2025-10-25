'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useCollection, useFirestore } from "@/firebase";
import { UserPlus, Search, Trash2, Pencil, FileDown, FileUp, FileText } from "lucide-react";
import { collection, doc, writeBatch } from "firebase/firestore";
import { useMemoFirebase } from "@/firebase/provider";
import { Input } from "@/components/ui/input";
import type { Student } from "@/lib/types";
import { useMemo, useState, type FC, useEffect, useRef } from "react";
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
import Papa from 'papaparse';

const studentSchema = z.object({
  firstName: z.string().min(1, { message: "الإسم مطلوب" }),
  lastName: z.string().min(1, { message: "اللقب مطلوب" }),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female'], { required_error: "الجنس مطلوب" }),
  level: z.string().min(1, { message: "المستوى مطلوب" }),
  institutionId: z.string().min(1, { message: "المؤسسة مطلوبة" }),
  status: z.enum(['active', 'exempt'], { required_error: "الحالة مطلوبة" }),
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
    const { data: institutions } = useCollection(institutionsQuery);

    const form = useForm<StudentFormValues>({
        resolver: zodResolver(studentSchema),
        defaultValues: student ? {
            ...student,
            dateOfBirth: student.dateOfBirth || '',
        } : {
            firstName: '',
            lastName: '',
            dateOfBirth: '',
            level: '',
            institutionId: '',
        }
    });

    useEffect(() => {
        if (student) {
            form.reset({
                ...student,
                dateOfBirth: student.dateOfBirth || '',
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
            });
        }
    }, [student, form, open]);
    

    const onSubmit = (data: StudentFormValues) => {
        if (student) {
            // Update existing student
            const studentDocRef = doc(firestore, 'students', student.id);
            setDocumentNonBlocking(studentDocRef, data, { merge: true });
            toast({
                title: "تم التحديث بنجاح",
                description: `تم تحديث بيانات التلميذ ${data.firstName} ${data.lastName}.`,
            });
        } else {
            // Add new student
            addDocumentNonBlocking(collection(firestore, 'students'), data);
            toast({
                title: "تم الحفظ بنجاح",
                description: `تمت إضافة التلميذ ${data.firstName} ${data.lastName}.`,
            });
        }
        form.reset();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{student ? 'تعديل بيانات التلميذ' : 'إضافة تلميذ جديد'}</DialogTitle>
                    <DialogDescription>
                       {student ? 'قم بتحديث التفاصيل أدناه.' : 'أدخل تفاصيل التلميذ الجديد هنا. انقر على "حفظ" عند الانتهاء.'}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                        <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                                <FormItem className="grid grid-cols-4 items-center gap-4">
                                    <FormLabel className="text-right">اللقب</FormLabel>
                                    <FormControl>
                                        <Input {...field} className="col-span-3" />
                                    </FormControl>
                                    <FormMessage className="col-span-4" />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                                <FormItem className="grid grid-cols-4 items-center gap-4">
                                    <FormLabel className="text-right">الإسم</FormLabel>
                                    <FormControl>
                                        <Input {...field} className="col-span-3" />
                                    </FormControl>
                                    <FormMessage className="col-span-4" />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="dateOfBirth"
                            render={({ field }) => (
                                <FormItem className="grid grid-cols-4 items-center gap-4">
                                    <FormLabel className="text-right">تاريخ الميلاد</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="date" className="col-span-3" />
                                    </FormControl>
                                    <FormMessage className="col-span-4" />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="gender"
                            render={({ field }) => (
                                <FormItem className="grid grid-cols-4 items-center gap-4">
                                    <FormLabel className="text-right">الجنس</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="col-span-3">
                                                <SelectValue placeholder="اختر الجنس" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="male">ذكر</SelectItem>
                                            <SelectItem value="female">أنثى</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage className="col-span-4" />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="level"
                            render={({ field }) => (
                                <FormItem className="grid grid-cols-4 items-center gap-4">
                                    <FormLabel className="text-right">المستوى</FormLabel>
                                     <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="col-span-3">
                                                <SelectValue placeholder="اختر المستوى" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="أولى ابتدائي">أولى ابتدائي</SelectItem>
                                            <SelectItem value="ثانية ابتدائي">ثانية ابتدائي</SelectItem>
                                            <SelectItem value="ثالثة ابتدائي">ثالثة ابتدائي</SelectItem>
                                            <SelectItem value="رابعة ابتدائي">رابعة ابتدائي</SelectItem>
                                            <SelectItem value="خامسة ابتدائي">خامسة ابتدائي</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage className="col-span-4" />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="institutionId"
                            render={({ field }) => (
                                <FormItem className="grid grid-cols-4 items-center gap-4">
                                    <FormLabel className="text-right">المؤسسة</FormLabel>
                                     <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="col-span-3">
                                                <SelectValue placeholder="اختر المؤسسة" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {institutions?.map(inst => (
                                                <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage className="col-span-4" />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem className="grid grid-cols-4 items-center gap-4">
                                    <FormLabel className="text-right">الحالة</FormLabel>
                                     <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="col-span-3">
                                                <SelectValue placeholder="اختر الحالة" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="active">يمارس</SelectItem>
                                            <SelectItem value="exempt">معفي</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage className="col-span-4" />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
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
  const { data: institutions } = useCollection(institutionsQuery);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setFormOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());


  const institutionMap = useMemo(() => {
    if (!institutions) return new Map();
    return new Map(institutions.map(inst => [inst.id, inst.name]));
  }, [institutions]);

  const filteredStudents = useMemo(() => {
    if (!students) return [];
    return students.filter(student =>
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

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
      if (selectedStudents.size === filteredStudents.length) {
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

  const downloadCSV = (content: string, fileName: string) => {
    const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToCSV = (data: Student[], fileName: string) => {
    const csvRows = [
        ['اللقب', 'الإسم', 'المستوى', 'الجنس', 'المؤسسة', 'الحالة'].join(','),
    ];

    data.forEach(student => {
        const row = [
            `"${student.lastName}"`,
            `"${student.firstName}"`,
            `"${student.level ?? ''}"`,
            `"${student.gender === 'male' ? 'ذكر' : 'أنثى'}"`,
            `"${institutionMap.get(student.institutionId) ?? ''}"`,
            `"${student.status === 'active' ? 'يمارس' : 'معفي'}"`,
        ].join(',');
        csvRows.push(row);
    });
    
    downloadCSV(csvRows.join('\n'), fileName);
  };

  const handleExportSelected = () => {
    const selectedData = students?.filter(s => selectedStudents.has(s.id)) || [];
    if (selectedData.length > 0) {
        exportToCSV(selectedData, 'قائمة_التلاميذ_المحددين.csv');
    } else {
        toast({ title: "لا توجد بيانات", description: "الرجاء تحديد التلاميذ للتصدير." });
    }
  };
  
    const handleDownloadTemplate = () => {
        const headers = ['firstName', 'lastName', 'dateOfBirth', 'gender', 'level', 'institutionId', 'status'].join(',');
        downloadCSV(headers, 'template.csv');
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const importedStudents = results.data as any[];
                const batch = writeBatch(firestore);
                let count = 0;

                importedStudents.forEach(studentData => {
                    // Basic validation
                    if (studentData.firstName && studentData.lastName && studentData.institutionId) {
                        const newStudentRef = doc(collection(firestore, 'students'));
                        batch.set(newStudentRef, {
                          firstName: studentData.firstName || '',
                          lastName: studentData.lastName || '',
                          dateOfBirth: studentData.dateOfBirth || '',
                          gender: studentData.gender === 'male' || studentData.gender === 'female' ? studentData.gender : 'male',
                          level: studentData.level || '',
                          institutionId: studentData.institutionId || '',
                           status: studentData.status === 'active' || studentData.status === 'exempt' ? studentData.status : 'active',
                        });
                        count++;
                    }
                });

                if (count > 0) {
                    batch.commit().then(() => {
                        toast({ title: "تم الاستيراد بنجاح", description: `تمت إضافة ${count} تلميذ/تلاميذ.` });
                    }).catch(err => {
                        console.error(err);
                        toast({ title: "خطأ في الاستيراد", description: "حدث خطأ أثناء حفظ التلاميذ.", variant: "destructive" });
                    });
                } else {
                    toast({ title: "لا توجد بيانات صالحة للاستيراد", variant: "destructive" });
                }
            },
            error: (error) => {
                 toast({ title: "خطأ في قراءة الملف", description: error.message, variant: "destructive" });
            }
        });
        
        // Reset file input
        event.target.value = '';
    };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2">
        <h1 className="font-bold text-3xl text-center text-primary relative">
          إدارة التلاميذ
          <span className="absolute -bottom-2 start-1/2 -translate-x-1/2 w-20 h-1 bg-accent rounded-full"></span>
        </h1>
      </div>

      <Card className="shadow-md">
        <CardContent className="p-4 flex flex-wrap items-center gap-2">
            <Button onClick={handleAddNew} className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full">
              <UserPlus className="me-2" />
              تسجيل تلميذ
            </Button>
            <StudentForm open={isFormOpen} onOpenChange={setFormOpen} student={selectedStudent} />
           <Button onClick={handleDownloadTemplate} variant="outline" className="rounded-full border-primary text-primary hover:bg-primary/10">
            <FileText className="me-2" />
            تحميل نموذج
          </Button>
          <Button onClick={handleImportClick} variant="outline" className="rounded-full border-primary text-primary hover:bg-primary/10">
            <FileUp className="me-2" />
            استيراد
          </Button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileImport}
            className="hidden" 
            accept=".csv"
          />
          {selectedStudents.size > 0 && (
             <>
                <Button variant="destructive" onClick={handleDeleteSelected} className="rounded-full">
                    <Trash2 className="me-2" />
                    حذف المحدد ({selectedStudents.size})
                </Button>
                 <Button variant="outline" onClick={handleExportSelected} className="rounded-full">
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
                <TableHead className="text-white">المستوى</TableHead>
                <TableHead className="text-white">الجنس</TableHead>
                <TableHead className="text-white">المؤسسة</TableHead>
                <TableHead className="text-white">الحالة</TableHead>
                <TableHead className="text-white text-center">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={8} className="text-center">جاري تحميل التلاميذ...</TableCell></TableRow>}
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

    