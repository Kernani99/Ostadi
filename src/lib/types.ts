export type Student = {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender: 'male' | 'female';
  level: string;
  institutionId: string;
  status: 'active' | 'exempt';
  departmentId?: string | null; // Can be null for unassigned students
};

export type Department = {
  id: string;
  name: string;
  institutionId: string;
};

export type Institution = {
  id:string;
  name: string;
  municipality: string;
};
