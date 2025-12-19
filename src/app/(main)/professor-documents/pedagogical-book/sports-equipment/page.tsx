
'use client';

import { useState, useMemo, FC, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Check, X, Package, PackagePlus, Trash2, Pencil, Printer, Search } from 'lucide-react';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { useMemoFirebase } from '@/firebase/provider';
import { collection, query, where, doc, writeBatch } from 'firebase/firestore';
import type { SportsEquipment } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Badge } from '@/components/ui/badge';

const StatCard = ({ title, value, icon, color }: { title: string, value: number, icon: React.ElementType, color?: string }) => {
    const Icon = icon;
    return (
        <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className={`h-5 w-5 ${color || 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    );
};

const equipmentSchema = z.object({
  name: z.string().min(1, "اسم الوسيلة مطلوب"),
  goodCondition: z.coerce.number().min(0, "العدد يجب أن يكون صفراً أو أكثر"),
  badCondition: z.coerce.number().min(0, "العدد يجب أن يكون صفراً أو أكثر"),
});

type EquipmentFormValues = z.infer<typeof equipmentSchema>;

interface EquipmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment?: SportsEquipment | null;
}

const EquipmentForm: FC<EquipmentFormProps> = ({ open, onOpenChange, equipment }) => {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const form = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: equipment ? {
      name: equipment.name,
      goodCondition: equipment.goodCondition,
      badCondition: equipment.badCondition,
    } : {
      name: '',
      goodCondition: 0,
      badCondition: 0,
    }
  });

  useEffect(() => {
    if (open) {
      form.reset(equipment ? {
        name: equipment.name,
        goodCondition: equipment.goodCondition,
        badCondition: equipment.badCondition,
      } : {
        name: '',
        goodCondition: 0,
        badCondition: 0,
      });
    }
  }, [equipment, open, form]);

  const onSubmit = async (data: EquipmentFormValues) => {
    if (!user) {
      toast({ title: "خطأ", description: "يجب تسجيل الدخول.", variant: "destructive" });
      return;
    }
    const totalQuantity = data.goodCondition + data.badCondition;
    const equipmentData = { ...data, totalQuantity, userId: user.uid };

    if (equipment) {
      await setDocumentNonBlocking(doc(firestore, 'sports_equipment', equipment.id), equipmentData, { merge: true });
      toast({ title: "تم التحديث", description: `تم تحديث ${data.name}.` });
    } else {
      await addDocumentNonBlocking(collection(firestore, 'sports_equipment'), equipmentData);
      toast({ title: "تمت الإضافة", description: `تمت إضافة ${data.name} إلى السجل.` });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{equipment ? 'تعديل وسيلة' : 'إضافة وسيلة جديدة'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>اسم الوسيلة</FormLabel>
                <FormControl><Input placeholder="مثال: أقماع" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="goodCondition" render={({ field }) => (
              <FormItem>
                <FormLabel>الكمية الصالحة</FormLabel>
                <FormControl><Input type="number" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="badCondition" render={({ field }) => (
              <FormItem>
                <FormLabel>الكمية غير الصالحة</FormLabel>
                <FormControl><Input type="number" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="submit">حفظ</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default function SportsEquipmentPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setFormOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<SportsEquipment | null>(null);
  const [equipmentToDelete, setEquipmentToDelete] = useState<SportsEquipment | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());


  const equipmentQuery = useMemoFirebase(
    () => user ? query(collection(firestore, 'sports_equipment'), where('userId', '==', user.uid)) : null,
    [firestore, user]
  );
  const { data: equipment, isLoading } = useCollection<SportsEquipment>(equipmentQuery);

  const stats = useMemo(() => {
    if (!equipment) return { totalTypes: 0, totalPieces: 0, totalGood: 0, totalBad: 0 };
    return equipment.reduce((acc, item) => {
      acc.totalPieces += item.totalQuantity;
      acc.totalGood += item.goodCondition;
      acc.totalBad += item.badCondition;
      return acc;
    }, { totalTypes: equipment.length, totalPieces: 0, totalGood: 0, totalBad: 0 });
  }, [equipment]);

  const filteredEquipment = useMemo(() => {
    if (!equipment) return [];
    return equipment.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [equipment, searchTerm]);
  
  const handleEdit = (item: SportsEquipment) => {
    setSelectedEquipment(item);
    setFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedEquipment(null);
    setFormOpen(true);
  };

  const handleDelete = (item: SportsEquipment) => {
    setEquipmentToDelete(item);
  };
  
  const confirmDelete = async () => {
    if(equipmentToDelete) {
        await deleteDocumentNonBlocking(doc(firestore, 'sports_equipment', equipmentToDelete.id));
        toast({ title: 'تم الحذف', description: `تم حذف ${equipmentToDelete.name}` });
        setEquipmentToDelete(null);
    }
  };

  const handleSelect = (id: string) => {
    setSelectedItems(prev => {
        const newSelection = new Set(prev);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        return newSelection;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.size === 0) return;
    const batch = writeBatch(firestore);
    selectedItems.forEach(id => {
      batch.delete(doc(firestore, 'sports_equipment', id));
    });
    await batch.commit();
    toast({ title: `تم حذف ${selectedItems.size} عنصر` });
    setSelectedItems(new Set());
  };

  const handlePrint = () => {
    const printWindow = window.open('/professor-documents/pedagogical-book/sports-equipment/print', '_blank');
    printWindow?.focus();
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <EquipmentForm open={isFormOpen} onOpenChange={setFormOpen} equipment={selectedEquipment} />
      <AlertDialog open={!!equipmentToDelete} onOpenChange={(open) => !open && setEquipmentToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                <AlertDialogDescription>
                    سيتم حذف هذا العنصر بشكل دائم. لا يمكن التراجع عن هذا الإجراء.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setEquipmentToDelete(null)}>إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">حذف</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">سجل العتاد الرياضي</h1>
          <p className="text-muted-foreground">إدارة وتنظيم قائمة العتاد الرياضي المتوفر</p>
        </div>
        <Button variant="outline" onClick={handlePrint}><Printer className="me-2" /> طباعة السجل</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="مجموع أنواع العتاد" value={stats.totalTypes} icon={Package} />
        <StatCard title="مجموع القطع" value={stats.totalPieces} icon={Package} />
        <StatCard title="صالحة" value={stats.totalGood} icon={Check} color="text-green-500" />
        <StatCard title="غير صالحة" value={stats.totalBad} icon={X} color="text-red-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex-row items-center gap-4">
                  <PackagePlus className="h-8 w-8 text-primary"/>
                  <div>
                      <CardTitle>إضافة وسيلة</CardTitle>
                      <CardDescription>إضافة وسيلة جديدة إلى قائمة العتاد الرياضي</CardDescription>
                  </div>
              </CardHeader>
              <CardContent>
                  <Button className="w-full" onClick={handleAddNew}>إضافة</Button>
              </CardContent>
          </Card>
           <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex-row items-center gap-4">
                  <Pencil className="h-8 w-8 text-primary"/>
                  <div>
                      <CardTitle>تعديل وسيلة</CardTitle>
                      <CardDescription>تعديل معلومات وسيلة موجودة في القائمة</CardDescription>
                  </div>
              </CardHeader>
              <CardContent>
                 <Button className="w-full" variant="secondary" disabled={selectedItems.size !== 1} onClick={() => handleEdit(filteredEquipment.find(item => item.id === Array.from(selectedItems)[0])!)}>تعديل المحدد</Button>
              </CardContent>
          </Card>
           <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex-row items-center gap-4">
                  <Trash2 className="h-8 w-8 text-destructive"/>
                  <div>
                      <CardTitle>حذف وسيلة</CardTitle>
                      <CardDescription>حذف وسيلة من قائمة العتاد الرياضي</CardDescription>
                  </div>
              </CardHeader>
               <CardContent>
                 <Button className="w-full" variant="destructive" disabled={selectedItems.size === 0} onClick={handleDeleteSelected}>حذف المحدد</Button>
              </CardContent>
          </Card>
      </div>

      <Card>
        <CardHeader className="bg-primary/90 text-primary-foreground rounded-t-lg">
          <CardTitle>قائمة العتاد الرياضي</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="flex justify-end">
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="ابحث: مثال بحث" className="ps-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">اختيار</TableHead>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>الوسيلة</TableHead>
                  <TableHead>الكمية الإجمالية</TableHead>
                  <TableHead>صالحة</TableHead>
                  <TableHead>غير صالحة</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center">جاري تحميل البيانات...</TableCell></TableRow>
                ) : filteredEquipment.length > 0 ? (
                  filteredEquipment.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <input type="checkbox" checked={selectedItems.has(item.id)} onChange={() => handleSelect(item.id)} />
                      </TableCell>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.totalQuantity}</TableCell>
                      <TableCell><Badge className="bg-green-500 hover:bg-green-600">{item.goodCondition}</Badge></TableCell>
                      <TableCell><Badge variant="destructive">{item.badCondition}</Badge></TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon" className="text-yellow-500 hover:text-yellow-600" onClick={() => handleEdit(item)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(item)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={7} className="text-center h-24">لا توجد بيانات لعرضها.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    

    