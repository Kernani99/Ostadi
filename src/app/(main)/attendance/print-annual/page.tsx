
'use client';

import { useCollection, useDoc, useFirestore } from "@/firebase";
import { useMemoFirebase } from "@/firebase/provider";
import { collection, query, where } from "firebase/firestore";
import type { Student, Institution, ProfessorProfile } from "@/lib/types";
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useRef } from "react";
import { Loader2 } from "lucide-react";

function PrintAnnualContent() {
    const firestore = useFirestore();
    const searchParams = useSearchParams();

    const level = searchParams.get('level');
    const institutionId = searchParams.get('institutionId');

    const profileDocRef = useMemoFirebase(() => firestore ? collection(firestore, 'professor_profile') : null, [firestore]);
    const { data: profileDataArr, isLoading: loadingProfile } = useCollection<ProfessorProfile>(profileDocRef);
    const profileData = useMemo(() => (profileDataArr && profileDataArr.length > 0 ? profileDataArr[0] : null), [profileDataArr]);

    const institutionDocRef = useMemoFirebase(() => institutionId && firestore ? collection(firestore, 'institutions', institutionId) : null, [firestore, institutionId]);
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
        return sortedStudents.map(student => `
            <tr>
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
                // Also update header fields
                const schoolInput = document.getElementById('schoolNameInput') as HTMLInputElement;
                const yearInput = document.getElementById('schoolYearInput') as HTMLInputElement;
                const professorNameDiv = document.getElementById('professorName');

                if(schoolInput && institution) schoolInput.value = institution.name;
                if(yearInput && profileData) yearInput.value = profileData.schoolYear || '';
                if(professorNameDiv && profileData) professorNameDiv.textContent = `الأستاذ : ${profileData.firstName || ''} ${profileData.lastName || ''}`.trim();


            }, 100); // Small delay to ensure DOM is ready for manipulation
            
            return () => clearTimeout(timer);
        }
    }, [isLoading, students, tableBodyContent, institution, profileData]);


    const htmlContent = `
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
        /* إعدادات الصفحة للطباعة */
        @page {
            size: A4 landscape;
            margin: 1cm;
        }

        body {
            font-family: 'Cairo', sans-serif;
            direction: rtl;
            margin: 0;
            padding: 20px;
            background-color: #f4f4f4;
        }
        
        .no-print {
            display: block;
        }
        .print-only {
            display: none;
        }

        /* --- قسم رأس الصفحة الرسمي --- */
        .page-header {
            background: #fff;
            border: 1px solid #ccc;
            border-radius: 8px;
            padding: 15px 30px;
            margin: 0 auto 20px auto;
            max-width: 1000px;
            text-align: right;
            line-height: 1.8;
        }
        .page-header div {
            font-size: 14pt;
        }
        .page-header div:first-child {
            font-weight: 700;
            font-size: 16pt;
            color: #000;
            text-align: center;
        }
         .page-header div:nth-child(2) {
            font-weight: 600;
        }
        .input-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 10px 0;
            gap: 15px;
        }
        .input-row label {
            font-weight: 600;
            font-size: 14pt;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        .page-header input {
            font-family: 'Cairo', sans-serif;
            font-size: 12pt;
            border: 1px solid #ccc;
            border-radius: 4px;
            padding: 4px 8px;
            flex-grow: 1;
            min-width: 150px;
        }

        /* --- قسم الأزرار --- */
        .actions-section {
            background-color: #fff;
            border: 2px dashed #007bff;
            border-radius: 8px;
            padding: 20px;
            margin: 20px auto;
            max-width: 1000px;
            text-align: center;
        }

        .actions-section button {
            font-family: 'Cairo', sans-serif;
            font-size: 16px;
            font-weight: 600;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin: 5px;
            transition: background-color 0.3s;
        }
        
        #printButton {
            background-color: #28a745;
        }
        #printButton:hover {
            background-color: #218838;
        }


        .container {
            width: 100%;
            margin: 0;
            overflow-x: auto;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            font-size: 10pt;
            background-color: #fff;
        }

        th, td {
            border: 1px solid #333;
            padding: 5px;
            text-align: center;
            height: 28px;
            overflow: hidden;
            white-space: nowrap;
        }

        thead th {
            background-color: #e0e0e0;
            font-weight: 700;
            vertical-align: middle;
            position: sticky;
            top: 0;
            z-index: 10;
        }

        thead tr:last-child th {
            background-color: #f0f0f0;
            font-weight: 400;
            font-size: 9pt;
            width: 2.5%;
        }

        th:nth-child(1), th:nth-child(2),
        td:nth-child(1), td:nth-child(2) {
            text-align: right;
            font-weight: 600;
            width: 10%;
            padding-right: 8px;
        }

        tbody tr:nth-child(even) {
            background-color: #f9f9f9;
        }

        /* إعدادات خاصة بالطباعة */
        @media print {
             body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
            .print-only { display: block !important; }
            
            body {
                background-color: #fff;
                margin: 0;
                padding: 0;
            }
            .page-header {
                background: none;
                border: none;
                text-align: right;
                margin: 0 0 20px 0;
                width: 100%;
                max-width: 100%;
            }
             .page-header div {
                 color: #000 !important;
             }
            
            .page-header input {
                border: none;
                background: none;
                padding: 0;
                font-weight: normal;
                font-size: 14pt;
                color: #000 !important;
                width: auto; 
            }
            .input-row label {
                font-size: 14pt;
            }

            .container {
                overflow-x: visible;
            }
            th, td {
                border: 1px solid #000 !important;
            }
            thead th {
                 background-color: #e0e0e0 !important;
            }
            thead tr:last-child th {
                 background-color: #f0f0f0 !important;
            }
            tbody tr:nth-child(even) {
                background-color: #f9f9f9 !important;
            }
        }
    </style>
</head>
<body>
    <div class="page-header">
        <div><strong>مديرية التربية لولاية ${profileData?.wilaya || '...'}</strong></div>
        <div class="input-row">
            <label>المدرسة: <input type="text" id="schoolNameInput" value="${institution?.name || '...'}"></label>
            <label>القسم: <input type="text" value="${level || ''}"></label>
            <label>السنة: <input type="text" id="schoolYearInput" value="${profileData?.schoolYear || '...'}"></label>
        </div>
        <div id="professorName">الأستاذ : ${ (profileData?.firstName || '') + ' ' + (profileData?.lastName || '') }</div>
    </div>
    
    <div class="actions-section no-print">
        <button id="printButton">طباعة القائمة</button>
    </div>

    <div class="container">
        <table>
            <thead>
                <tr>
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

    <script>
        document.getElementById('printButton').addEventListener('click', function() {
            window.print();
        });
    </script>

</body>
</html>
    `;

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

