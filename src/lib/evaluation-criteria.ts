
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

// --- 1st Year Criteria ---
const firstYearSemester2Criteria: Omit<EvaluationCriteria, 'semester'>[] = [
    { id: 'crit_y1_s2_1', competency: 'التحكم في مختلف وضعيات الجسم', name: 'المعيار 01', description: 'اختيار الحركات القاعدية المناسبة للموقف', indicators: ['المشي بوتيرة بطيئة أو متوسطة أو سريعة', 'الجري الفردي بوتيرة بطيئة أو متوسطة أو سريعة', 'الجري الثنائي بوتيرة بطيئة أو متوسطة أو سريعة'], maxScore: 1.5 },
    { id: 'crit_y1_s2_2', competency: 'التحكم في مختلف وضعيات الجسم', name: 'المعيار 02', description: 'تنسيق وظائف جسمه حسب نوع الحركة المطلوبة', indicators: ['اعتدال الجسم خلال المشي والجري', 'التنسيق بين الأطراف العلوية والسفلية أثناء الجري والمشي', 'تواتر الخطوات و تنسيق عمل الأطراف خلال الجري والمشي'], maxScore: 1.5 },
    { id: 'crit_y1_s2_3', competency: 'التحكم في مختلف وضعيات الجسم', name: 'المعيار 03', description: 'التنفيذ المناسب في الوقت المناسب', indicators: ['التحول من المشي للمشي الجانبي', 'التحول من المشي للجري تدريجيا', 'التحول من الجري للمشي تدريجيا'], maxScore: 1.5 },
    { id: 'crit_y1_s2_4', competency: 'التحكم في مختلف وضعيات الجسم', name: 'المعيار 04', description: 'المحافظة على التوازن خلال التنفيذ', indicators: ['الاعتدال عند التحول من المشي العادي للمشي الجانبي', 'الاعتدال عند التحول من المشي للجري', 'الاعتدال عند التحول من الجري للمشي'], maxScore: 1.5 },
    { id: 'crit_y1_s2_5', competency: 'مشاركة التلميذ في الفوج التربوي', name: 'المعيار 05', description: '', indicators: ['التفاعل', 'المبادرة', 'الالتزام بالتعليمات', 'انجاز المهام'], maxScore: 4 },
];
const firstYearSemester1Criteria = firstYearSemester2Criteria.map(c => ({...c, id: c.id.replace('s2', 's1')}));
const firstYearSemester3Criteria = firstYearSemester2Criteria.map(c => ({...c, id: c.id.replace('s2', 's3')}));


// --- 2nd Year Criteria ---
const secondYearSemester2Criteria: Omit<EvaluationCriteria, 'semester'>[] = [
    { id: 'crit_y2_s2_1', competency: 'التحكم في مختلف وضعيات الجسم', name: 'المعيار 01', description: 'اختيار الحركات المناسبة للوضعية. بشكل سليم.', indicators: ['المشي السريع من وضعية الوقوف', 'الجري من وضعية الجلوس', 'الجري السريع من وضعية الجثو'], maxScore: 1.5 },
    { id: 'crit_y2_s2_2', competency: 'التحكم في مختلف وضعيات الجسم', name: 'المعيار 02', description: 'تنفيذ الحركات المناسبة للوضعية', indicators: ['الاعتدال في المشي السريع من وضعية الوقوف', 'عمل الأطراف أثناء الجري من وضعية الجلوس', 'تكامل عمل الأطراف العلوية والسفلية أثناء الجري السريع'], maxScore: 1.5 },
    { id: 'crit_y2_s2_3', competency: 'التحكم في مختلف وضعيات الجسم', name: 'المعيار 03', description: 'تعديل الوضعيات حسب تجدد الوضعية.', indicators: ['الاعتدال في الوقوف بعد التوقف من المشي السريع من الوقوف', 'التوازن في الوقوف للهرولة بعد الجلوس', 'الاستقامة في الجري السريع بعد الجثو'], maxScore: 1.5 },
    { id: 'crit_y2_s2_4', competency: 'التحكم في مختلف وضعيات الجسم', name: 'المعيار 04', description: 'المحافظة على تسلسل الحركات خلال التنفيذ.', indicators: ['الجري بخطوات متناسقة', 'الهرولة بخطوات مرتفعة', 'المحافظة على السرعة خلال تنفيذ الجري السريع'], maxScore: 1.5 },
    { id: 'crit_y2_s2_5', competency: 'مشاركة التلميذ في الفوج التربوي', name: 'المعيار 05', description: '', indicators: ['المبادرة', 'التفاعل', 'انجاز المهام', 'الالتزام بالتعليمات'], maxScore: 4 },
];
const secondYearSemester1Criteria = secondYearSemester2Criteria.map(c => ({...c, id: c.id.replace('s2', 's1')}));
const secondYearSemester3Criteria = secondYearSemester2Criteria.map(c => ({...c, id: c.id.replace('s2', 's3')}));

