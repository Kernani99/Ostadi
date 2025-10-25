"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { suggestOptimalGroupDivision } from "@/ai/flows/suggest-optimal-group-division";
import type { SuggestOptimalGroupDivisionOutput } from "@/ai/flows/suggest-optimal-group-division";
import { students, departments } from "@/lib/data";
import type { Student } from "@/lib/types";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users } from "lucide-react";

const formSchema = z.object({
  departmentId: z.string().min(1, { message: "الرجاء اختيار قسم." }),
  numberOfGroups: z
    .number({ coerce: true })
    .min(2, { message: "يجب أن يكون عدد الأفواج 2 على الأقل." }),
});

export function GroupManager() {
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SuggestOptimalGroupDivisionOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      departmentId: "",
      numberOfGroups: 2,
    },
  });

  const studentsInSelectedDepartment = selectedDepartment
    ? students.filter((s) => s.departmentId === selectedDepartment)
    : [];
  
  const studentMap = new Map(students.map(s => [s.studentId, s]));

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);

    const department = departments.find(d => d.id === values.departmentId);
    if (!department) {
        toast({ title: "خطأ", description: "القسم المحدد غير موجود.", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    const studentsToGroup: Student[] = students.filter(
      (s) => s.departmentId === values.departmentId
    );

    if (studentsToGroup.length < values.numberOfGroups) {
      toast({
        title: "خطأ في الإدخال",
        description: "عدد التلاميذ في القسم أقل من عدد الأفواج المطلوب.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const divisionResult = await suggestOptimalGroupDivision({
        departmentName: department.name,
        studentData: studentsToGroup.map(s => ({
            studentId: s.studentId,
            performanceScore: s.performanceScore,
            attendanceRate: s.attendanceRate,
            gender: s.gender,
            otherFactors: s.otherFactors
        })),
        numberOfGroups: values.numberOfGroups,
      });
      setResult(divisionResult);
    } catch (error) {
      console.error("AI flow error:", error);
      toast({
        title: "حدث خطأ",
        description: "فشل في إنشاء الأفواج. الرجاء المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>إدارة الأفواج الديناميكية (AI)</CardTitle>
          <CardDescription>
            استخدم الذكاء الاصطناعي لتقسيم التلاميذ إلى أفواج عمل متوازنة بناءً على
            أدائهم وحضورهم وعوامل أخرى لتعزيز التعلم.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اختر القسم</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedDepartment(value);
                          setResult(null);
                        }}
                        defaultValue={field.value}
                        dir="rtl"
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر قسماً لعرض تلاميذه" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="numberOfGroups"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>عدد الأفواج المطلوب</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} min="2" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {selectedDepartment && (
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      تلاميذ القسم المحدد
                    </CardTitle>
                    <CardDescription>
                      سيتم تقسيم هؤلاء التلاميذ ({studentsInSelectedDepartment.length} تلميذ/ة) إلى أفواج.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {studentsInSelectedDepartment.map(s => (
                        <Badge key={s.studentId} variant="secondary">{s.name}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading || !selectedDepartment}>
                {isLoading ? (
                  <>
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    جاري إنشاء الأفواج...
                  </>
                ) : (
                  <>
                    <Users className="me-2 h-4 w-4" />
                    إنشاء الأفواج
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {result && (
        <Card className="mt-8">
            <CardHeader>
                <CardTitle>نتائج تقسيم الأفواج</CardTitle>
                <CardDescription>{result.reasoning}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {result.groupDivisions.map((group, index) => (
                    <Card key={index}>
                        <CardHeader>
                            <CardTitle>الفوج {index + 1}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2">
                            {group.map(studentId => (
                                <div key={studentId} className="flex items-center justify-between p-2 bg-background rounded-md">
                                    <span>{studentMap.get(studentId)?.name || studentId}</span>
                                    <Badge variant="outline">{studentMap.get(studentId)?.performanceScore}%</Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))}
            </CardContent>
        </Card>
      )}
    </>
  );
}
