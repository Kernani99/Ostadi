'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useCollection, useFirestore } from "@/firebase";
import { PlusCircle, Upload, Download, Search, Trash2, Pencil, UserPlus, FileDown, FileUp, FileText } from "lucide-react";
import { collection, doc, query, where } from "firebase/firestore";
import { useMemoFirebase } from "@/firebase/provider";
import { Input } from "@/components/ui/input";
import { Student } from "@/lib/types";
import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";

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

const StudentForm = ({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) => {
    const firestore = useFirestore();
    const { toast } = useToast();
    const institutionsQuery = useMemoFirebase(() => collection(firestore, 'institutions'), [firestore]);
    const { data: institutions } = useCollection(institutionsQuery);

    const form = useForm<StudentFormValues>({
        resolver: zodResolver(studentSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            dateOfBirth: '',
            level: '',
            institutionId: '',
        }
    });

    const onSubmit = (data: StudentFormValues) => {
        addDocumentNonBlocking(collection(firestore, 'students'), data);
        toast({
            title: "تم الحفظ بنجاح",
            description: `تمت إضافة التلميذ ${data.firstName} ${data.lastName}.`,
        });
        form.reset();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>إضافة تلميذ جديد</DialogTitle>
                    <DialogDescription>
                        أدخل تفاصيل التلميذ الجديد هنا. انقر على "حفظ" عند الانتهاء.
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
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                                     <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                                     <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                                     <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                            <Button type="submit">حفظ التلميذ</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}


export default function StudentsPage() {
  const firestore = useFirestore();
  const studentsQuery = useMemoFirebase(() => collection(firestore, 'students'), [firestore]);
  const { data: students, isLoading } = useCollection<Student>(studentsQuery);
  const institutionsQuery = useMemoFirebase(() => collection(firestore, 'institutions'), [firestore]);
  const { data: institutions } = useCollection(institutionsQuery);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setAddModalOpen] = useState(false);


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

  const handleDelete = (studentId: string) => {
    if (confirm('هل أنت متأكد من أنك تريد حذف هذا التلميذ؟')) {
        const studentDocRef = doc(firestore, 'students', studentId);
        deleteDocumentNonBlocking(studentDocRef);
    }
  };

  const handleEdit = (studentId: string) => {
    // TODO: Implement edit functionality
    alert(`Edit student with ID: ${studentId}`);
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
            <Button onClick={() => setAddModalOpen(true)} className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full">
              <UserPlus className="me-2" />
              تسجيل تلميذ
            </Button>
            <StudentForm open={isAddModalOpen} onOpenChange={setAddModalOpen} />
           <Button variant="outline" className="rounded-full border-primary text-primary hover:bg-primary/10">
            <FileText className="me-2" />
            ت نموذج Excel
          </Button>
          <Button variant="outline" className="rounded-full border-primary text-primary hover:bg-primary/10">
            <FileDown className="me-2" />
            استيراد
          </Button>
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
                    <Checkbox />
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
                <TableRow key={student.id} className="hover:bg-muted/50">
                   <TableCell className="text-center">
                    <Checkbox />
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
                    <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700" onClick={() => handleEdit(student.id)}>
                      <Pencil className="h-5 w-5" />
                    </Button>
                     <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(student.id)}>
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
      </div>
    </div>
  );
}