// --- 3rd Year Criteria ---
const thirdYearSemester2Criteria: Omit<EvaluationCriteria, 'semester'>[] = [
    { id: 'crit_y3_s2_1', competency: 'التحكم في مختلف وضعيات الجسم', name: 'المعيار 01', description: 'اختيار وتيرة الجري المناسبة للموقف', indicators: ['الجري بوتيرة بطيئة', 'الجري بوتيرة متوسطة', 'الجري بوتيرة سريعة'], maxScore: 1.5 },
    { id: 'crit_y3_s2_2', competency: 'التحكم في مختلف وضعيات الجسم', name: 'المعيار 02', description: 'التحكم في وضعية وتنسيق الجسم خلال الجري', indicators: ['الجري على خط مستقيم', 'الجري في منعرج', 'الجري المتعرج بحمل أداة'], maxScore: 1.5 },
    { id: 'crit_y3_s2_3', competency: 'التحكم في مختلف وضعيات الجسم', name: 'المعيار 03', description: 'اختيار وتيرة مناسبة للرمي', indicators: ['الرمي للأمام والخلف', 'الرمي بيد واحدة و باليدين', 'الرمي للجانب'], maxScore: 1.5 },
    { id: 'crit_y3_s2_4', competency: 'التحكم في مختلف وضعيات الجسم', name: 'المعيار 04', description: 'المحافظة على تسلسل عملية الرمي', indicators: ['الرمي إلى أبعد', 'الرمي إلى مكان معين', 'الرمي فوق علو معين'], maxScore: 1.5 },
    { id: 'crit_y3_s2_5', competency: 'مشاركة التلميذ في الفوج التربوي', name: 'المعيار 05', description: '', indicators: ['التفاعل', 'المبادرة', 'الالتزام بالتعليمات', 'انجاز المهام'], maxScore: 4 },
];
const thirdYearSemester1Criteria = thirdYearSemester2Criteria.map(c => ({...c, id: c.id.replace('s2', 's1')}));
const thirdYearSemester3Criteria = thirdYearSemester2Criteria.map(c => ({...c, id: c.id.replace('s2', 's3')}));

// --- 4th Year Criteria ---
const fourthYearSemester2Criteria: Omit<EvaluationCriteria, 'semester'>[] = [
    { id: 'crit_y4_s2_1', competency: 'التحكم في مختلف وضعيات الجسم', name: 'المعيار 01', description: 'تحديد نوعية حركة الوثب حسب الموقف', indicators: ['الوثب برجل واحدة وبالرجلين', 'الوثب للأمام وللأعلى', 'الوثب فتحا وضما'], maxScore: 1.5 },
    { id: 'crit_y4_s2_2', competency: 'التحكم في مختلف وضعيات الجسم', name: 'المعيار 02', description: 'تسلسل سريان حركة الوثب خلال التنفيذ', indicators: ['وثبات متتالية بالرجلين معا', 'وثبات متتالية برجل واحدة', 'وثبات متتالية بتبادل الرجلين'], maxScore: 1.5 },
    { id: 'crit_y4_s2_3', competency: 'التحكم في مختلف وضعيات الجسم', name: 'المعيار 03', description: 'تحديد نوعية حركة الرمي حسب الموقف', indicators: ['الرمي من ثبات ومن حركة', 'الرمي بيد واحدة وباليدين', 'الرمي للخلف وللجانب'], maxScore: 1.5 },
    { id: 'crit_y4_s2_4', competency: 'التحكم في مختلف وضعيات الجسم', name: 'المعيار 04', description: 'تسلسل سريان حركة الرمي خلال التنفيذ', indicators: ['ربط الوثب بالرمي', 'أخذ مسافة الاقتراب', 'تسلسل الرمي خلال التنفيذ'], maxScore: 1.5 },
    { id: 'crit_y4_s2_5', competency: 'مشاركة التلميذ في الفوج التربوي', name: 'المعيار 05', description: '', indicators: ['التفاعل', 'المبادرة', 'الالتزام بالتعليمات', 'انجاز المهام'], maxScore: 4 },
];
const fourthYearSemester1Criteria = fourthYearSemester2Criteria.map(c => ({...c, id: c.id.replace('s2', 's1')}));
const fourthYearSemester3Criteria = fourthYearSemester2Criteria.map(c => ({...c, id: c.id.replace('s2', 's3')}));

