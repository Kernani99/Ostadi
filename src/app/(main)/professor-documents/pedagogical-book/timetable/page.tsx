'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Printer, Edit, Building, User, CalendarDays } from "lucide-react";
import Image from 'next/image';


const timetableData = {
    "الأحد": {
        "09:00 - 10:00": "س 3 - تسوح بوجمعة",
        "10:00 - 11:00": "س 2 دمج - تسوح بوجمعة"
    },
    "الإثنين": {
        "08:00 - 09:00": "س 1 + س 2 دمج - شاوي عبدالرحمان",
        "10:00 - 11:00": "س 1 - تسوح بوجمعة",
        "13:00 - 14:00": "س 3 - شاوي عبدالرحمان",
        "14:00 - 15:00": "س 5 - شاوي عبدالرحمان"
    },
    "الثلاثاء": {
        "10:00 - 11:00": "س 2 - شاوي عبدالرحمان",
        "11:00 - 12:00": "س 3 - شاوي عبدالرحمان"
    },
    "الأربعاء": {
        "09:00 - 10:00": "س 2 - تسوح بوجمعة",
        "10:00 - 11:00": "س 1 - تسوح بوجمعة",
        "13:00 - 14:00": "س 4 - تسوح بوجمعة",
        "14:00 - 15:00": "س 3 + س 5 دمج - تسوح بوجمعة"
    },
    "الخميس": {},
};

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


export default function TimetablePage() {
  const handlePrint = () => {
    window.print();
  };
  
  return (
    <div className="container mx-auto p-4 space-y-6 bg-gray-50/50">
       <style>{`
        @media print {
          body {
            background-color: white !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 landscape;
            margin: 1cm;
          }
          .printable-area {
            padding: 0;
            margin: 0;
            border: none;
            box-shadow: none;
          }
        }
      `}</style>
      <div className="flex flex-col items-center gap-2 no-print">
        <h1 className="font-bold text-3xl text-center text-green-700">
          جدول التوقيت - التعليم الإبتدائي (الدوام الواحد)
        </h1>
         <div className="flex items-center gap-4 mt-4">
            <Button className="bg-green-600 hover:bg-green-700 text-white rounded-full shadow-md" disabled>
                <Edit className="me-2"/> تعديل الجدول
            </Button>
            <Button onClick={handlePrint} variant="destructive" className="bg-red-600 hover:bg-red-700 rounded-full shadow-md">
                <Printer className="me-2"/> طباعة الجدول
            </Button>
        </div>
      </div>

    <div className="printable-area">
        <Card className="w-full max-w-7xl mx-auto border-2 border-green-600 rounded-2xl shadow-lg p-6">
            <CardHeader className="text-center">
                <div className="grid grid-cols-3 items-center">
                     <div className="text-right space-y-2">
                        <p className="flex items-center justify-end gap-2 text-sm font-semibold"><User className="text-green-700"/> الأستاذ(ة): قرناني عبدالحليم</p>
                        <p className="flex items-center justify-end gap-2 text-sm font-semibold"><CalendarDays className="text-green-700"/> السنة الدراسية: 2025</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <Image src="https://firebasestorage.googleapis.com/v0/b/studio-3773063615-aada3.appspot.com/o/resources%2Falgeria-flag.png?alt=media&token=38337a28-2e11-43b3-9022-38ceb3252573" alt="شعار" width={50} height={50} />
                        <CardTitle className="text-xl font-bold mt-2 text-green-800">جدول التوقيت</CardTitle>
                    </div>
                    <div className="text-left">
                         <p className="flex items-center gap-2 text-sm font-semibold"><Building className="text-green-700"/> المؤسسة: شاوي عبدالرحمان وملحقة لها تسوح بوجمعة - القيقبة</p>
                    </div>
                </div>
            </CardHeader>
        </Card>

      <Card className="w-full max-w-7xl mx-auto shadow-xl mt-6">
        <CardHeader className="bg-white rounded-t-lg">
          <CardTitle className="flex items-center gap-3 text-red-600 font-bold">
            <Calendar className="h-7 w-7" />
            التوقيت الأسبوعي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="border-collapse border border-gray-300">
              <TableHeader>
                <TableRow className="bg-green-700 text-white">
                  <TableHead className="border border-gray-300 p-2 text-center text-white font-bold w-32">اليوم / التوقيت</TableHead>
                  {timeSlots.map(slot => (
                    <TableHead key={slot} className="border border-gray-300 p-2 text-center text-white font-bold">{slot.replace('-', '\n')}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {days.map(day => (
                  <TableRow key={day} className="even:bg-gray-50">
                    <TableCell className="border border-gray-300 p-2 font-bold text-center align-middle">{day}</TableCell>
                    {timeSlots.map(slot => (
                      <TableCell key={slot} className="border border-gray-300 p-2 text-center align-middle h-24">
                        {timetableData[day][slot] || ''}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
       <div className="flex justify-around items-center mt-10 text-lg font-semibold">
            <p>الأستاذ(ة): ...............................</p>
            <p>المدير(ة): ...............................</p>
            <p>المفتش: ...............................</p>
        </div>
    </div>
    </div>
  );
}
