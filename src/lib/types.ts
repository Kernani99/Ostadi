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
  level: string;
};

export type Institution = {
  id:string;
  name: string;
  municipality: string;
};

export type ProfessorProfile = {
    id: string;
    lastName?: string;
    firstName?: string;
    dateOfBirth?: string;
    placeOfBirth?: string;
    maritalStatus?: string;
    address?: string;
    phoneNumber?: string;
    email?: string;
    rank?: string;
    title?: string;
    appointmentDate?: string;
    confirmationDate?: string;
    grade?: string;
    certificateName?: string;
    certificateNumber?: string;
    specialization?: string;
    issuingInstitution?: string;
    certificationDate?: string;
    wilaya?: string;
    schoolName?: string;
    schoolYear?: string;
}

export type Attendance = {
  id: string; // e.g., studentId_yyyy-MM
  studentId: string;
  departmentId: string;
  month: string; // "yyyy-MM" format
  records: { [day: number]: 'present' | 'absent' | 'justified' | 'no-outfit' };
};
