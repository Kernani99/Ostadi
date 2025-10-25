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
};

export type Department = {
  id: string;
  name: string;
  institutionId: string;
};

export type Institution = {
  id:string;
  name: string;
};
