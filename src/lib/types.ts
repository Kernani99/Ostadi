export type Student = {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  gender: 'male' | 'female';
  departmentId: string;
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
