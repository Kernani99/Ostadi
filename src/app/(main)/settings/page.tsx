'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth, useCollection, useFirestore } from "@/firebase";
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useMemoFirebase } from "@/firebase/provider";
import type { Institution } from "@/lib/types";
import { collection, doc } from "firebase/firestore";
import { PlusCircle, Trash2 } from "lucide-react";
import { useState } from "react";

function AddInstitutionForm({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const firestore = useFirestore();
  const [name, setName] = useState('');
  const [municipality, setMunicipality] = useState('');

  const handleSubmit = async () => {
    if (!name || !municipality) {
      // Basic validation
      alert('الرجاء إدخال اسم المؤسسة والبلدية.');
      return;
    }
    const institutionsRef = collection(firestore, 'institutions');
    addDocumentNonBlocking(institutionsRef, { name, municipality });
    setName('');
    setMunicipality('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>إضافة مؤسسة جديدة</DialogTitle>
          <DialogDescription>
            أدخل اسم المؤسسة والبلدية.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              إسم المؤسسة
            </Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="municipality" className="text-right">
              البلدية
            </Label>
            <Input id="municipality" value={municipality} onChange={(e) => setMunicipality(e.target.value)} className="col-span-3" />
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
  const institutionsQuery = useMemoFirebase(() => collection(firestore, 'institutions'), [firestore]);
  const { data: institutions, isLoading } = useCollection<Institution>(institutionsQuery);
  const [isAddModalOpen, setAddModalOpen] = useState(false);

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من أنك تريد حذف هذه المؤسسة؟')) {
        const institutionDocRef = doc(firestore, 'institutions', id);
        deleteDocumentNonBlocking(institutionDocRef);
    }
  }

  return (
    <div className="flex flex-col gap-6">
       <div className="flex flex-col items-center gap-2">
        <h1 className="font-bold text-3xl text-center text-primary relative">
          إدارة الإعدادات
          <span className="absolute -bottom-2 start-1/2 -translate-x-1/2 w-20 h-1 bg-accent rounded-full"></span>
        </h1>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex flex-col">
            <CardTitle className="text-xl">إدارة المؤسسات</CardTitle>
          </div>
          <Dialog open={isAddModalOpen} onOpenChange={setAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full">
                <PlusCircle className="me-2" />
                إضافة مؤسسة
              </Button>
            </DialogTrigger>
            <AddInstitutionForm open={isAddModalOpen} onOpenChange={setAddModalOpen} />
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="bg-card rounded-lg">
              <TableHeader className="bg-primary text-primary-foreground">
                <TableRow>
                  <TableHead className="text-white">#</TableHead>
                  <TableHead className="text-white">إسم المؤسسة</TableHead>
                  <TableHead className="text-white">البلدية</TableHead>
                  <TableHead className="text-white text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && <TableRow><TableCell colSpan={4} className="text-center">جاري تحميل المؤسسات...</TableCell></TableRow>}
                {!isLoading && institutions?.map((inst, index) => (
                  <TableRow key={inst.id} className="hover:bg-muted/50">
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{inst.name}</TableCell>
                    <TableCell>{inst.municipality}</TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(inst.id)} className="text-red-600 hover:text-red-700">
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
    </div>
  );
}
