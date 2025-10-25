import type { Student, Department, Institution } from './types';

export const institutions: Institution[] = [
  { id: 'inst1', name: 'مؤسسة النور الابتدائية' },
  { id: 'inst2', name: 'مدرسة المستقبل الإعدادية' },
];

export const departments: Department[] = [
  { id: 'dept1', name: 'أولى ابتدائي "أ"', institutionId: 'inst1' },
  { id: 'dept2', name: 'أولى ابتدائي "ب"', institutionId: 'inst1' },
  { id: 'dept3', name: 'ثانية إعدادي "ج"', institutionId: 'inst2' },
];

export const students: Student[] = [
  // Department 1
  { studentId: 's1', name: 'أحمد علي', gender: 'male', performanceScore: 85, attendanceRate: 0.95, departmentId: 'dept1' },
  { studentId: 's2', name: 'فاطمة محمد', gender: 'female', performanceScore: 92, attendanceRate: 0.98, departmentId: 'dept1' },
  { studentId: 's3', name: 'خالد حسن', gender: 'male', performanceScore: 78, attendanceRate: 0.90, departmentId: 'dept1' },
  { studentId: 's4', name: 'سارة عبد الله', gender: 'female', performanceScore: 88, attendanceRate: 1.0, departmentId: 'dept1' },
  { studentId: 's5', name: 'يوسف إبراهيم', gender: 'male', performanceScore: 70, attendanceRate: 0.85, departmentId: 'dept1' },
  { studentId: 's6', name: 'عائشة مصطفى', gender: 'female', performanceScore: 95, attendanceRate: 0.99, departmentId: 'dept1' },
  { studentId: 's7', name: 'عمر محمود', gender: 'male', performanceScore: 82, attendanceRate: 0.92, departmentId: 'dept1' },
  { studentId: 's8', name: 'مريم أحمد', gender: 'female', performanceScore: 90, attendanceRate: 0.96, departmentId: 'dept1' },

  // Department 2
  { studentId: 's9', name: 'علي حسين', gender: 'male', performanceScore: 80, attendanceRate: 0.93, departmentId: 'dept2' },
  { studentId: 's10', name: 'نور خالد', gender: 'female', performanceScore: 94, attendanceRate: 0.97, departmentId: 'dept2' },
  { studentId: 's11', name: 'محمد سعيد', gender: 'male', performanceScore: 75, attendanceRate: 0.88, departmentId: 'dept2' },
  { studentId: 's12', name: 'هند ياسر', gender: 'female', performanceScore: 89, attendanceRate: 0.94, departmentId: 'dept2' },
  
  // Department 3
  { studentId: 's13', name: 'عبد الرحمن طارق', gender: 'male', performanceScore: 88, attendanceRate: 0.95, departmentId: 'dept3' },
  { studentId: 's14', name: 'جنى عمرو', gender: 'female', performanceScore: 85, attendanceRate: 0.91, departmentId: 'dept3' },
  { studentId: 's15', name: 'كريم وليد', gender: 'male', performanceScore: 91, attendanceRate: 0.99, departmentId: 'dept3' },
  { studentId: 's16', name: 'لمى هشام', gender: 'female', performanceScore: 79, attendanceRate: 0.89, departmentId: 'dept3' },
  { studentId: 's17', name: 'زينب فريد', gender: 'female', performanceScore: 93, attendanceRate: 1.0, departmentId: 'dept3' },
  { studentId: 's18', name: 'بلال شريف', gender: 'male', performanceScore: 72, attendanceRate: 0.85, departmentId: 'dept3', otherFactors: 'Strong leadership skills' },
  { studentId: 's19', name: 'حمزة جمال', gender: 'male', performanceScore: 84, attendanceRate: 0.93, departmentId: 'dept3' },
  { studentId: 's20', name: 'ملك حسام', gender: 'female', performanceScore: 86, attendanceRate: 0.96, departmentId: 'dept3' },
  { studentId: 's21', name: 'آدم رضا', gender: 'male', performanceScore: 68, attendanceRate: 0.80, departmentId: 'dept3', otherFactors: 'Needs encouragement' },
  { studentId: 's22', name: 'دينا سمير', gender: 'female', performanceScore: 96, attendanceRate: 0.98, departmentId: 'dept3' },
];
