

export type Student = {
  id: string;
  studentId: string;
  firstName: string;
  lastName:string;
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

export type DailyLog = {
    id: string;
    userId: string;
    institutionId: string;
    level: string;
    date: string; // yyyy-MM-dd
    startTime: string;
    endTime: string;
    field?: string;
    memoNumber?: string;
    learnings?: string;
    learningContent?: string;
    observation?: string;
};

export type Attendance = {
  id: string; // e.g., studentId_yyyy-MM
  studentId: string;
  departmentId: string;
  month: string; // "yyyy-MM" format
  records: { [week: number]: 'present' | 'absent' | 'justified' | 'no-outfit' };
};

export type EvaluationCriteria = {
    id: string;
    name: string;
    level: string; // e.g. 'أولى ابتدائي'
    maxScore: number;
    semester: string; // '1', '2', or '3'
};

export type Evaluation = {
    id: string; // composite key might be studentId_criteriaId_semester
    studentId: string;
    criteriaId: string;
    semester: string;
    score: number | null;
    observation?: string;
};


export type AttendanceReport = {
    // Define the structure for your reports here
};

export type TopAbsence = {
    studentId: string;
    studentName: string;
    departmentName: string;
    absenceCount: number;
};

export type DepartmentAbsence = {
    departmentId: string;
    departmentName: string;
    studentCount: number;
    absenceCount: number;
    absencePercentage: number;
}

export type GeneralStats = {
    totalStudents: number;
    totalDepartments: number;
    totalAbsences: number;
    totalAbsencePercentage: number;
    attendancePercentage: number;
    schoolDays: number;
    averageAbsencePerStudent: number;
    monthlyAbsenceDistribution: { name: string; total: number }[];
    weeklyAbsenceDistribution: { name: string; total: number }[];
    topAbsences: TopAbsence[];
    departmentAbsences: DepartmentAbsence[];
};
