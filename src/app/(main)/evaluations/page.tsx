
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore } from '@/firebase';
import { useMemoFirebase } from '@/firebase/provider';
import type { Institution } from '@/lib/types';
import { collection } from 'firebase/firestore';
import { ChevronRight } from 'lucide-react';

export default function EvaluationsPage() {
  const firestore = useFirestore();
  const [semester, setSemester] = useState<string>('');
  const [institution, setInstitution] = useState<string>('');
  const [level, setLevel] = useState<string>('');

  const { data: institutions, isLoading: loadingInstitutions } = useCollection<Institution>(
    useMemoFirebase(() => collection(firestore, 'institutions'), [firestore])
  );

  const handleStartEvaluation = () => {
    // Logic to proceed to the evaluation table/form will be added here.
    alert(`بدء التقييم لـ:\nالفصل: ${semester}\nالمؤسسة: ${institution}\nالمستوى: ${level}`);
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="flex flex-col items-center gap-2">
        <h1 className="font-bold text-3xl text-center text-primary relative">
          قسم التقييم
          <span className="absolute -bottom-2 start-1/2 -translate-x-1/2 w-20 h-1 bg-accent rounded-full"></span>
        </h1>
      </div>

      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>إعدادات التقييم</CardTitle>
            <CardDescription>الرجاء اختيار الفصل، المؤسسة، والمستوى للبدء.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">1. اختر الفصل الدراسي</label>
              <Select onValueChange={setSemester} value={semester}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الفصل..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">الفصل الأول</SelectItem>
                  <SelectItem value="2">الفصل الثاني</SelectItem>
                  <SelectItem value="3">الفصل الثالث</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {semester && (
              <div className="space-y-2 pt-4 border-t">
                <label className="text-sm font-medium">2. اختر المؤسسة</label>
                <Select onValueChange={setInstitution} value={institution} disabled={loadingInstitutions}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المؤسسة..." />
                  </SelectTrigger>
                  <SelectContent>
                    {institutions?.map(inst => (
                      <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {institution && (
              <div className="space-y-2 pt-4 border-t">
                <label className="text-sm font-medium">3. اختر المستوى</label>
                <Select onValueChange={setLevel} value={level}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المستوى..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="أولى ابتدائي">أولى ابتدائي</SelectItem>
                    <SelectItem value="ثانية ابتدائي">ثانية ابتدائي</SelectItem>
                    <SelectItem value="ثالثة ابتدائي">ثالثة ابتدائي</SelectItem>
                    <SelectItem value="رابعة ابتدائي">رابعة ابتدائي</SelectItem>
                    <SelectItem value="خامسة ابتدائي">خامسة ابتدائي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {level && (
              <div className="flex justify-end pt-6">
                <Button onClick={handleStartEvaluation} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  بدء عملية التقييم
                  <ChevronRight className="me-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* The evaluation content/table will be rendered here based on the selections */}
      {level && (
        <div className="mt-8">
            {/* Placeholder for the evaluation table or components */}
            <Card>
                <CardHeader><CardTitle>جدول التقييم</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">سيتم عرض جدول تقييم التلاميذ هنا...</p>
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}
