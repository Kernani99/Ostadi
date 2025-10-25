export type Student = {
  studentId: string;
  name: string;
  gender: 'male' | 'female';
  performanceScore: number;
  attendanceRate: number;
  otherFactors?: string;
  departmentId: string;
};

export type Department = {
  id: string;
  name: string;
  institutionId: string;
};

export type Institution = {
  id: string;
  name: string;
};
