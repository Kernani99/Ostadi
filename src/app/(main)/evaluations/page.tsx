
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore } from '@/firebase';
import { useMemoFirebase } from '@/firebase/provider';
import type { Institution, Student, Evaluation, EvaluationCriteria } from '@/lib/types';
import { collection, query, where, writeBatch, doc } from 'firebase/firestore';
import { ChevronLeft, Save, Loader2, Printer, Info } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


export default function EvaluationsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [semester, setSemester] = useState<string>('');
  const [institutionId, setInstitutionId] = useState<string>('');
  const [level, setLevel] = useState<string>('');

  const { data: institutions, isLoading: loadingInstitutions } = useCollection<Institution>(
    useMemoFirebase(() => collection(firestore, 'institutions'), [firestore])
  );

  const handleStartEvaluation = () => {
    if (semester && institutionId && level) {
      if (level === 'أولى ابتدائي') {
        toast({
          title: "لا يمكن التقييم",
          description: "تلاميذ السنة الأولى ابتدائي معفيون من هذا التقييم.",
          variant: "destructive"
        });
        return;
      }
      const params = new URLSearchParams();
      params.set('institutionId', institutionId);
      params.set('level', level);
      params.set('semester', semester);
      const viewUrl = `/evaluations/view?${params.toString()}`;
      window.open(viewUrl, '_blank');
    }
  };

  // When selections change, hide the table to force re-selection.
  useEffect(() => {
    // No more showTable state
  }, [semester, institutionId, level]);
  
  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="flex flex-col items-center gap-2">
        <h1 className="font-bold text-3xl text-center text-primary relative">
          قسم التقييم
          <span className="absolute -bottom-2 start-1/2 -translate-x-1/2 w-20 h-1 bg-accent rounded-full"></span>
        </h1>
      </div>

      <div className="max-w-4xl mx-auto">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>ملاحظة هامة</AlertTitle>
            <AlertDescription>
              حسب التحديثات الأخيرة، تلاميذ السنة الأولى ابتدائي معفيون من التقييم المستمر.
            </AlertDescription>
          </Alert>

          <Card className="shadow-lg mt-6">
          <CardHeader>
              <CardTitle>إعدادات التقييم</CardTitle>
              <CardDescription>الرجاء اختيار الفصل، المؤسسة، والمستوى لفتح جدول التقييم في صفحة جديدة.</CardDescription>
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
                  <Select onValueChange={setInstitutionId} value={institutionId} disabled={loadingInstitutions}>
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

              {institutionId && (
              <div className="space-y-2 pt-4 border-t">
                  <label className="text-sm font-medium">3. اختر المستوى</label>
                  <Select onValueChange={setLevel} value={level}>
                  <SelectTrigger>
                      <SelectValue placeholder="اختر المستوى..." />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="ثانية ابتدائي">ثانية ابتدائي</SelectItem>
                      <SelectItem value="ثالثة ابتدائي">ثالثة ابتدائي</SelectItem>
                      <SelectItem value="رابعة ابتدائي">رابعة ابتدائي</SelectItem>
                      <SelectItem value="خامسة ابتدائي">خامسة ابتدائي</SelectItem>
                  </SelectContent>
                  </Select>
              </div>
              )}

          </CardContent>
           {level && (
              <CardFooter className="flex justify-end pt-6">
                  <Button onClick={handleStartEvaluation} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  عرض جدول التقييم
                  <ChevronLeft className="me-2 h-4 w-4" />
                  </Button>
              </CardFooter>
            )}
          </Card>
      </div>
    </div>
  );
}
