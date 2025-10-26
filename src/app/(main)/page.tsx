
'use client'
import { StatCard } from "@/components/dashboard/stat-card";
import { useCollection, useFirestore } from "@/firebase";
import { Building, Building2, Users, User, Venus, Mars, BarChart, LineChart } from "lucide-react";
import { collection } from 'firebase/firestore'
import { useMemoFirebase } from "@/firebase/provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useMemo } from "react";
import { format, subMonths } from 'date-fns';
import { ar } from 'date-fns/locale';

const COLORS = ['#0088FE', '#FF8042']; // Blue for Male, Orange for Female

const monthlyStatsData = [
    { name: 'يناير', ذكور: 60, إناث: 55 },
    { name: 'فبراير', ذكور: 62, إناث: 58 },
    { name: 'مارس', ذكور: 63, إناث: 59 },
    { name: 'أبريل', ذكور: 63, إناث: 59 },
    { name: 'ماي', ذكور: 61, إناث: 57 },
    { name: 'يونيو', ذكور: 65, إناث: 60 },
    { name: 'يوليو', ذكور: 64, إناث: 58 },
];


export default function DashboardPage() {
  const firestore = useFirestore();

  const studentsQuery = useMemoFirebase(() => collection(firestore, 'students'), [firestore])
  const { data: students } = useCollection(studentsQuery);

  const departmentsQuery = useMemoFirebase(() => collection(firestore, 'departments'), [firestore])
  const { data: departments } = useCollection(departmentsQuery);

  const institutionsQuery = useMemoFirebase(() => collection(firestore, 'institutions'), [firestore])
  const { data: institutions } = useCollection(institutionsQuery);

  const totalStudents = students?.length ?? 0;
  const totalMales = students?.filter((s) => s.gender === "male").length ?? 0;
  const totalFemales = students?.filter((s) => s.gender === "female").length ?? 0;
  const totalDepartments = departments?.length ?? 0;
  const totalInstitutions = institutions?.length ?? 0;
  
  const genderData = useMemo(() => [
    { name: 'الذكور', value: totalMales },
    { name: 'الإناث', value: totalFemales },
  ], [totalMales, totalFemales]);

  return (
    <div className="space-y-6">
        <div className="flex flex-col items-center gap-2">
            <h1 className="font-bold text-3xl text-center text-primary relative">
            الرئيسية
            <span className="absolute -bottom-2 start-1/2 -translate-x-1/2 w-20 h-1 bg-accent rounded-full"></span>
            </h1>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="إجمالي التلاميذ" value={totalStudents} icon={Users} description={`+${((totalStudents/1000)*100).toFixed(1)}% هذا الشهر`} />
            <StatCard title="عدد الذكور" value={totalMales} icon={Mars} description={`+${((totalMales/totalStudents)*100).toFixed(1)}% هذا الشهر`} color="bg-blue-500" />
            <StatCard title="عدد الإناث" value={totalFemales} icon={Venus} description={`+${((totalFemales/totalStudents)*100).toFixed(1)}% هذا الشهر`} color="bg-pink-500" />
            <StatCard title="عدد الأقسام" value={totalDepartments} icon={Building2} description={`+${(totalDepartments).toFixed(1)}% هذا الشهر`} color="bg-purple-500" />
        </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-1">
            <CardHeader>
                 <CardTitle className="flex items-center gap-2"><BarChart className="text-primary"/>توزيع التلاميذ حسب الجنس</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                         <Pie
                            data={genderData}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={110}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                            labelLine={false}
                            label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                        >
                            {genderData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Legend iconType="circle" />
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
        
        <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
                 <CardTitle className="flex items-center gap-2"><LineChart className="text-primary"/>إحصائيات التلاميذ</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={monthlyStatsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <CartesianGrid strokeDasharray="3 3" />
                        <Tooltip />
                        <Legend iconType="circle" />
                        <Area type="monotone" dataKey="ذكور" stroke="#8884d8" fillOpacity={1} fill="url(#colorUv)" />
                        <Area type="monotone" dataKey="إناث" stroke="#82ca9d" fillOpacity={1} fill="url(#colorPv)" />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
