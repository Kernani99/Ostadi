
'use client';

import { useCollection, useDoc, useFirestore } from "@/firebase";
import { useMemoFirebase } from "@/firebase/provider";
import { collection, query, where, doc } from "firebase/firestore";
import type { Student, Institution, ProfessorProfile } from "@/lib/types";
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";

function PrintAnnualContent() {
    const firestore = useFirestore();
    const searchParams = useSearchParams();

    const level = searchParams.get('level');
    const institutionId = searchParams.get('institutionId');

    const profileDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'professor_profile', 'main_profile') : null, [firestore]);
    const { data: profileData, isLoading: loadingProfile } = useDoc<ProfessorProfile>(profileDocRef);


    const institutionDocRef = useMemoFirebase(() => institutionId && firestore ? doc(firestore, 'institutions', institutionId) : null, [firestore, institutionId]);
    const { data: institution, isLoading: loadingInstitution } = useDoc<Institution>(institutionDocRef);

    const studentsQuery = useMemoFirebase(() => {
        if (!firestore || !level || !institutionId) return null;
        return query(
            collection(firestore, 'students'),
            where('institutionId', '==', institutionId),
            where('level', '==', level)
        );
    }, [firestore, level, institutionId]);
    const { data: students, isLoading: loadingStudents } = useCollection<Student>(studentsQuery);
    
    const sortedStudents = useMemo(() => {
        return students?.sort((a, b) => {
            const lastNameComparison = a.lastName.localeCompare(b.lastName);
            if (lastNameComparison !== 0) return lastNameComparison;
            return a.firstName.localeCompare(b.firstName);
        }) || [];
    }, [students]);

    const isLoading = loadingProfile || loadingInstitution || loadingStudents;

    // We pass the data into the dangerouslySetInnerHTML to be used by the script tag
    const tableBodyContent = useMemo(() => {
        if (isLoading || !sortedStudents) return '';
        const emptyCells = '<td></td>'.repeat(40); // 8 months * 5 weeks
        return sortedStudents.map((student, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${student.lastName}</td>
                <td>${student.firstName}</td>
                ${emptyCells}
            </tr>
        `).join('');
    }, [isLoading, sortedStudents]);

    useEffect(() => {
        if (!isLoading && students && students.length > 0) {
             const timer = setTimeout(() => {
                const tableBody = document.getElementById('studentListBody');
                if (tableBody) {
                    tableBody.innerHTML = tableBodyContent;
                }
                window.print();
            }, 100); 
            
            return () => clearTimeout(timer);
        }
    }, [isLoading, students, tableBodyContent, institution, profileData, level]);


    const htmlContent = useMemo(() => `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>قائمة متابعة الطلبة</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
    
    <style>
        @page {
            size: A4 landscape;
            margin: 1cm;
        }

        body {
            font-family: 'Cairo', sans-serif;
            direction: rtl;
            margin: 0;
            background-color: #fff;
        }
        
        .page-header {
            text-align: center;
            margin-bottom: 20px;
        }
        .page-header h1 {
            font-size: 18pt;
            font-weight: 700;
            margin: 0;
        }
        .page-header h2 {
            font-size: 14pt;
            margin: 5px 0;
        }
         .page-header .info {
            display: flex;
            justify-content: space-between;
            font-size: 12pt;
            margin-top: 15px;
        }

        .container {
            width: 100%;
            margin: 0;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            font-size: 8pt;
        }

        th, td {
            border: 1px solid #333;
            padding: 2px;
            text-align: center;
            height: 20px;
            overflow: hidden;
            white-space: nowrap;
        }

        thead th {
            background-color: #e0e0e0;
            font-weight: 700;
            vertical-align: middle;
        }

        thead tr:last-child th {
            background-color: #f0f0f0;
            font-weight: 400;
            width: 2.2%;
        }

        th:nth-child(1), td:nth-child(1) { width: 3%; }
        th:nth-child(2), td:nth-child(2) { width: 9%; text-align: right; padding-right: 5px; }
        th:nth-child(3), td:nth-child(3) { width: 9%; text-align: right; padding-right: 5px; }

        tbody tr:nth-child(even) {
            background-color: #f9f9f9;
        }

        @media print {
             body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
             thead { display: table-header-group; }
        }
    </style>
</head>
<body>
    <div class="page-header">
        <h1>مديرية التربية لولاية ${profileData?.wilaya || '...'}</h1>
        <h2>المدرسة: ${institution?.name || '...'}</h2>
        <div class="info">
            <span>القسم: ${level || ''}</span>
            <span>الأستاذ(ة): ${ (profileData?.firstName || '') + ' ' + (profileData?.lastName || '') }</span>
            <span>السنة الدراسية: ${profileData?.schoolYear || '...'}</span>
        </div>
    </div>
    
    <div class="container">
        <table>
            <thead>
                <tr>
                    <th rowspan="2">الرقم</th>
                    <th rowspan="2">اللقب</th>
                    <th rowspan="2">الاسم</th>
                    <th colspan="5">نوفمبر</th>
                    <th colspan="5">ديسمبر</th>
                    <th colspan="5">جانفي</th>
                    <th colspan="5">فيفري</th>
                    <th colspan="5">مارس</th>
                    <th colspan="5">أفريل</th>
                    <th colspan="5">ماي</th>
                    <th colspan="5">جوان</th>
                </tr>
                <tr>
                    ${'<th>1</th><th>2</th><th>3</th><th>4</th><th>5</th>'.repeat(8)}
                </tr>
            </thead>
            <tbody id="studentListBody">
                ${tableBodyContent}
            </tbody>
        </table>
    </div>

</body>
</html>
    `, [profileData, institution, level, tableBodyContent]);

    if(isLoading) {
        return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /><span className="ms-2">جاري تحميل بيانات الطباعة...</span></div>
    }

    if(!students || students.length === 0) {
        return <div className="flex h-screen w-full items-center justify-center">لا يوجد تلاميذ في هذا المستوى لعرضهم.</div>
    }

    // This component will render the raw HTML string.
    // The script inside the HTML will populate the table body.
    return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
}


export default function PrintAnnualAttendancePage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center">جاري التحميل...</div>}>
            <PrintAnnualContent />
        </Suspense>
    );
}
