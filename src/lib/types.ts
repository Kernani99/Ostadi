


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
  userId: string;
};

export type Department = {
  id: string;
  name: string;
  institutionId: string;
  level: string;
  userId: string;
};

export type Institution = {
  id:string;
  name: string;
  municipality: string;
  type?: string;
  userId: string;
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
    // Fields from old data structure for import
    school?: string;
    timeFrom?: string;
    timeTo?: string;
    content?: string;
    learning?: string;
    noteNumber?: string;
};

export type Attendance = {
  id: string; // e.g., studentId_yyyy-MM
  studentId: string;
  departmentId: string | null;
  institutionId: string;
  level: string;
  month: string; // "yyyy-MM" format
  records: { [week_session: string]: 'present' | 'absent' | 'justified' | 'no-outfit' };
  userId: string;
};

export type EvaluationCriteria = {
    id: string;
    name: string;
    description: string;
    competency: string;
    indicators: string[];
    maxScore: number;
    semester: string;
    userId: string;
};

export type Evaluation = {
    id: string; // composite key might be studentId_criteriaId_indicatorId_semester
    studentId: string;
    criteriaId: string;
    indicatorId: number;
    semester: string;
    level: string;
    institutionId: string;
    score: number | null;
    userId: string;
};

export type SessionEvaluation = {
    id: string; // studentId_yyyy-MM
    studentId: string;
    month: string; // "yyyy-MM"
    institutionId: string;
    level: string;
    scores: { [date_session: string]: number | null }; // e.g., "2024-09-01_1": 8.5
    userId: string;
};


export type Grade = {
    id: string;
    studentId: string;
    evaluationCriteriaId: string;
    grade: number;
    userId: string;
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

export type SportsEquipment = {
    id: string;
    name: string;
    totalQuantity: number;
    goodCondition: number;
    badCondition: number;
    userId: string;
};
    
export type TimetableEntry = {
    id: string; // Composite key: `${day}_${timeSlot}`
    userId: string;
    day: string;
    timeSlot: string;
    content: string;
};

    