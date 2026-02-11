
import type { EvaluationCriteria } from './types';

type LevelCriteria = {
    [semester: string]: EvaluationCriteria[];
}

type AllCriteria = {
    [level: string]: LevelCriteria;
    default: LevelCriteria;
}

const defaultCriteria: Omit<EvaluationCriteria, 'semester'>[] = [
  { id: 'crit_default_1', competency: 'التحكم في مختلف وضعيات الجسم', name: 'المعيار 01', description: '', indicators: ['المؤشر 1', 'المؤشر 2', 'المؤشر 3'], maxScore: 2 },
  { id: 'crit_default_2', competency: 'التحكم في مختلف وضعيات الجسم', name: 'المعيار 02', description: '', indicators: ['المؤشر 1', 'المؤشر 2', 'المؤشر 3', 'المؤشر 4'], maxScore: 2 },
  { id: 'crit_default_3', competency: 'التحكم في مختلف وضعيات الجسم', name: 'المعيار 03', description: '', indicators: ['المؤشر 1', 'المؤشر 2', 'المؤشر 3', 'المؤشر 4'], maxScore: 2 },
  { id: 'crit_default_4', competency: 'مشاركة التلميذ في الفوج التربوي', name: 'المعيار 04', description: '', indicators: ['التفاعل', 'المبادرة', 'الالتزام بالتعليمات', 'إنجاز المهام'], maxScore: 4 },
];

const firstYearSemester2Criteria: Omit<EvaluationCriteria, 'semester'>[] = [
    { id: 'crit_y1_s2_1', competency: 'التحكم في مختلف وضعيات الجسم', name: 'المعيار 01', description: 'اختيار الحركات القاعدية المناسبة للموقف', indicators: ['المشي بوتيرة بطيئة أو متوسطة أو سريعة', 'الجري الفردي بوتيرة بطيئة أو متوسطة أو سريعة', 'الجري الثنائي بوتيرة بطيئة أو متوسطة أو سريعة'], maxScore: 1.5 },
    { id: 'crit_y1_s2_2', competency: 'التحكم في مختلف وضعيات الجسم', name: 'المعيار 02', description: 'تنسيق وظائف جسمه حسب نوع الحركة المطلوبة', indicators: ['اعتدال الجسم خلال المشي والجري', 'التنسيق بين الأطراف العلوية والسفلية أثناء الجري والمشي', 'تواتر الخطوات و تنسيق عمل الأطراف خلال الجري والمشي'], maxScore: 1.5 },
    { id: 'crit_y1_s2_3', competency: 'التحكم في مختلف وضعيات الجسم', name: 'المعيار 03', description: 'التنفيذ المناسب في الوقت المناسب', indicators: ['التحول من المشي للمشي الجانبي', 'التحول من المشي للجري تدريجيا', 'التحول من الجري للمشي تدريجيا'], maxScore: 1.5 },
    { id: 'crit_y1_s2_4', competency: 'التحكم في مختلف وضعيات الجسم', name: 'المعيار 04', description: 'المحافظة على التوازن خلال التنفيذ', indicators: ['الاعتدال عند التحول من المشي العادي للمشي الجانبي', 'الاعتدال عند التحول من المشي للجري', 'الاعتدال عند التحول من الجري للمشي'], maxScore: 1.5 },
    { id: 'crit_y1_s2_5', competency: 'مشاركة التلميذ في الفوج التربوي', name: 'المعيار 05', description: '', indicators: ['التفاعل', 'المبادرة', 'الالتزام بالتعليمات', 'انجاز المهام'], maxScore: 4 },
];

const firstYearSemester1Criteria = firstYearSemester2Criteria.map(c => ({...c, id: c.id.replace('s2', 's1')}));
const firstYearSemester3Criteria = firstYearSemester2Criteria.map(c => ({...c, id: c.id.replace('s2', 's3')}));

const ALL_CRITERIA: AllCriteria = {
  'أولى ابتدائي': {
    '1': firstYearSemester1Criteria.map(c => ({...c, semester: '1'})),
    '2': firstYearSemester2Criteria.map(c => ({...c, semester: '2'})),
    '3': firstYearSemester3Criteria.map(c => ({...c, semester: '3'})),
  },
  'default': {
    '1': defaultCriteria.map(c => ({...c, semester: '1'})),
    '2': defaultCriteria.map(c => ({...c, semester: '2'})),
    '3': defaultCriteria.map(c => ({...c, semester: '3'})),
  }
};

export const getCriteriaFor = (level: string, semester: string): EvaluationCriteria[] => {
    return ALL_CRITERIA[level]?.[semester] ?? ALL_CRITERIA.default[semester] ?? [];
}
