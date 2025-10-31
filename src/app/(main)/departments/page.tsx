
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
import { Loader2, Users, UserPlus, Trash2, Pencil, Printer, Building } from "lucide-react";
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


const editDepartmentSchema = z.object({
  name: z.string().min(1, "اسم القسم مطلوب"),
  studentIds: z.array(z.string()).optional(),
});
type EditDepartmentFormValues = z.infer<typeof editDepartmentSchema>;

function EditDepartmentForm({ department, open, onOpenChange, allStudents }: { department: Department | null, open: boolean, onOpenChange: (open: boolean) => void, allStudents: Student[] | null }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const form = useForm<EditDepartmentFormValues>({
        resolver: zodResolver(editDepartmentSchema),
        defaultValues: { name: '', studentIds: [] }
    });

    const { studentsInDept, unassignedStudentsInLevel, isLoadingStudents } = useMemo(() => {
        if (!department || !allStudents) {
            return { studentsInDept: [], unassignedStudentsInLevel: [], isLoadingStudents: true };
        }
        
        const studentsInDept = allStudents.filter(s => s.departmentId === department.id);
        const unassignedStudentsInLevel = allStudents.filter(s => 
            s.institutionId === department.institutionId && 
            s.level === department.level &&
            !s.departmentId
        );

        return { studentsInDept, unassignedStudentsInLevel, isLoadingStudents: false };
    }, [department, allStudents]);

    useEffect(() => {
        if (department && open) {
            const studentIdsInDept = studentsInDept.map(s => s.id);
            form.reset({ name: department.name, studentIds: studentIdsInDept });
        }
    }, [department, studentsInDept, form, open]);

    const onSubmit = async (data: EditDepartmentFormValues) => {
        if (!department || !firestore) return;

        const batch = writeBatch(firestore);
        const deptRef = doc(firestore, 'departments', department.id);

        // 1. Update department name if changed
        if (department.name !== data.name) {
            batch.update(deptRef, { name: data.name });
        }

        const initialStudentIds = new Set(studentsInDept.map(s => s.id));
        const newStudentIds = new Set(data.studentIds || []);

        // 2. Students to be removed from the department
        for (const studentId of initialStudentIds) {
            if (!newStudentIds.has(studentId)) {
                const studentRef = doc(firestore, 'students', studentId);
                batch.update(studentRef, { departmentId: null });
            }
        }

        // 3. Students to be added to the department
        for (const studentId of newStudentIds) {
            if (!initialStudentIds.has(studentId)) {
                const studentRef = doc(firestore, 'students', studentId);
                batch.update(studentRef, { departmentId: department.id });
            }
        }

        try {
            await batch.commit();
            toast({ title: "تم التحديث بنجاح", description: `تم تحديث بيانات القسم ${data.name}.` });
            onOpenChange(false);
        } catch (error) {
            console.error("Error updating department:", error);
            toast({ title: "خطأ", description: "لم نتمكن من تحديث القسم.", variant: "destructive" });
        }
    };

    const availableStudents = useMemo(() => {
        return [...studentsInDept, ...unassignedStudentsInLevel].sort((a, b) => a.lastName.localeCompare(b.lastName));
    }, [studentsInDept, unassignedStudentsInLevel]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>تعديل الفوج</DialogTitle>
                     <DialogDescription>قم بتعديل اسم الفوج أو قائمة التلاميذ.</DialogDescription>
                </DialogHeader>
                {department ? (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>اسم الفوج</FormLabel>
                                        <FormControl>
                                            <Input placeholder="اسم الفوج" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            
                            <FormField
                                control={form.control}
                                name="studentIds"
                                render={() => (
                                <FormItem>
                                    <div className="mb-2">
                                        <FormLabel>تلاميذ الفوج</FormLabel>
                                        <p className="text-sm text-muted-foreground">حدد التلاميذ الذين ينتمون لهذا الفوج.</p>
                                    </div>
                                    <ScrollArea className="h-60 rounded-md border p-4">
                                        {isLoadingStudents ? <p>جاري تحميل التلاميذ...</p> : 
                                         availableStudents.length > 0 ?
                                         availableStudents.map((student) => (
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
                                                            {studentsInDept.some(s => s.id === student.id) ? '' : <span className="text-xs text-muted-foreground"> (غير معين)</span>}
                                                        </FormLabel>
                                                    </FormItem>
                                                )
                                                }}
                                            />
                                        )) : <p>لا يوجد تلاميذ متاحون في هذا المستوى.</p>}
                                    </ScrollArea>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />

                            <DialogFooter>
                                <Button type="submit" disabled={form.formState.isSubmitting}>
                                    {form.formState.isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                                    حفظ التعديلات
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                ) : <p>جاري تحميل بيانات القسم...</p>}
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
  const [institutionFilter, setInstitutionFilter] = useState('all');
  const firestore = useFirestore();
  const { toast } = useToast();

  const { data: institutions, isLoading: isLoadingInstitutions } = useCollection<Institution>(useMemoFirebase(() => collection(firestore, 'institutions'), [firestore]));
  const { data: departments, isLoading: isLoadingDepartments } = useCollection<Department>(useMemoFirebase(() => collection(firestore, 'departments'), [firestore]));
  const { data: allStudents } = useCollection<Student>(useMemoFirebase(() => collection(firestore, 'students'), [firestore]));
  
  const institutionMap = useMemo(() => {
    return new Map(institutions?.map(i => [i.id, i.name]));
  }, [institutions]);

  const studentsByDepartment = useMemo(() => {
    if (!allStudents || !departments) return new Map<string, Student[]>();
    
    const map = new Map<string, Student[]>();
    departments.forEach(dept => map.set(dept.id, []));
    allStudents.forEach(student => {
      if (student.departmentId && map.has(student.departmentId)) {
        map.get(student.departmentId)?.push(student);
      }
    });
    return map;
  }, [allStudents, departments]);

  const departmentsByInstitutionThenLevel = useMemo(() => {
    const filteredDepartments = institutionFilter === 'all' 
      ? departments 
      : departments?.filter(d => d.institutionId === institutionFilter);

    if (!filteredDepartments) return new Map<string, Map<string, Department[]>>();

    const grouped = filteredDepartments.reduce((acc, dept) => {
      const institutionId = dept.institutionId;
      const level = dept.level || 'غير محدد';
      
      if (!acc.has(institutionId)) {
        acc.set(institutionId, new Map<string, Department[]>());
      }

      const institutionGroup = acc.get(institutionId)!;
      if (!institutionGroup.has(level)) {
        institutionGroup.set(level, []);
      }
      institutionGroup.get(level)!.push(dept);
      return acc;
    }, new Map<string, Map<string, Department[]>>());

    // Sort levels inside each institution
    grouped.forEach(institutionGroup => {
      const levelOrder = ['أولى ابتدائي', 'ثانية ابتدائي', 'ثالثة ابتدائي', 'رابعة ابتدائي', 'خامسة ابتدائي', 'غير محدد'];
      const sortedInstitutionGroup = new Map<string, Department[]>();
      levelOrder.forEach(level => {
        if(institutionGroup.has(level)) {
          sortedInstitutionGroup.set(level, institutionGroup.get(level)!);
        }
      });
       // Clear and re-populate with sorted levels
      institutionGroup.clear();
      sortedInstitutionGroup.forEach((depts, level) => institutionGroup.set(level, depts));
    });
    
    return grouped;
  }, [departments, institutionFilter]);


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

  const isLoading = isLoadingDepartments || isLoadingInstitutions;

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="flex flex-col items-center gap-2">
        <h1 className="font-bold text-3xl text-center text-primary relative">
          إدارة الأقسام والأفواج
          <span className="absolute -bottom-2 start-1/2 -translate-x-1/2 w-20 h-1 bg-accent rounded-full"></span>
        </h1>
      </div>
      
      <Card>
        <CardHeader className="flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-col">
            <CardTitle>قائمة الأقسام (الأفواج)</CardTitle>
            <CardDescription>هنا يمكنك عرض وإدارة جميع الأفواج مجمعة حسب المؤسسة والمستوى.</CardDescription>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
             <Select onValueChange={setInstitutionFilter} value={institutionFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="فلترة حسب المؤسسة" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">كل المؤسسات</SelectItem>
                    {institutions?.map(inst => (
                        <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Button onClick={handlePrint} variant="outline" size="icon" className="shrink-0">
                <Printer className="h-5 w-5"/>
                <span className="sr-only">طباعة</span>
            </Button>
            <Button onClick={() => setAddModalOpen(true)} className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full shrink-0">
                <UserPlus className="me-2"/>
                إضافة
            </Button>
          </div>
          <AddDepartmentForm open={isAddModalOpen} onOpenChange={setAddModalOpen} />
          <EditDepartmentForm department={departmentToEdit} open={isEditModalOpen} onOpenChange={setEditModalOpen} allStudents={allStudents} />
        </CardHeader>
        <CardContent>
            {isLoading ? (
                 <p className="text-muted-foreground text-center py-8">جاري تحميل الأقسام...</p>
            ) : departments && departments.length > 0 ? (
                <div className="space-y-12">
                    {Array.from(departmentsByInstitutionThenLevel.entries()).map(([institutionId, levels]) => (
                      <div key={institutionId}>
                          <h2 className="text-2xl font-bold text-primary mb-6 pb-2 flex items-center gap-3">
                            <Building className="h-7 w-7" />
                            {institutionMap.get(institutionId) || 'مؤسسة غير معروفة'}
                          </h2>
                          <div className="space-y-8 ps-4 border-s-4 border-primary/20">
                            {Array.from(levels.entries()).map(([level, depts]) => (
                               <div key={level}>
                                  <h3 className="text-xl font-bold text-primary/80 mb-4 pb-2 border-b-2 border-primary/20">
                                    أفواج {level}
                                  </h3>
                                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {depts.map(dept => (
                                        <Card key={dept.id} className="flex flex-col shadow-md hover:shadow-lg transition-shadow">
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
                                                {(studentsByDepartment.get(dept.id)?.length ?? 0) > 0 ? studentsByDepartment.get(dept.id)?.map(student => (
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
                              </div>
                            ))}
                          </div>
                      </div>
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