// --- 5th Year Criteria ---
const fifthYearSemester2Criteria: Omit<EvaluationCriteria, 'semester'>[] = [
    { id: 'crit_y5_s2_1', competency: 'التحكم في مختلف وضعيات الجسم', name: 'المعيار 01', description: 'اختيار نوعية الجري حسب الموقف', indicators: ['الجري السريع', 'تواتر الخطوات', 'تنسيق عمل الأطراف والاجتياز'], maxScore: 1.5 },
    { id: 'crit_y5_s2_2', competency: 'التحكم في مختلف وضعيات الجسم', name: 'المعيار 02', description: 'اختيار نوعية الوثب حسب الموقف', indicators: ['يتخذ أسلوب الوثب', 'الدفع المناسب لنوع الوثب', 'استثمار الجري في الوثب'], maxScore: 1.5 },
    { id: 'crit_y5_s2_3', competency: 'التحكم في مختلف وضعيات الجسم', name: 'المعيار 03', description: 'اختيار نوعية الرمي حسب الموقف', indicators: ['التعرف على مراحل الرمي', 'أسلوب الرمي من وضعيات مختلفة', 'استثمار الجري في الرمي'], maxScore: 1.5 },
    { id: 'crit_y5_s2_4', competency: 'التحكم في مختلف وضعيات الجسم', name: 'المعيار 04', description: 'التنسيق السليم بين الجري والوثب والرمي', indicators: ['استثمار الجري في الوثب', 'الربط بين الحركات القاعدية'], maxScore: 1.5 },
    { id: 'crit_y5_s2_5', competency: 'مشاركة التلميذ في الفوج التربوي', name: 'المعيار 05', description: '', indicators: ['التفاعل', 'المبادرة', 'الالتزام بالتعليمات', 'انجاز المهام'], maxScore: 4 },
];
const fifthYearSemester1Criteria = fifthYearSemester2Criteria.map(c => ({...c, id: c.id.replace('s2', 's1')}));
const fifthYearSemester3Criteria = fifthYearSemester2Criteria.map(c => ({...c, id: c.id.replace('s2', 's3')}));


const ALL_CRITERIA: AllCriteria = {
  'أولى ابتدائي': {
    '1': firstYearSemester1Criteria.map(c => ({...c, semester: '1'})),
    '2': firstYearSemester2Criteria.map(c => ({...c, semester: '2'})),
    '3': firstYearSemester3Criteria.map(c => ({...c, semester: '3'})),
  },
  'ثانية ابتدائي': {
    '1': secondYearSemester1Criteria.map(c => ({...c, semester: '1'})),
    '2': secondYearSemester2Criteria.map(c => ({...c, semester: '2'})),
    '3': secondYearSemester3Criteria.map(c => ({...c, semester: '3'})),
  },
   'ثالثة ابتدائي': {
    '1': thirdYearSemester1Criteria.map(c => ({...c, semester: '1'})),
    '2': thirdYearSemester2Criteria.map(c => ({...c, semester: '2'})),
    '3': thirdYearSemester3Criteria.map(c => ({...c, semester: '3'})),
  },
  'رابعة ابتدائي': {
    '1': fourthYearSemester1Criteria.map(c => ({...c, semester: '1'})),
    '2': fourthYearSemester2Criteria.map(c => ({...c, semester: '2'})),
    '3': fourthYearSemester3Criteria.map(c => ({...c, semester: '3'})),
  },
  'خامسة ابتدائي': {
    '1': fifthYearSemester1Criteria.map(c => ({...c, semester: '1'})),
    '2': fifthYearSemester2Criteria.map(c => ({...c, semester: '2'})),
    '3': fifthYearSemester3Criteria.map(c => ({...c, semester: '3'})),
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
