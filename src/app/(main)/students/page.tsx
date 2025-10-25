import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { students } from "@/lib/data";
import { PlusCircle, Upload, Download } from "lucide-react";

export default function StudentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">التلاميذ</h1>
        <div className="ms-auto flex items-center gap-2">
          <Button size="sm" variant="outline">
            <Download className="h-4 w-4 me-2" />
            تصدير
          </Button>
          <Button size="sm" variant="outline">
            <Upload className="h-4 w-4 me-2" />
            استيراد
          </Button>
          <Button size="sm">
            <PlusCircle className="h-4 w-4 me-2" />
            إضافة تلميذ
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>قائمة التلاميذ</CardTitle>
          <CardDescription>إدارة جميع التلاميذ المسجلين في النظام.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم الكامل</TableHead>
                <TableHead>الجنس</TableHead>
                <TableHead>معدل الأداء</TableHead>
                <TableHead>نسبة الحضور</TableHead>
                <TableHead className="text-start">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.studentId}>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>
                    <Badge variant={student.gender === 'male' ? 'default' : 'secondary'}>
                      {student.gender === 'male' ? 'ذكر' : 'أنثى'}
                    </Badge>
                  </TableCell>
                  <TableCell>{student.performanceScore}%</TableCell>
                  <TableCell>{student.attendanceRate * 100}%</TableCell>
                  <TableCell className="text-start">
                    <Button variant="ghost" size="icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                      <span className="sr-only">قائمة</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
