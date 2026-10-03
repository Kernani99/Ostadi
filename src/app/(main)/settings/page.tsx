'use client';
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCollection, useFirestore, useUser } from "@/firebase";
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useMemoFirebase } from "@/firebase/provider";
import type { Institution } from "@/lib/types";
import { collection, doc, getDocs, limit, query, where } from "firebase/firestore";
import { PlusCircle, Trash2, CreditCard, FileDown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


function AddInstitutionForm({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const firestore = useFirestore();
  const { user } = useUser();
  const [name, setName] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [type, setType] = useState('');
  const {toast} = useToast();

  const handleSubmit = async () => {
    if (!user) {
        toast({title: 'خطأ', description: 'يجب تسجيل الدخول لإضافة مؤسسة.', variant: 'destructive'});
        return;
    }
    if (!name.trim() || !municipality.trim() || !type) {
      toast({title: 'بيانات ناقصة', description: 'الرجاء إدخال اسم المؤسسة، البلدية، ونوع المؤسسة.', variant: 'destructive'});
      return;
    }
    try {
      await addDocumentNonBlocking(collection(firestore, 'institutions'), {
        name: name.trim(),
        municipality: municipality.trim(),
        type,
        userId: user.uid,
      });
    } catch {
      return; // التنبيه يصدر من مستمع أخطاء الصلاحيات
    }
    toast({title: 'تم الحفظ', description: `تمت إضافة مؤسسة ${name.trim()} بنجاح.`, variant: 'success'});
    setName('');
    setMunicipality('');
    setType('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>إضافة مؤسسة جديدة</DialogTitle>
          <DialogDescription>
            أدخل تفاصيل المؤسسة الجديدة.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              إسم المؤسسة
            </Label>
            <Input id="name" maxLength={200} value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="municipality" className="text-right">
              البلدية
            </Label>
            <Input id="municipality" maxLength={200} value={municipality} onChange={(e) => setMunicipality(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              النوع
            </Label>
             <Select onValueChange={setType} value={type}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="اختر نوع المؤسسة" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ابتدائية">ابتدائية</SelectItem>
                    <SelectItem value="متوسطة">متوسطة</SelectItem>
                    <SelectItem value="ثانوية">ثانوية</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit}>حفظ المؤسسة</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function SettingsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const institutionsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'institutions'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: institutions, isLoading } = useCollection<Institution>(institutionsQuery);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [institutionToDelete, setInstitutionToDelete] = useState<Institution | null>(null);

  const handleDelete = (inst: Institution) => {
    setInstitutionToDelete(inst);
  };
  
  const confirmDelete = async () => {
      if (!institutionToDelete || !user) return;
      const target = institutionToDelete;
      setInstitutionToDelete(null);
      try {
        // حذف مؤسسة ما زالت مرتبطة بتلاميذ أو أقسام يترك بيانات يتيمة لا تظهر في أي قائمة.
        const linked = (name: string) =>
          getDocs(query(collection(firestore, name), where('userId', '==', user.uid), where('institutionId', '==', target.id), limit(1)));
        const [students, departments] = await Promise.all([linked('students'), linked('departments')]);
        if (!students.empty || !departments.empty) {
          toast({
            title: 'لا يمكن حذف المؤسسة',
            description: 'ما زالت مرتبطة بتلاميذ أو أقسام. انقلهم أو احذفهم أولاً.',
            variant: 'destructive',
          });
          return;
        }
        await deleteDocumentNonBlocking(doc(firestore, 'institutions', target.id));
        toast({title: 'تم الحذف', description: `تم حذف مؤسسة ${target.name} بنجاح.`, variant: 'success'});
      } catch {
        toast({ title: 'تعذّر الحذف', description: 'حاول مرة أخرى.', variant: 'destructive' });
      }
  }

  const handleExport = async () => {
    if (!institutions || institutions.length === 0) {
      toast({ title: "لا توجد بيانات للتصدير", variant: "destructive"});
      return;
    }
    const dataToExport = institutions.map(({ id, userId, ...rest }) => rest);
    // مكتبة الجداول ثقيلة: تُحمَّل عند أول تصدير فقط.
    const XLSX = await import('xlsx');
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "المؤسسات");
    XLSX.writeFile(workbook, "قائمة_المؤسسات.xlsx");
  }

  return (
    <div className="flex flex-col gap-6">
       <PageHeader title="الإعدادات" description="البطاقة الفنية والمؤسسات التي تدرّس بها." />
      
      <Card >
        <CardHeader>
            <CardTitle>البطاقة الفنية</CardTitle>
        </CardHeader>
        <CardContent>
            <Link href="/settings/technical-card">
              <Button>
                <CreditCard />
                تعديل البطاقة الفنية
              </Button>
            </Link>
        </CardContent>
      </Card>

      <Card >
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex flex-col">
            <CardTitle>إدارة المؤسسات</CardTitle>
          </div>
          <div className="flex items-center gap-2">
             <Button onClick={handleExport} variant="outline">
                <FileDown />
                تصدير إلى Excel
              </Button>
            <Dialog open={isAddModalOpen} onOpenChange={setAddModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle />
                  إضافة مؤسسة
                </Button>
              </DialogTrigger>
              <AddInstitutionForm open={isAddModalOpen} onOpenChange={setAddModalOpen} />
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>إسم المؤسسة</TableHead>
                  <TableHead>البلدية</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead className="text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && <TableRow><TableCell colSpan={5} className="text-center">جاري تحميل المؤسسات...</TableCell></TableRow>}
                {!isLoading && institutions?.map((inst, index) => (
                  <TableRow key={inst.id} className="hover:bg-muted/50">
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{inst.name}</TableCell>
                    <TableCell>{inst.municipality}</TableCell>
                    <TableCell>{inst.type || 'غير محدد'}</TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(inst)} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <AlertDialog open={!!institutionToDelete} onOpenChange={(open) => !open && setInstitutionToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
                <AlertDialogDescription>
                    سيؤدي هذا إلى حذف مؤسسة "{institutionToDelete?.name}" بشكل دائم. لا يمكن التراجع عن هذا الإجراء.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setInstitutionToDelete(null)}>إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">تأكيد الحذف</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
