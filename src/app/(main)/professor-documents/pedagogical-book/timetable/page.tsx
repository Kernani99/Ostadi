
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Printer, Edit, Building, User, CalendarDays, Save, Loader2 } from "lucide-react";
import Image from 'next/image';
import { useCollection, useDoc, useFirestore, useUser } from "@/firebase";
import { useMemoFirebase } from "@/firebase/provider";
import type { ProfessorProfile, TimetableEntry } from "@/lib/types";
import { collection, query, where, doc, writeBatch } from "firebase/firestore";
import { useState, useMemo, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

const days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس"];
const timeSlots = [
    "08:00 - 09:00",
    "09:00 - 10:00",
    "10:00 - 11:00",
    "11:00 - 12:00",
    "13:00 - 14:00",
    "14:00 - 15:00",
    "15:00 - 16:00",
    "16:00 - 17:00"
];

const AlgerianFlagIcon = () => (
    <div className="h-7 w-7 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" className="h-full w-auto">
            <rect width="1200" height="800" fill="#fff"/>
            <rect width="600" height="800" fill="#006233"/>
            <g transform="translate(600,400)">
                <path d="M 0 -150 A 150 150 0 0 0 0 150 A 120 120 0 0 1 0 -150" fill="#d21034"/>
                <g transform="rotate(18)">
                    <path d="M 0 -70 L 22 -22 L 70 0 L 22 22 L 0 70 L -22 22 L -70 0 L -22 -22 Z" fill="#d21034"/>
                </g>
            </g>
        </svg>
    </div>
);


export default function TimetablePage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const profileDocRef = useMemoFirebase(() => user ? doc(firestore, 'professor_profile', 'main_profile') : null, [firestore, user]);
  const { data: profileData } = useDoc<ProfessorProfile>(profileDocRef);
  
  const timetableQuery = useMemoFirebase(() => 
    user ? query(collection(firestore, 'timetable_entries'), where('userId', '==', user.uid)) : null,
  [firestore, user]);
  const { data: timetableEntries, isLoading: isLoadingTimetable } = useCollection<TimetableEntry>(timetableQuery);

  const [localTimetable, setLocalTimetable] = useState<Record<string, Record<string, string>>>({});

  useEffect(() => {
    if (timetableEntries) {
        const newTimetable: Record<string, Record<string, string>> = {};
        timetableEntries.forEach(entry => {
            if (!newTimetable[entry.day]) {
                newTimetable[entry.day] = {};
            }
            newTimetable[entry.day][entry.timeSlot] = entry.content;
        });
        setLocalTimetable(newTimetable);
    }
  }, [timetableEntries]);


  const handlePrint = () => {
    window.print();
  };

  const handleEdit = () => {
      setIsEditing(true);
  };
  
  const handleCellChange = (day: string, timeSlot: string, content: string) => {
    setLocalTimetable(prev => {
        const newTimetable = { ...prev };
        if (!newTimetable[day]) {
            newTimetable[day] = {};
        }
        newTimetable[day][timeSlot] = content;
        return newTimetable;
    });
  };

  const handleSaveChanges = async () => {
    if (!user) {
        toast({ title: "خطأ", description: "يجب تسجيل الدخول لحفظ التغييرات.", variant: "destructive" });
        return;
    }
    setIsSaving(true);
    const batch = writeBatch(firestore);

    // Get existing entries to delete the ones not present in the new localTimetable
    const existingEntries = timetableEntries || [];
    const newEntriesMap = new Map<string, string>();

    for (const day of days) {
        for (const timeSlot of timeSlots) {
            const content = localTimetable[day]?.[timeSlot] || "";
            const docId = `${user.uid}_${day}_${timeSlot}`;
            newEntriesMap.set(docId, content);

            // Set (create or overwrite) the document
            const docRef = doc(firestore, 'timetable_entries', docId);
            batch.set(docRef, {
                userId: user.uid,
                day,
                timeSlot,
                content
            });
        }
    }
    
    // This part is to clean up old entries if they are removed, but the above logic handles it by overwriting with empty content.
    // So we can simplify the saving logic to just set/update.

    try {
        await batch.commit();
        toast({ title: "تم الحفظ بنجاح", description: "تم تحديث جدول التوقيت الخاص بك." });
        setIsEditing(false);
    } catch(error) {
        console.error("Error saving timetable:", error);
        toast({ title: "خطأ", description: "حدث خطأ أثناء حفظ الجدول.", variant: "destructive"});
    } finally {
        setIsSaving(false);
    }
  };
  
  return (
    <div className="container mx-auto p-4 space-y-6 bg-gray-50/50">
       <style>{`
        @media print {
          body {
            background-color: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 landscape;
            margin: 0;
          }
          .printable-area {
            padding: 1rem;
            margin: 0;
            border: none;
            box-shadow: none;
          }
          .timetable-input {
                border: none !important;
                background-color: transparent !important;
                padding: 2px !important;
                text-align: center;
                height: auto;
                resize: none;
                overflow: hidden;
           }
           .print-table th, .print-table td {
                border-color: #aaa !important;
                height: 64px !important;
           }
        }
      `}</style>

      <div className="flex flex-col items-center gap-2 mb-8 no-print">
        <h1 className="font-bold text-3xl text-center text-primary">
          جدول التوقيت
        </h1>
         <div className="flex items-center gap-4 mt-4">
            {!isEditing ? (
                <Button onClick={handleEdit} className="bg-green-600 hover:bg-green-700 text-white rounded-full shadow-md">
                    <Edit className="me-2"/> تعديل الجدول
                </Button>
            ) : (
                 <Button onClick={handleSaveChanges} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md">
                    {isSaving ? <Loader2 className="animate-spin me-2" /> : <Save className="me-2"/>} حفظ التغييرات
                </Button>
            )}
            <Button onClick={handlePrint} variant="outline" className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700 rounded-full shadow-md">
                <Printer className="me-2"/> طباعة الجدول
            </Button>
        </div>
      </div>

    <div className="printable-area p-8 border rounded-lg bg-white shadow-lg">
        <header className="mb-8">
            <div className="flex justify-between items-start">
                <div className="text-sm space-y-1 text-right">
                    <p className="font-semibold flex items-center gap-2"><User className="text-green-700" size={16}/> الأستاذ(ة): {profileData?.firstName || ''} {profileData?.lastName || ''}</p>
                    <p className="flex items-center gap-2"><CalendarDays className="text-green-700" size={16}/> السنة الدراسية: {profileData?.schoolYear || ''}</p>
                </div>
                <div className="flex flex-col items-center">
                    <AlgerianFlagIcon />
                    <h1 className="text-xl font-bold mt-2 text-green-800">جدول التوقيت</h1>
                </div>
                <div className="text-sm space-y-1 text-right">
                    <p className="font-semibold flex items-center gap-2"><Building className="text-green-700" size={16}/> المؤسسة: {profileData?.schoolName || ''}</p>
                </div>
            </div>
        </header>

      <Card className="w-full mx-auto shadow-xl border-gray-300">
        <CardHeader className="bg-white rounded-t-lg pb-2">
          <CardTitle className="flex items-center gap-3 text-red-600 font-bold relative pb-2 w-fit mx-auto">
            <Calendar className="h-6 w-6" />
            التوقيت الأسبوعي
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-0.5 bg-red-200"></span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
             {isLoadingTimetable ? <div className="text-center p-8">جاري تحميل الجدول...</div> : (
                <Table className="border-collapse border-t border-gray-300 print-table">
                <TableHeader>
                    <TableRow className="bg-gray-100">
                    <TableHead className="border border-gray-300 p-2 font-bold text-center align-middle w-28">
                        اليوم /<br/> التوقيت
                    </TableHead>
                    {timeSlots.map(slot => (
                        <TableHead key={slot} className="border border-gray-300 p-2 text-center align-middle font-bold text-xs" dangerouslySetInnerHTML={{ __html: slot.replace('-', '<br/>') }}/>
                    ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {days.map(day => (
                    <TableRow key={day} className="even:bg-gray-50">
                        <TableCell className="border border-gray-300 p-2 font-bold text-center align-middle">{day}</TableCell>
                        {timeSlots.map(slot => (
                        <TableCell key={slot} className="border border-gray-300 p-1 text-center align-middle h-16">
                           {isEditing ? (
                             <Textarea
                                value={localTimetable[day]?.[slot] || ''}
                                onChange={(e) => handleCellChange(day, slot, e.target.value)}
                                className="w-full h-full text-center text-xs p-1 border-dashed timetable-input bg-blue-50/50 focus:bg-blue-100"
                             />
                           ) : (
                            <div className="text-xs whitespace-pre-wrap">{localTimetable[day]?.[slot] || ''}</div>
                           )}
                        </TableCell>
                        ))}
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            )}
          </div>
        </CardContent>
      </Card>
      
       <div className="flex justify-around items-center mt-12 text-sm font-semibold">
            <p>الأستاذ(ة): ...............................</p>
            <p>المدير(ة): ...............................</p>
            <p>المفتش: ...............................</p>
        </div>
    </div>
    </div>
  );
}
