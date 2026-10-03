'use client';

import { Suspense, useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDoc, useFirestore, useUser } from '@/firebase';
import { useMemoFirebase } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { Student, Institution, ProfessorProfile } from '@/lib/types';
import { diagnosticTitle, getDiagnosticGroups, getDiagnosticIndicators } from '@/lib/diagnostic-criteria';
import { collection, query, where, doc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

function PrintContent() {
  const firestore = useFirestore();
  const { user } = useUser();
  const searchParams = useSearchParams();
  const institutionId = searchParams.get('institutionId') || '';
  const level = searchParams.get('level') || '';

  const [ratings, setRatings] = useState<{ [studentId: string]: { [indicatorId: string]: 0 | 1 | null } }>({});
  const [loadingEvals, setLoadingEvals] = useState(false);

  const profileRef = useMemoFirebase(
    () => user ? doc(firestore, 'professor_profile', user.uid) : null,
    [firestore, user]
  );
  const { data: profile, isLoading: loadingProfile } = useDoc<ProfessorProfile>(profileRef);

  const institutionRef = useMemoFirebase(
    () => institutionId && user ? doc(firestore, 'institutions', institutionId) : null,
    [firestore, institutionId, user]
  );
  const { data: institution, isLoading: loadingInstitution } = useDoc<Institution>(institutionRef);

  const studentsQuery = useMemoFirebase(() => {
    if (!institutionId || !level || !user) return null;
    return query(
      collection(firestore, 'students'),
      where('institutionId', '==', institutionId),
      where('level', '==', level),
      where('userId', '==', user.uid)
    );
  }, [firestore, institutionId, level, user]);
  const { data: students, isLoading: loadingStudents } = useCollection<Student>(studentsQuery);

  // جلب التقييم من مستند واحد (نفس استراتيجية صفحة الإدخال)
  const diagDocId = useMemo(() => {
    if (!user || !institutionId || !level) return null;
    const encoded = level.replace(/\s+/g, '_');
    return `diag_${user.uid}_${institutionId}_${encoded}`;
  }, [user, institutionId, level]);

  const loadEvals = useCallback(async () => {
    if (!diagDocId) return;
    setLoadingEvals(true);
    try {
      const snap = await getDoc(doc(firestore, 'diagnostic_evaluations', diagDocId));
      setRatings(snap.exists() ? ((snap.data() as any).ratings || {}) : {});
    } catch (e) {
      console.error(e);
      setRatings({});
    } finally {
      setLoadingEvals(false);
    }
  }, [firestore, diagDocId]);

  useEffect(() => { loadEvals(); }, [loadEvals]);

  const groups = useMemo(() => getDiagnosticGroups(level), [level]);
  const indicators = useMemo(() => getDiagnosticIndicators(level), [level]);
  const criteria = useMemo(() => groups.flatMap(g => g.criteria), [groups]);

  const sortedStudents = useMemo(
    () => [...(students || [])].sort((a, b) =>
      `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, 'ar')
    ),
    [students]
  );

  const isLoading = loadingProfile || loadingInstitution || loadingStudents || loadingEvals;

  useEffect(() => {
    if (!isLoading && sortedStudents.length > 0) {
      const t = setTimeout(() => window.print(), 600);
      return () => clearTimeout(t);
    }
  }, [isLoading, sortedStudents.length]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8" />
        <span className="ms-2">جاري التحضير للطباعة...</span>
      </div>
    );
  }
  if (sortedStudents.length === 0 || indicators.length === 0 || !level) {
    return <div className="flex h-screen items-center justify-center">لا توجد بيانات لعرضها.</div>;
  }

  const professorName = `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim();
  const schoolYear = profile?.schoolYear || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;

  return (
    <div className="p-4 text-black bg-white font-body" dir="rtl">
      <style>{`
        @media print {
          body { background-color: white !important; }
          @page { size: A4 landscape; margin: 0.8cm; }
          .diag-table thead { display: table-header-group; }
          .diag-table tbody tr { page-break-inside: avoid; }
        }
        .diag-title { border: 3px double #b8474a; border-radius: 12px; padding: 8px 40px; margin: 0 auto 10px; width: fit-content; font-size: 16pt; font-weight: bold; text-align: center; }
        .diag-info { display: grid; grid-template-columns: 1fr 1fr 1fr; font-size: 10pt; margin-bottom: 6px; }
        .diag-table { width: 100%; border-collapse: collapse; border: 2.5px solid black; table-layout: fixed; }
        .diag-table th, .diag-table td { border: 1px solid black; text-align: center; vertical-align: middle; padding: 1px; }
        .diag-table th { font-weight: bold; }
        .diag-table .g { font-size: 10pt; border-bottom: 2px solid black; }
        .diag-table .c { font-size: 6.5pt; line-height: 1.15; border-bottom: 2px solid black; }
        .diag-table .i { font-size: 6.5pt; line-height: 1.1; }
        .diag-table .v { writing-mode: vertical-rl; transform: rotate(180deg); font-size: 6.5pt; font-weight: normal; height: 95px; line-height: 1.1; margin: 0 auto; }
        .diag-table .b { font-size: 8pt; height: 18px; border-bottom: 2.5px solid black; }
        .diag-table .b.zero { color: #d00; }
        .diag-table td.name { text-align: right; padding: 0 4px; font-size: 8.5pt; }
        .diag-table td.num { font-size: 9pt; font-weight: bold; }
        .diag-table tbody tr { height: 22px; }
        .diag-table td.sep, .diag-table th.sep { border-right: 2px solid black; }
        .mark { font-size: 9pt; font-weight: bold; }
      `}</style>

      <div className="diag-title">{diagnosticTitle(level)}</div>
      <div className="diag-info">
        <div>المؤسسة: {institution?.name || '...'}</div>
        <div style={{ textAlign: 'center' }}>السنة الدراسية: {schoolYear}</div>
        <div style={{ textAlign: 'left' }}>الأستاذ: {professorName}</div>
      </div>

      <table className="diag-table">
        <colgroup>
          <col style={{ width: '22px' }} />
          <col style={{ width: '130px' }} />
          {indicators.flatMap(ind => [<col key={`${ind.id}-a`} />, <col key={`${ind.id}-b`} />])}
        </colgroup>
        <thead>
          <tr>
            <th rowSpan={5} className="v" style={{ height: 'auto', fontSize: '8pt' }}>
              <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: '0 auto' }}>الرقم</div>
            </th>
            <th rowSpan={5} style={{ fontSize: '11pt' }}>اللقب والاسم</th>
            {groups.map(g => (
              <th key={g.name} className="g sep" colSpan={g.criteria.reduce((a, c) => a + c.indicators.length * 2, 0)}>
                {g.name}
              </th>
            ))}
          </tr>
          <tr>
            {criteria.map(c => (
              <th key={c.id} className="c sep" colSpan={c.indicators.length * 2}>{c.name}</th>
            ))}
          </tr>
          <tr>
            {indicators.map((ind, idx) => (
              <th key={ind.id} className="i sep" colSpan={2}>المؤشر {(idx % 3) + 1}</th>
            ))}
          </tr>
          <tr>
            {indicators.map(ind => (
              <th key={ind.id} className="sep" colSpan={2} style={{ borderBottom: '2px solid black' }}>
                <div className="v">{ind.label}</div>
              </th>
            ))}
          </tr>
          <tr>
            {indicators.flatMap(ind => [
              <th key={`${ind.id}-1`} className="b sep">1</th>,
              <th key={`${ind.id}-0`} className="b zero">0</th>,
            ])}
          </tr>
        </thead>
        <tbody>
          {sortedStudents.map((s, i) => (
            <tr key={s.id}>
              <td className="num">{String(i + 1).padStart(2, '0')}</td>
              <td className="name">{s.lastName} {s.firstName}</td>
              {indicators.flatMap(ind => {
                const v = ratings[s.id]?.[ind.id];
                return [
                  <td key={`${ind.id}-1`} className="sep mark">{v === 1 ? '✓' : ''}</td>,
                  <td key={`${ind.id}-0`} className="mark">{v === 0 ? '✓' : ''}</td>,
                ];
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PrintDiagnosticPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">جاري التحميل...</div>}>
      <PrintContent />
    </Suspense>
  );
}
