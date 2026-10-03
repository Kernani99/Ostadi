'use client';

import { PageHeader } from "@/components/layout/page-header";
import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFirestore, useUser } from '@/firebase';
import { useMemoFirebase } from '@/firebase/provider';
import type { Institution, Student, DiagnosticValue } from '@/lib/types';
import { DIAGNOSTIC_LEVELS, diagnosticTitle, getDiagnosticGroups, getDiagnosticIndicators } from '@/lib/diagnostic-criteria';
import {
  collection, query, where, doc,
  getDoc, setDoc, getDocs,
} from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { Loader2, Printer, Save, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Ratings = { [studentId: string]: { [indicatorId: string]: DiagnosticValue } };

export default function DiagnosticPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [institutionId, setInstitutionId] = useState('');
  const [level, setLevel] = useState('');
  const [ratings, setRatings] = useState<Ratings>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingEvals, setIsLoadingEvals] = useState(false);

  const groups = useMemo(() => getDiagnosticGroups(level), [level]);
  const indicators = useMemo(() => getDiagnosticIndicators(level), [level]);

  // جلب المؤسسات
  const { data: institutions, isLoading: loadingInstitutions } = useCollection<Institution>(
    useMemoFirebase(
      () => user ? query(collection(firestore, 'institutions'), where('userId', '==', user.uid)) : null,
      [firestore, user]
    )
  );

  // جلب التلاميذ
  const studentsQuery = useMemoFirebase(() => {
    if (!user || !institutionId || !level) return null;
    return query(
      collection(firestore, 'students'),
      where('institutionId', '==', institutionId),
      where('level', '==', level),
      where('userId', '==', user.uid)
    );
  }, [firestore, user, institutionId, level]);
  const { data: students, isLoading: loadingStudents } = useCollection<Student>(studentsQuery);

  const sortedStudents = useMemo(
    () => [...(students || [])].sort((a, b) =>
      `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, 'ar')
    ),
    [students]
  );

  // ── استراتيجية القراءة الجديدة ────────────────────────────────
  // نستخدم مستنداً واحداً بمعرّف ثابت بدل استعلام متعدد الشروط
  // المعرّف: diag_{userId}_{institutionId}_{level_encoded}
  const diagDocId = useMemo(() => {
    if (!user || !institutionId || !level) return null;
    const encoded = level.replace(/\s+/g, '_');
    return `diag_${user.uid}_${institutionId}_${encoded}`;
  }, [user, institutionId, level]);

  // قراءة بيانات التقييم باستخدام getDoc (لا يحتاج composite index)
  const loadEvals = useCallback(async () => {
    if (!diagDocId) { setRatings({}); return; }
    setIsLoadingEvals(true);
    try {
      const snap = await getDoc(doc(firestore, 'diagnostic_evaluations', diagDocId));
      if (snap.exists()) {
        setRatings((snap.data() as any).ratings || {});
      } else {
        setRatings({});
      }
    } catch (e) {
      console.error('load evals error:', e);
      setRatings({});
    } finally {
      setIsLoadingEvals(false);
    }
  }, [firestore, diagDocId]);

  useEffect(() => {
    loadEvals();
  }, [loadEvals]);

  // ── تغيير قيمة خانة ────────────────────────────────
  const setValue = (studentId: string, indicatorId: string, value: 0 | 1) => {
    setRatings(prev => {
      const current = prev[studentId]?.[indicatorId];
      return {
        ...prev,
        [studentId]: { ...prev[studentId], [indicatorId]: current === value ? null : value },
      };
    });
  };

  // ── الحفظ (مستند واحد يحتوي كل نتائج القسم) ────────────────
  const handleSave = async () => {
    if (!user || !diagDocId) return;
    setIsSaving(true);
    try {
      await setDoc(
        doc(firestore, 'diagnostic_evaluations', diagDocId),
        {
          userId: user.uid,
          institutionId,
          level,
          ratings,
          updatedAt: new Date().toISOString(),
        },
        { merge: false }
      );
      toast({ title: 'تم الحفظ بنجاح', description: 'تم حفظ نتائج التقويم التشخيصي.', variant: 'success' });
    } catch (e: any) {
      console.error(e);
      toast({ title: 'خطأ', description: e?.message || 'حدث خطأ أثناء الحفظ.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    const params = new URLSearchParams({ institutionId, level });
    window.open(`/diagnostic/print?${params.toString()}`, '_blank');
  };

  const isLoading = loadingStudents || isLoadingEvals;
  const hasIndicators = indicators.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader title="التقييم التشخيصي" />

      {/* ── اختيار المؤسسة والمستوى ── */}
      <Card>
        <CardHeader>
          <CardTitle>اختيار القسم</CardTitle>
          <CardDescription>اختر المؤسسة ثم المستوى ليظهر جدول التلاميذ ومؤشرات التقويم التشخيصي.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">1. المؤسسة</label>
            <Select value={institutionId} onValueChange={v => { setInstitutionId(v); setLevel(''); setRatings({}); }} disabled={loadingInstitutions}>
              <SelectTrigger><SelectValue placeholder="اختر المؤسسة..." /></SelectTrigger>
              <SelectContent>
                {institutions?.map(inst => <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">2. المستوى</label>
            <Select value={level} onValueChange={setLevel} disabled={!institutionId}>
              <SelectTrigger><SelectValue placeholder="اختر المستوى..." /></SelectTrigger>
              <SelectContent>
                {DIAGNOSTIC_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ── لم تُضف مؤشرات لهذا المستوى ── */}
      {institutionId && level && !hasIndicators && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            لم تُضف مؤشرات التقويم التشخيصي لمستوى «{level}» بعد.
          </CardContent>
        </Card>
      )}

      {/* ── جدول التقويم ── */}
      {institutionId && level && hasIndicators && (
        <Card >
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle>{diagnosticTitle(level)}</CardTitle>
              <CardDescription>
                لكل مؤشر خانتان: <b>1</b> (متحقق) و <b className="text-destructive">0</b> (غير متحقق).
                اضغط على الخانة لاختيارها، واضغط عليها مرة أخرى لإلغائها.
              </CardDescription>
            </div>
            <Button onClick={handlePrint} variant="outline" size="icon" disabled={sortedStudents.length === 0}>
              <Printer className="h-5 w-5" />
              <span className="sr-only">طباعة</span>
            </Button>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="animate-spin h-8 w-8" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="border min-w-full">
                  <TableHeader>
                    {/* صف 1: المجموعات */}
                    <TableRow>
                      <TableHead
                        rowSpan={4}
                        className="border-e min-w-[200px] align-middle text-center"
                      >
                        اللقب والاسم
                      </TableHead>
                      {groups.map(g => (
                        <TableHead
                          key={g.name}
                          colSpan={g.criteria.reduce((a, c) => a + c.indicators.length * 2, 0)}
                          className="text-center border-s bg-muted/50"
                        >
                          {g.name}
                        </TableHead>
                      ))}
                    </TableRow>
                    {/* صف 2: المعايير */}
                    <TableRow>
                      {groups.flatMap(g => g.criteria).map(c => (
                        <TableHead
                          key={c.id}
                          colSpan={c.indicators.length * 2}
                          className="text-center text-xs p-2 border-s"
                        >
                          {c.name}
                        </TableHead>
                      ))}
                    </TableRow>
                    {/* صف 3: أرقام المؤشرات */}
                    <TableRow>
                      {indicators.map((ind, idx) => (
                        <TableHead
                          key={ind.id}
                          colSpan={2}
                          className="text-center text-xs p-1 border-s min-w-[90px] font-normal"
                        >
                          المؤشر {(idx % 3) + 1}
                        </TableHead>
                      ))}
                    </TableRow>
                    {/* صف 4: 1 / 0 */}
                    <TableRow>
                      {indicators.flatMap(ind => [
                        <TableHead key={`${ind.id}-1`} className="text-center p-1 border-s h-8 w-10">1</TableHead>,
                        <TableHead key={`${ind.id}-0`} className="text-center p-1 h-8 w-10 text-destructive">0</TableHead>,
                      ])}
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {sortedStudents.length > 0 ? (
                      sortedStudents.map((s, i) => (
                        <TableRow key={s.id}>
                          <TableCell className="border-e font-medium">
                            {i + 1}- {s.lastName} {s.firstName}
                          </TableCell>
                          {indicators.flatMap(ind => {
                            const value = ratings[s.id]?.[ind.id];
                            return [
                              <TableCell key={`${ind.id}-1`} className="p-1 border-s text-center">
                                <button
                                  type="button"
                                  onClick={() => setValue(s.id, ind.id, 1)}
                                  className={cn(
                                    'h-8 w-8 rounded border mx-auto flex items-center justify-center hover:bg-muted transition-colors',
                                    value === 1 && 'border-success bg-success/15 text-success'
                                  )}
                                >
                                  {value === 1 && <Check className="h-4 w-4" />}
                                </button>
                              </TableCell>,
                              <TableCell key={`${ind.id}-0`} className="p-1 text-center">
                                <button
                                  type="button"
                                  onClick={() => setValue(s.id, ind.id, 0)}
                                  className={cn(
                                    'h-8 w-8 rounded border mx-auto flex items-center justify-center hover:bg-muted transition-colors',
                                    value === 0 && 'border-destructive bg-destructive/10 text-destructive'
                                  )}
                                >
                                  {value === 0 && <Check className="h-4 w-4" />}
                                </button>
                              </TableCell>,
                            ];
                          })}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={indicators.length * 2 + 1}
                          className="h-24 text-center text-muted-foreground"
                        >
                          لا يوجد تلاميذ في هذا المستوى.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>

          <CardFooter className="justify-end">
            <Button onClick={handleSave} disabled={isSaving || sortedStudents.length === 0}>
              {isSaving ? <Loader2 className="animate-spin me-2" /> : <Save />}
              حفظ التقييم
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
