'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useCollection, useFirestore } from "@/firebase";
import { PlusCircle, Upload, Download, Search, Trash2, Pencil, UserPlus, FileDown, FileUp, FileText } from "lucide-react";
import { collection, query, where } from "firebase/firestore";
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
  DialogTrigger,
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

const StudentForm = () => {
    const firestore = useFirestore();
    const institutionsQuery = useMemoFirebase(() => collection(firestore, 'institutions'), [firestore]);
    const { data: institutions } = useCollection(institutionsQuery);

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>إضافة تلميذ جديد</DialogTitle>
        <DialogDescription>
          أدخل تفاصيل التلميذ الجديد هنا. انقر على "حفظ" عند الانتهاء.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">
            الإسم واللقب
          </Label>
          <Input id="name" className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="dob" className="text-right">
            تاريخ الميلاد
          </Label>
          <Input id="dob" type="date" className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="gender" className="text-right">
            الجنس
          </Label>
           <Select>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="اختر الجنس" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">ذكر</SelectItem>
                <SelectItem value="female">أنثى</SelectItem>
              </SelectContent>
            </Select>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="level" className="text-right">
            المستوى
          </Label>
           <Select>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="اختر المستوى" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">أولى ابتدائي</SelectItem>
                <SelectItem value="2">ثانية ابتدائي</SelectItem>
                <SelectItem value="3">ثالثة ابتدائي</SelectItem>
                <SelectItem value="4">رابعة ابتدائي</SelectItem>
                <SelectItem value="5">خامسة ابتدائي</SelectItem>
              </SelectContent>
            </Select>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="institution" className="text-right">
            المؤسسة
          </Label>
           <Select>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="اختر المؤسسة" />
              </SelectTrigger>
              <SelectContent>
                {institutions?.map(inst => (
                    <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
        </div>
         <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="status" className="text-right">
            الحالة
          </Label>
           <Select>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="اختر الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">يمارس</SelectItem>
                <SelectItem value="exempt">معفي</SelectItem>
              </SelectContent>
            </Select>
        </div>
      </div>
      <DialogFooter>
        <Button type="submit">حفظ التلميذ</Button>
      </DialogFooter>
    </DialogContent>
  )
}


export default function StudentsPage() {
  const firestore = useFirestore();
  const studentsQuery = useMemoFirebase(() => collection(firestore, 'students'), [firestore]);
  const { data: students, isLoading } = useCollection<Student>(studentsQuery);
  const institutionsQuery = useMemoFirebase(() => collection(firestore, 'institutions'), [firestore]);
  const { data: institutions } = useCollection(institutionsQuery);
  
  const [searchTerm, setSearchTerm] = useState('');

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
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full">
                  <UserPlus className="me-2" />
                  تسجيل تلميذ
                </Button>
              </DialogTrigger>
              <StudentForm />
            </Dialog>
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
                <TableHead className="text-white">اللقب والإسم</TableHead>
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
                  <TableCell className="font-medium">{student.firstName} {student.lastName}</TableCell>
                  <TableCell>{student.level ?? 'غير محدد'}</TableCell>
                  <TableCell>
                    {student.gender === 'male' ? '♂' : '♀'}
                  </TableCell>
                  <TableCell>{institutionMap.get(student.institutionId) ?? 'غير محدد'}</TableCell>
                  <TableCell>
                    <Badge variant={student.status === 'active' ? 'default' : 'destructive'} className={student.status === 'active' ? 'bg-green-500' : 'bg-red-500'}>
                      {student.status === 'active' ? 'يمارس' : 'معفي'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700">
                      <Pencil className="h-5 w-5" />
                    </Button>
                     <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700">
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
