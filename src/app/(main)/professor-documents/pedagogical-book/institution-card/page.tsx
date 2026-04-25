
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { useCollection, useDoc, useFirestore, useUser } from '@/firebase';
import { useMemoFirebase } from '@/firebase/provider';
import type { Institution, Student, ProfessorProfile } from '@/lib/types';
import { collection, query, where, doc } from 'firebase/firestore';
import { Loader2, Printer, Building, Info } from 'lucide-react';
import Image from 'next/image';

const DataRow = ({ label, value }: { label: string; value: string | number | undefined }) => (
  <div className="flex justify-between border-b p-3 text-sm">
    <dt className="font-semibold text-gray-700">{label}</dt>
    <dd className="text-gray-900">{value ?? 'غير متوفر'}</dd>
  </div>
);

export default function InstitutionCardPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>('');

  const { data: institutions, isLoading: loadingInstitutions } = useCollection<Institution>(
    useMemoFirebase(() => user ? query(collection(firestore, 'institutions'), where('userId', '==', user.uid)) : null, [firestore, user])
  );

  const studentsQuery = useMemoFirebase(() =>
    selectedInstitutionId && user
      ? query(collection(firestore, 'students'), where('institutionId', '==', selectedInstitutionId), where('userId', '==', user.uid))
      : null,
    [firestore, selectedInstitutionId, user]
  );
  const { data: students, isLoading: loadingStudents } = useCollection<Student>(studentsQuery);
  
  const profileDocRef = useMemoFirebase(() => user ? doc(firestore, 'professor_profile', user.uid) : null, [firestore, user]);
  const { data: profileData, isLoading: loadingProfile } = useDoc<ProfessorProfile>(profileDocRef);

  const selectedInstitution = useMemo(() =>
    institutions?.find(inst => inst.id === selectedInstitutionId),
    [institutions, selectedInstitutionId]
  );

  const stats = useMemo(() => {
    if (!students) return { total: 0, males: 0, females: 0 };
    return {
      total: students.length,
      males: students.filter(s => s.gender === 'male').length,
      females: students.filter(s => s.gender === 'female').length,
    };
  }, [students]);

  const isLoading = loadingInstitutions || loadingStudents || loadingProfile;

  const handlePrint = () => {
    window.print();
  }

  return (
    <div className="container mx-auto p-4 space-y-8 bg-gray-50 min-h-screen">
       <style>{`
          @media print {
            body {
              background-color: white;
            }
            .no-print {
              display: none !important;
            }
            .print-container {
              padding: 0;
              margin: 0;
              border: none;
              box-shadow: none;
            }
            @page {
              size: A4 portrait;
              margin: 2cm;
            }
          }
      `}</style>
      
      <div className="flex flex-col items-center gap-2 no-print">
        <h1 className="font-bold text-3xl text-center text-primary relative">
          البطاقة الفنية للمؤسسة
          <span className="absolute -bottom-2 start-1/2 -translate-x-1/2 w-20 h-1 bg-accent rounded-full"></span>
        </h1>
        <p className="text-muted-foreground text-center">اختر مؤسسة لعرض بطاقتها الفنية المفصلة.</p>
      </div>

      <Card className="w-full max-w-4xl mx-auto no-print">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="text-primary" />
            اختر المؤسسة
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 items-center">
          <Select
            onValueChange={setSelectedInstitutionId}
            value={selectedInstitutionId}
            disabled={loadingInstitutions}
          >
            <SelectTrigger className="flex-grow">
              <SelectValue placeholder="اختر مؤسسة من القائمة..." />
            </SelectTrigger>
            <SelectContent>
              {institutions?.map(inst => (
                <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handlePrint} disabled={!selectedInstitutionId}>
            <Printer className="me-2"/> طباعة
          </Button>
        </CardContent>
      </Card>
      
      {isLoading && selectedInstitutionId ? (
         <div className="flex items-center justify-center p-8">
            <Loader2 className="animate-spin h-8 w-8 text-primary"/>
            <p className="ms-2">جاري تحميل البيانات...</p>
         </div>
      ) : selectedInstitution ? (
         <div className="print-container bg-white p-8 rounded-lg shadow-lg border max-w-4xl mx-auto" dir="rtl">
            <header className="text-center mb-8 space-y-2">
                <div className="flex justify-between items-center">
                    <Image src="https://firebasestorage.googleapis.com/v0/b/studio-3773063615-aada3.appspot.com/o/resources%2Falgeria-flag.png?alt=media&token=38337a28-2e11-43b3-9022-38ceb3252573" alt="علم الجزائر" width={60} height={40} />
                    <h1 className="text-2xl font-bold text-green-700">البطاقة الفنية للمؤسسة</h1>
                    <Image src="https://firebasestorage.googleapis.com/v0/b/studio-3773063615-aada3.appspot.com/o/resources%2Fministry-logo.png?alt=media&token=1d7ab8c9-c12e-436f-b258-057917849e7b" alt="شعار وزارة التربية" width={60} height={60} />
                </div>
                <h2 className="text-lg font-semibold text-red-600">مديرية التربية لولاية: {profileData?.wilaya || '...'}</h2>
                <p className="text-gray-600">العام الدراسي: {profileData?.schoolYear || '...'}</p>
            </header>

            <main>
                <dl className="bg-gray-50 rounded-lg border border-gray-200">
                    <DataRow label="مديرية التربية لولاية" value={profileData?.wilaya} />
                    <DataRow label="اسم المؤسسة" value={selectedInstitution.name} />
                    <DataRow label="نوع المؤسسة" value={selectedInstitution.type} />
                    <DataRow label="البلدية" value={selectedInstitution.municipality} />
                    <DataRow label="المقاطعة" value={undefined} />
                    <DataRow label="رقم الهاتف" value={undefined} />
                    <DataRow label="عدد الأساتذة" value={undefined} />
                    <DataRow label="عدد أساتذة التربية البدنية" value={1} />
                    <DataRow label="عدد التلاميذ" value={stats.total} />
                    <DataRow label="عدد الذكور" value={stats.males} />
                    <DataRow label="عدد الإناث" value={stats.females} />
                    <DataRow label="عدد الملاعب" value={undefined} />
                    <DataRow label="عدد الإداريين" value={undefined} />
                    <DataRow label="عدد العمال المهنيين" value={undefined} />
                    <DataRow label="السنة الدراسية" value={profileData?.schoolYear} />
                </dl>
            </main>
            
            <footer className="text-center mt-8 text-xs text-gray-500">
                <p>EPS ALGERIA © {new Date().getFullYear()}</p>
            </footer>
        </div>
      ) : (
        <Card className="w-full max-w-4xl mx-auto">
             <CardContent className="p-8 text-center text-muted-foreground">
                <Info className="mx-auto h-12 w-12 mb-4" />
                <p>الرجاء اختيار مؤسسة من القائمة أعلاه لعرض بطاقتها الفنية.</p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}

    