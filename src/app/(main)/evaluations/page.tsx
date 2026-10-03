
'use client';

import { PageHeader } from "@/components/layout/page-header";
import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { useMemoFirebase } from '@/firebase/provider';
import type { Institution } from '@/lib/types';
import { collection, query, where } from 'firebase/firestore';
import { ChevronLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function EvaluationsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [semester, setSemester] = useState<string>('');
  const [institutionId, setInstitutionId] = useState<string>('');
  const [level, setLevel] = useState<string>('');

  const { data: institutions, isLoading: loadingInstitutions } = useCollection<Institution>(
    useMemoFirebase(() => user ? query(collection(firestore, 'institutions'), where('userId', '==', user.uid)) : null, [firestore, user])
  );

  const handleStartEvaluation = () => {
    if (semester && institutionId && level) {
      const params = new URLSearchParams();
      params.set('institutionId', institutionId);
      params.set('level', level);
      params.set('semester', semester);
      const viewUrl = `/evaluations/view?${params.toString()}`;
      window.open(viewUrl, '_blank');
    } else {
        toast({
            title: "بيانات ناقصة",
            description: "الرجاء اختيار الفصل، المؤسسة، والمستوى أولاً.",
            variant: "destructive"
        })
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="التقييم المستمر" description="اختر الفصل والمؤسسة والمستوى لفتح شبكة التقييم في تبويب جديد." />

      <div className="max-w-3xl">
          <Card>
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
                      <SelectItem value="أولى ابتدائي">أولى ابتدائي</SelectItem>
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
                  <Button onClick={handleStartEvaluation}>
                  عرض جدول التقييم
                  <ChevronLeft />
                  </Button>
              </CardFooter>
            )}
          </Card>
      </div>
    </div>
  );
}
