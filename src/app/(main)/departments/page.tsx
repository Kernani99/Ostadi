'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore } from "@/firebase";
import { collection, doc, query, where, writeBatch } from "firebase/firestore";
import { useMemoFirebase } from "@/firebase/provider";
import type { Student, Department } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Shuffle, Users, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

// Schema for adding a new department
const departmentSchema = z.object({
  name: z.string().min(1, "اسم القسم مطلوب"),
  institutionId: z.string().min(1, "المؤسسة مطلوبة"),
});
type DepartmentFormValues = z.infer<typeof departmentSchema>;

// Schema for the grouping form
const groupingSchema = z.object({
  departmentId: z.string().min(1, "الرجاء اختيار قسم."),
  numberOfGroups: z.number({ coerce: true }).min(2, "يجب أن يكون عدد الأفواج 2 على الأقل."),
});

// Component to add a new department
function AddDepartmentForm({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
    const firestore = useFirestore();
    const { data: institutions } = useCollection(useMemoFirebase(() => collection(firestore, 'institutions'), [firestore]));
    const { toast } = useToast();
    const form = useForm<DepartmentFormValues>({
        resolver: zodResolver(departmentSchema),
        defaultValues: { name: '', institutionId: '' }
    });

    const onSubmit = (data: DepartmentFormValues) => {
        addDocumentNonBlocking(collection(firestore, 'departments'), data);
        toast({ title: "تم الحفظ بنجاح", description: `تمت إضافة القسم ${data.name}.` });
        form.reset();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>إضافة قسم جديد</DialogTitle>
                    <DialogDescription>أدخل تفاصيل القسم الجديد.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>اسم القسم</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
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
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="اختر مؤسسة" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {institutions?.map(inst => <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit">حفظ القسم</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

// Main component for the departments page
export default function DepartmentsPage() {
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resultGroups, setResultGroups] = useState<Student[][] | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();

  const departmentsQuery = useMemoFirebase(() => collection(firestore, 'departments'), [firestore]);
  const { data: departments } = useCollection<Department>(departmentsQuery);

  const studentsInDepartmentQuery = useMemoFirebase(() => {
    if (!selectedDepartment) return null;
    return query(collection(firestore, 'students'), where('departmentId', '==', selectedDepartment));
  }, [firestore, selectedDepartment]);
  const { data: studentsInSelectedDepartment } = useCollection<Student>(studentsInDepartmentQuery);

  const form = useForm<z.infer<typeof groupingSchema>>({
    resolver: zodResolver(groupingSchema),
    defaultValues: { departmentId: "", numberOfGroups: 2 },
  });

  const assignStudentsToDepartment = async () => {
    if (!selectedDepartment) {
        toast({ title: "خطأ", description: "الرجاء اختيار قسم أولاً.", variant: "destructive" });
        return;
    }

    const dept = departments?.find(d => d.id === selectedDepartment);
    if (!dept) return;

    // A simple logic to find students that might belong to this department
    // e.g., by level if department name contains a level name.
    // This is a placeholder for a more robust logic.
    const levelMatch = dept.name.match(/أولى|ثانية|ثالثة|رابعة|خامسة/);
    if (!levelMatch) {
         toast({ title: "لا يمكن التعيين", description: "لا يمكن تحديد التلاميذ تلقائيًا لهذا القسم. قم بتعيينهم يدويًا من صفحة التلاميذ.", variant: "destructive" });
        return;
    }
    const levelString = `${levelMatch[0]} ابتدائي`;

    const studentsToUpdateQuery = query(collection(firestore, 'students'), where('level', '==', levelString), where('departmentId', '==', null));
    const studentsToUpdateSnap = await getDocs(studentsToUpdateQuery);
    
    if (studentsToUpdateSnap.empty) {
        toast({ title: "لا يوجد تلاميذ", description: "لا يوجد تلاميذ غير معينين في هذا المستوى.", });
        return;
    }

    const batch = writeBatch(firestore);
    studentsToUpdateSnap.forEach(studentDoc => {
        batch.update(studentDoc.ref, { departmentId: selectedDepartment });
    });

    await batch.commit();
    toast({ title: "تم التحديث", description: `تم تعيين ${studentsToUpdateSnap.size} تلميذ/تلاميذ للقسم.` });
  };


  function onSubmit(values: z.infer<typeof groupingSchema>) {
    setIsLoading(true);
    setResultGroups(null);

    if (!studentsInSelectedDepartment || studentsInSelectedDepartment.length < values.numberOfGroups) {
      toast({
        title: "خطأ في الإدخال",
        description: "عدد التلاميذ في القسم أقل من عدد الأفواج المطلوب.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Simple grouping logic: distribute students one by one into groups
    const groups: Student[][] = Array.from({ length: values.numberOfGroups }, () => []);
    const shuffledStudents = [...studentsInSelectedDepartment].sort(() => Math.random() - 0.5); // Shuffle for randomness
    
    shuffledStudents.forEach((student, index) => {
        groups[index % values.numberOfGroups].push(student);
    });

    setResultGroups(groups);
    setIsLoading(false);
    toast({ title: "تم التفويج بنجاح", description: `تم تقسيم التلاميذ إلى ${values.numberOfGroups} أفواج.` });
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
          <CardTitle>قائمة الأقسام</CardTitle>
          <Button onClick={() => setAddModalOpen(true)} className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full">
            <UserPlus className="me-2"/>
            إضافة قسم
          </Button>
          <AddDepartmentForm open={isAddModalOpen} onOpenChange={setAddModalOpen} />
        </CardHeader>
        <CardContent>
            {departments && departments.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                    {departments.map(dept => <Badge key={dept.id} variant="secondary" className="text-lg p-2">{dept.name}</Badge>)}
                </div>
            ) : (
                 <p className="text-muted-foreground">لم تتم إضافة أي أقسام بعد.</p>
            )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>إدارة الأفواج</CardTitle>
          <CardDescription>
            اختر قسماً وعدد الأفواج المطلوب لتقسيم التلاميذ.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اختر القسم</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedDepartment(value);
                          setResultGroups(null);
                        }}
                        defaultValue={field.value}
                        dir="rtl"
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر قسماً" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments?.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="numberOfGroups"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>عدد الأفواج المطلوب</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} min="2" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {selectedDepartment && (
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      تلاميذ القسم المحدد
                    </CardTitle>
                    <CardDescription>
                      سيتم تقسيم هؤلاء التلاميذ ({studentsInSelectedDepartment?.length || 0} تلميذ/ة) إلى أفواج.
                      {studentsInSelectedDepartment?.length === 0 && (
                          <span className="text-amber-600 block mt-2">لا يوجد تلاميذ معينون في هذا القسم. يمكنك تعيينهم من صفحة التلاميذ أو محاولة التعيين التلقائي.</span>
                      )}
                    </CardDescription>
                  </CardHeader>
                   {studentsInSelectedDepartment && studentsInSelectedDepartment.length > 0 && (
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                        {studentsInSelectedDepartment.map(s => (
                            <Badge key={s.id} variant="secondary">{s.firstName} {s.lastName}</Badge>
                        ))}
                        </div>
                    </CardContent>
                   )}
                </Card>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading || !selectedDepartment}>
                {isLoading ? (
                  <>
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    جاري التقسيم...
                  </>
                ) : (
                  <>
                    <Shuffle className="me-2 h-4 w-4" />
                    قسم إلى أفواج
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {resultGroups && (
        <Card className="mt-8">
            <CardHeader>
                <CardTitle>نتائج تقسيم الأفواج</CardTitle>
                 <CardDescription>تم تقسيم التلاميذ بنجاح.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {resultGroups.map((group, index) => (
                    <Card key={index}>
                        <CardHeader>
                            <CardTitle>الفوج {index + 1}</CardTitle>
                            <CardDescription>عدد التلاميذ: {group.length}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2">
                            {group.map(student => (
                              <div key={student.id} className="flex items-center justify-between p-2 bg-background rounded-md">
                                  <span>{student.firstName} {student.lastName}</span>
                                  <Badge variant={student.gender === 'male' ? 'default' : 'secondary'} className={student.gender === 'female' ? 'bg-pink-200 text-pink-800' : ''}>
                                      {student.gender === 'male' ? 'ذكر' : 'أنثى'}
                                  </Badge>
                              </div>
                            ))}
                        </CardContent>
                    </Card>
                ))}
            </CardContent>
        </Card>
      )}
    </div>
  );
}
