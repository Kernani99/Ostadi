
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore } from "@/firebase";
import { collection, doc, query, where, writeBatch, getDocs, updateDoc } from "firebase/firestore";
import { useMemoFirebase } from "@/firebase/provider";
import type { Student, Department, Institution } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Users, UserPlus, Trash2, Pencil, Printer } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from 'next/link';

// Schema for adding a new department
const departmentSchema = z.object({
  name: z.string().min(1, "اسم القسم مطلوب"),
  institutionId: z.string().min(1, "المؤسسة مطلوبة"),
  level: z.string().min(1, "المستوى مطلوب"),
  studentIds: z.array(z.string()).optional(),
});
type DepartmentFormValues = z.infer<typeof departmentSchema>;

// Component to add a new department
function AddDepartmentForm({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
    const firestore = useFirestore();
    const { data: institutions } = useCollection<Institution>(useMemoFirebase(() => collection(firestore, 'institutions'), [firestore]));
    const { toast } = useToast();
    const [selectedLevel, setSelectedLevel] = useState('');
    const [selectedInstitution, setSelectedInstitution] = useState('');

    const form = useForm<DepartmentFormValues>({
        resolver: zodResolver(departmentSchema),
        defaultValues: { name: '', institutionId: '', level: '', studentIds: [] }
    });
    
    const unassignedStudentsQuery = useMemoFirebase(() => {
        if (!firestore || !selectedLevel || !selectedInstitution) return null;
        return query(
          collection(firestore, 'students'),
          where('institutionId', '==', selectedInstitution),
          where('level', '==', selectedLevel)
        );
      }, [firestore, selectedLevel, selectedInstitution]);

    const { data: studentsFromLevel, isLoading: isLoadingStudents } = useCollection<Student>(unassignedStudentsQuery);

     const allDepartmentsQuery = useMemoFirebase(() => collection(firestore, 'departments'), [firestore]);
     const { data: allDepartments } = useCollection<Department>(allDepartmentsQuery);

    const unassignedStudents = useMemo(() => {
        if (!studentsFromLevel) return [];
        // Further filter out students who already have a departmentId
        return studentsFromLevel.filter(student => !student.departmentId);
    }, [studentsFromLevel]);


    useEffect(() => {
        if (open) {
            form.reset({ name: '', institutionId: '', level: '', studentIds: [] });
            setSelectedLevel('');
            setSelectedInstitution('');
        }
    }, [open, form]);

    const onSubmit = async (data: DepartmentFormValues) => {
        if (!firestore) return;
        const batch = writeBatch(firestore);
        
        // 1. Create the new department
        const newDeptRef = doc(collection(firestore, 'departments'));
        batch.set(newDeptRef, { name: data.name, institutionId: data.institutionId, level: data.level });

        // 2. Update the selected students to assign them to the new department
        if (data.studentIds && data.studentIds.length > 0) {
            data.studentIds.forEach(studentId => {
                const studentRef = doc(firestore, 'students', studentId);
                batch.update(studentRef, { departmentId: newDeptRef.id });
            });
        }
        
        await batch.commit();

        toast({ title: "تم الحفظ بنجاح", description: `تمت إضافة القسم ${data.name} وتعيين ${data.studentIds?.length || 0} تلميذ/ة.` });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>إضافة فوج (قسم) جديد</DialogTitle>
                    <DialogDescription>اختر المؤسسة والمستوى، ثم أدخل اسم الفوج واختر التلاميذ.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="institutionId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>المؤسسة</FormLabel>
                                        <Select onValueChange={(value) => { field.onChange(value); setSelectedInstitution(value); form.setValue('level', ''); setSelectedLevel(''); }} value={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="اختر مؤسسة" /></SelectTrigger></FormControl>
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
                                name="level"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>المستوى</FormLabel>
                                        <Select onValueChange={(value) => { field.onChange(value); setSelectedLevel(value); }} value={field.value} disabled={!selectedInstitution}>
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
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>اسم الفوج (القسم)</FormLabel>
                                    <FormControl><Input placeholder="مثال: فوج 1" {...field} disabled={!selectedLevel} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                       
                        {selectedLevel && selectedInstitution && (
                             <FormField
                                control={form.control}
                                name="studentIds"
                                render={() => (
                                <FormItem>
                                    <div className="mb-2">
                                        <FormLabel>اختر التلاميذ</FormLabel>
                                        <p className="text-sm text-muted-foreground">قائمة التلاميذ غير المعينين في هذا المستوى.</p>
                                    </div>
                                    <ScrollArea className="h-60 rounded-md border p-4">
                                        {isLoadingStudents ? <p>جاري تحميل التلاميذ...</p> : 
                                         unassignedStudents && unassignedStudents.length > 0 ?
                                         unassignedStudents.map((student) => (
                                            <FormField
                                                key={student.id}
                                                control={form.control}
                                                name="studentIds"
                                                render={({ field }) => {
                                                return (
                                                    <FormItem
                                                        key={student.id}
                                                        className="flex flex-row items-start space-x-3 space-y-0 rtl:space-x-reverse my-2"
                                                    >
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value?.includes(student.id)}
                                                                onCheckedChange={(checked) => {
                                                                    return checked
                                                                    ? field.onChange([...(field.value || []), student.id])
                                                                    : field.onChange(
                                                                        field.value?.filter(
                                                                            (value) => value !== student.id
                                                                        )
                                                                        )
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormLabel className="font-normal">
                                                            {student.lastName} {student.firstName}
                                                        </FormLabel>
                                                    </FormItem>
                                                )
                                                }}
                                            />
                                        )) : <p>لا يوجد تلاميذ غير معينين في هذا المستوى.</p>}
                                    </ScrollArea>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        )}


                        <DialogFooter>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin"/>}
                                حفظ القسم
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

// Component to edit department name
function EditDepartmentForm({ department, open, onOpenChange }: { department: Department | null, open: boolean, onOpenChange: (open: boolean) => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [name, setName] = useState('');
    const [isSubmitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (department) {
            setName(department.name);
        }
    }, [department]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!department || !name.trim()) return;
        setSubmitting(true);
        const deptRef = doc(firestore, 'departments', department.id);
        try {
            await updateDoc(deptRef, { name: name.trim() });
            toast({ title: "تم التحديث بنجاح", description: `تم تغيير اسم القسم إلى ${name.trim()}.` });
            onOpenChange(false);
        } catch (error) {
            console.error("Error updating department:", error);
            toast({ title: "خطأ", description: "لم نتمكن من تحديث اسم القسم.", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>تعديل اسم الفوج</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormItem>
                        <FormLabel>اسم الفوج الجديد</FormLabel>
                        <FormControl>
                            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="أدخل الاسم الجديد" />
                        </FormControl>
                    </FormItem>
                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                            حفظ التعديل
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}


// Main component for the departments page
export default function DepartmentsPage() {
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [departmentToEdit, setDepartmentToEdit] = useState<Department | null>(null);
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null);
  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const departmentsQuery = useMemoFirebase(() => collection(firestore, 'departments'), [firestore]);
  const { data: departments } = useCollection<Department>(departmentsQuery);

  const allStudentsQuery = useMemoFirebase(() => collection(firestore, 'students'), [firestore]);
  const { data: allStudents } = useCollection<Student>(allStudentsQuery);
  
  const studentsByDepartment = useMemo(() => {
    if (!allStudents || !departments) return new Map<string, Student[]>();
    
    const map = new Map<string, Student[]>();
    
    departments.forEach(dept => {
      map.set(dept.id, []);
    });

    allStudents.forEach(student => {
      if (student.departmentId && map.has(student.departmentId)) {
        map.get(student.departmentId)?.push(student);
      }
    });

    return map;
  }, [allStudents, departments]);

  const handleOpenEditModal = (dept: Department) => {
    setDepartmentToEdit(dept);
    setEditModalOpen(true);
  }

  const handleOpenDeleteAlert = (dept: Department) => {
    setDepartmentToDelete(dept);
    setDeleteAlertOpen(true);
  }

  const confirmDelete = async () => {
    if (!departmentToDelete || !firestore) return;

    const studentsInDept = studentsByDepartment.get(departmentToDelete.id) || [];
    const batch = writeBatch(firestore);

    // Delete the department document
    const deptRef = doc(firestore, 'departments', departmentToDelete.id);
    batch.delete(deptRef);

    // Unassign students from this department
    studentsInDept.forEach(student => {
        const studentRef = doc(firestore, 'students', student.id);
        batch.update(studentRef, { departmentId: null });
    });

    try {
        await batch.commit();
        toast({ title: "تم الحذف", description: `تم حذف القسم ${departmentToDelete.name} بنجاح.` });
    } catch (error) {
        console.error("Error deleting department:", error);
        toast({ title: "خطأ", description: "حدث خطأ أثناء حذف القسم.", variant: "destructive" });
    } finally {
        setDeleteAlertOpen(false);
        setDepartmentToDelete(null);
    }
  };
  
  const handlePrint = () => {
    const printWindow = window.open('/departments/print', '_blank');
    printWindow?.focus();
  }

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="flex flex-col items-center gap-2">
        <h1 className="font-bold text-3xl text-center text-primary relative">
          إدارة الأقسام والأفواج
          <span className="absolute -bottom-2 start-1/2 -translate-x-1/2 w-20 h-1 bg-accent rounded-full"></span>
        </h1>
      </div>
      
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div className="flex flex-col">
            <CardTitle>قائمة الأقسام (الأفواج)</CardTitle>
            <CardDescription>هنا يمكنك عرض وإدارة جميع الأفواج.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handlePrint} variant="outline" size="icon">
                <Printer className="h-5 w-5"/>
                <span className="sr-only">طباعة</span>
            </Button>
            <Button onClick={() => setAddModalOpen(true)} className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full">
                <UserPlus className="me-2"/>
                إضافة فوج
            </Button>
          </div>
          <AddDepartmentForm open={isAddModalOpen} onOpenChange={setAddModalOpen} />
          <EditDepartmentForm department={departmentToEdit} open={isEditModalOpen} onOpenChange={setEditModalOpen} />
        </CardHeader>
        <CardContent>
            {departments && departments.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {departments.map(dept => (
                      <Card key={dept.id} className="flex flex-col">
                        <CardHeader className="flex-row justify-between items-start">
                            <div>
                                <CardTitle className="text-lg">{dept.name}</CardTitle>
                                <CardDescription>عدد التلاميذ: {studentsByDepartment.get(dept.id)?.length || 0}</CardDescription>
                            </div>
                             <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEditModal(dept)}>
                                    <Pencil className="h-4 w-4 text-blue-600"/>
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDeleteAlert(dept)}>
                                    <Trash2 className="h-4 w-4 text-red-600"/>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2 flex-grow">
                            <ScrollArea className="h-48">
                            {studentsByDepartment.get(dept.id)?.length > 0 ? studentsByDepartment.get(dept.id)?.map(student => (
                              <div key={student.id} className="flex items-center justify-between p-2 bg-background rounded-md text-sm">
                                  <span>{student.lastName} {student.firstName}</span>
                                  <Badge variant={student.gender === 'male' ? 'default' : 'secondary'} className={student.gender === 'female' ? 'bg-pink-200 text-pink-800' : ''}>
                                      {student.gender === 'male' ? 'ذكر' : 'أنثى'}
                                  </Badge>
                              </div>
                            )) : <p className="text-sm text-muted-foreground p-4 text-center">لا يوجد تلاميذ في هذا الفوج.</p>}
                            </ScrollArea>
                        </CardContent>
                      </Card>
                    ))}
                </div>
            ) : (
                 <p className="text-muted-foreground text-center py-8">لم تتم إضافة أي أقسام بعد. ابدأ بإضافة فوج جديد.</p>
            )}
        </CardContent>
      </Card>
      
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
                <AlertDialogDescription>
                    هذا الإجراء لا يمكن التراجع عنه. سيؤدي هذا إلى حذف الفوج بشكل دائم، وسيتم إلغاء تعيين التلاميذ منه.
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

    