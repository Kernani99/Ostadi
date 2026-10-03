
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
const firstYearSemester3Criteria: Omit<EvaluationCriteria, 'semester'>[] = [
    {
        id: 'crit_y1_s3_1',
        competency: 'التحكم في مبادئ اللعب الجماعي',
        name: 'المعيار 01',
        description: 'ضبط مسار الحركات تماشيا مع الفضاء المتاح',
        indicators: [
            'التعرف على ضوابط فضاءات الممارسة المتاحة',
            'استخدام فضاء الممارسة المناسب لمختلف التشكيلات والتنقلات',
            'التقيد بمعالم فضاء الممارسة المتاح',
        ],
        maxScore: 1.5
    },
    {
        id: 'crit_y1_s3_2',
        competency: 'التحكم في مبادئ اللعب الجماعي',
        name: 'المعيار 02',
        description: 'ترتيب الحركات حسب أولويتها بالنسبة للعملية',
        indicators: [
            'الاندماج في مختلف التشكيلات المنتظمة',
            'الاندماج في مختلف التشكيلات و التنقلات المنتظمة وفق معالم وقواعد فضاءات الممارسة المتاحة',
        ],
        maxScore: 1.5
    },
    {
        id: 'crit_y1_s3_3',
        competency: 'التحكم في مبادئ اللعب الجماعي',
        name: 'المعيار 03',
        description: 'التنفيذ المناسب للفضاء المتاح',
        indicators: [
            'التشكل والتنقل المناسب للرواق',
            'التشكل والتنقل المناسب للملعب',
            'التشكل والتنقل المناسب للفناء وللساحة',
            'التشكل والتنقل وفق الأعداد والصفوف والوسائل والأقران',
        ],
        maxScore: 1.5
    },
    {
        id: 'crit_y1_s3_4',
        competency: 'التحكم في مبادئ اللعب الجماعي',
        name: 'المعيار 04',
        description: 'القيام بحركات لتمكين الزملاء من استثمار الفضاء',
        indicators: [
            'الالتزام بضوابط ومعالم وقواعد فضاءات الممارسة عند استخدامها',
            'التفاعل مع التشكيلات والتنقلات المنتظمة دون إحداث ضرر بفضاء الممارسة',
            'مشاركة زملائه مختلف فضاءات الممارسة ويحافظ عليها',
        ],
        maxScore: 1.5
    },
    {
        id: 'crit_y1_s3_5',
        competency: 'مشاركة التلميذ في الفوج التربوي',
        name: 'المعيار 05',
        description: '',
        indicators: ['التفاعل', 'المبادرة', 'الالتزام بالتعليمات', 'انجاز المهام'],
        maxScore: 4
    },
];


// --- 2nd Year Criteria ---
const secondYearSemester2Criteria: Omit<EvaluationCriteria, 'semester'>[] = [
    { id: 'crit_y2_s2_1', competency: 'التحكم في مختلف وضعيات الجسم', name: 'المعيار 01', description: 'اختيار الحركات المناسبة للوضعية. بشكل سليم.', indicators: ['المشي السريع من وضعية الوقوف', 'الجري من وضعية الجلوس', 'الجري السريع من وضعية الجثو'], maxScore: 1.5 },
    { id: 'crit_y2_s2_2', competency: 'التحكم في مختلف وضعيات الجسم', name: 'المعيار 02', description: 'تنفيذ الحركات المناسبة للوضعية', indicators: ['الاعتدال في المشي السريع من وضعية الوقوف', 'عمل الأطراف أثناء الجري من وضعية الجلوس', 'تكامل عمل الأطراف العلوية والسفلية أثناء الجري السريع'], maxScore: 1.5 },
    { id: 'crit_y2_s2_3', competency: 'التحكم في مختلف وضعيات الجسم', name: 'المعيار 03', description: 'تعديل الوضعيات حسب تجدد الوضعية.', indicators: ['الاعتدال في الوقوف بعد التوقف من المشي السريع من الوقوف', 'التوازن في الوقوف للهرولة بعد الجلوس', 'الاستقامة في الجري السريع بعد الجثو'], maxScore: 1.5 },
    { id: 'crit_y2_s2_4', competency: 'التحكم في مختلف وضعيات الجسم', name: 'المعيار 04', description: 'المحافظة على تسلسل الحركات خلال التنفيذ.', indicators: ['الجري بخطوات متناسقة', 'الهرولة بخطوات مرتفعة', 'المحافظة على السرعة خلال تنفيذ الجري السريع'], maxScore: 1.5 },
    { id: 'crit_y2_s2_5', competency: 'مشاركة التلميذ في الفوج التربوي', name: 'المعيار 05', description: '', indicators: ['المبادرة', 'التفاعل', 'انجاز المهام', 'الالتزام بالتعليمات'], maxScore: 4 },
];
const secondYearSemester1Criteria = secondYearSemester2Criteria.map(c => ({...c, id: c.id.replace('s2', 's1')}));
const secondYearSemester3Criteria: Omit<EvaluationCriteria, 'semester'>[] = [
    {
        id: 'crit_y2_s3_1',
        competency: 'التحكم في مبادئ اللعب الجماعي',
        name: 'المعيار 01',
        description: 'ضبط أسلوب التنفيذ حسب نوع الأداة',
        indicators: [
            'رمي الدحرجة للجلة وتخزينها في مكان مناسب',
            'استلام وتسليم الشواهد وترتيب الأقماع',
            'الرمي القريب والبعيد والأمامي والجانبي للكور'
        ],
        maxScore: 1.5
    },
    {
        id: 'crit_y2_s3_2',
        competency: 'التحكم في مبادئ اللعب الجماعي',
        name: 'المعيار 02',
        description: 'ضبط معالم الفضاء المناسب للتنفيذ',
        indicators: [
            'رمي الدحرجة للجلة في فناء',
            'استلام وتسليم الشواهد في رواق',
            'الرمي القريب للكور في ملعب والرمي الجانبي في رواق'
        ],
        maxScore: 1.5
    },
    {
        id: 'crit_y2_s3_3',
        competency: 'التحكم في مبادئ اللعب الجماعي',
        name: 'المعيار 03',
        description: 'تكييف الأسلوب حسب تجدد فضاء الممارسة',
        indicators: [
            'رمي الدحرجة للجلة في فناء والرمي الأمامي للجلة في ساحة',
            'استلام وتسليم الشواهد في رواق وترتيبها في فناء',
            'الرمي القريب للكور في ملعب والرمي البعيد للكور في ساحة'
        ],
        maxScore: 1.5
    },
    {
        id: 'crit_y2_s3_4',
        competency: 'التحكم في مبادئ اللعب الجماعي',
        name: 'المعيار 04',
        description: 'التنفيذ المناسب في الوقت المناسب',
        indicators: [
            'رمي الدحرجة للجلة عند سماع الإيعاز',
            'استلام الشاهد عند وصول قرينه وتسليم الشاهد للقرين عند الوصول',
            'الرمي القريب للكور عند اقتراب الزميل والرمي البعيد للكور عند ابتعاد الزميل'
        ],
        maxScore: 1.5
    },
    {
        id: 'crit_y2_s3_5',
        competency: 'مشاركة التلميذ في الفوج التربوي',
        name: 'المعيار 05',
        description: '',
        indicators: ['التفاعل', 'المبادرة', 'الالتزام بالتعليمات', 'انجاز المهام'],
        maxScore: 4
    },
];

// --- 3rd Year Criteria ---
const thirdYearSemester2Criteria: Omit<EvaluationCriteria, 'semester'>[] = [
    { id: 'crit_y3_s2_1', competency: 'التحكم في مختلف وضعيات الجسم', name: 'المعيار 01', description: 'اختيار وتيرة الجري المناسبة للموقف', indicators: ['الجري بوتيرة بطيئة', 'الجري بوتيرة متوسطة', 'الجري بوتيرة سريعة'], maxScore: 1.5 },
    { id: 'crit_y3_s2_2', competency: 'التحكم في مختلف وضعيات الجسم', name: 'المعيار 02', description: 'التحكم في وضعية وتنسيق الجسم خلال الجري', indicators: ['الجري على خط مستقيم', 'الجري في منعرج', 'الجري المتعرج بحمل أداة'], maxScore: 1.5 },
    { id: 'crit_y3_s2_3', competency: 'التحكم في مختلف وضعيات الجسم', name: 'المعيار 03', description: 'اختيار وتيرة مناسبة للرمي', indicators: ['الرمي للأمام والخلف', 'الرمي بيد واحدة و باليدين', 'الرمي للجانب'], maxScore: 1.5 },
    { id: 'crit_y3_s2_4', competency: 'التحكم في مختلف وضعيات الجسم', name: 'المعيار 04', description: 'المحافظة على تسلسل عملية الرمي', indicators: ['الرمي إلى أبعد', 'الرمي إلى مكان معين', 'الرمي فوق علو معين'], maxScore: 1.5 },
    { id: 'crit_y3_s2_5', competency: 'مشاركة التلميذ في الفوج التربوي', name: 'المعيار 05', description: '', indicators: ['التفاعل', 'المبادرة', 'الالتزام بالتعليمات', 'انجاز المهام'], maxScore: 4 },
];
const thirdYearSemester1Criteria = thirdYearSemester2Criteria.map(c => ({...c, id: c.id.replace('s2', 's1')}));
const thirdYearSemester3Criteria: Omit<EvaluationCriteria, 'semester'>[] = [
    {
        id: 'crit_y3_s3_1',
        competency: 'التحكم في مبادئ اللعب الجماعي',
        name: 'المعيار 01',
        description: 'اختيار التصرفات المناسبة للموقف وللفضاء.',
        indicators: [
            'زيادة في السرعة واللحاق بالزميل',
            'تغيير الاتجاه عند مواجهة حاجز وفي فضاء ضيق',
            'الإفلات للتخلص من المنافس عند المطاردة',
            'الانتقال بين المعالم حسب طبيعة فضاء الممارسة'
        ],
        maxScore: 1.5
    },
    {
        id: 'crit_y3_s3_2',
        competency: 'التحكم في مبادئ اللعب الجماعي',
        name: 'المعيار 02',
        description: 'ادراك فضاء الممارسة.',
        indicators: [
            'الجري في رواق بسرعة للوصول أولا إلى خط النهاية',
            'الرمي لعلو معين في ملعب محدد',
            'الانتقال بين المعالم في حدود فضاء الممارسة'
        ],
        maxScore: 1.5
    },
    {
        id: 'crit_y3_s3_3',
        competency: 'التحكم في مبادئ اللعب الجماعي',
        name: 'المعيار 03',
        description: 'حسن التمركز في فضاء الممارسة.',
        indicators: [
            'رمي الكرة لمكان معين حسب وضعية الزميل المستلم',
            'تغيير الاتجاه حسب وضعية المنافس في الفناء',
            'الجري المتعرج بسرعة في رواق للافلات من المنافس عند المطاردة بحمل أداة'
        ],
        maxScore: 1.5
    },
    {
        id: 'crit_y3_s3_4',
        competency: 'التحكم في مبادئ اللعب الجماعي',
        name: 'المعيار 04',
        description: 'استثمار الوضعيات والحركات القاعدية في بناء خطط تتماشى وفضاء الممارسة.',
        indicators: [
            'الوثب إلى الأعلى لاجتياز موانع باستعمال كرسي',
            'الرمي في حدود فضاء معين ولمكان معين وعلى بعد معين'
        ],
        maxScore: 1.5
    },
    {
        id: 'crit_y3_s3_5',
        competency: 'مشاركة التلميذ في الفوج التربوي',
        name: 'المعيار 05',
        description: '',
        indicators: ['التفاعل', 'المبادرة', 'الالتزام بالتعليمات', 'انجاز المهام'],
        maxScore: 4
    },
];

// --- 4th Year Criteria ---
const fourthYearSemester2Criteria: Omit<EvaluationCriteria, 'semester'>[] = [
    { id: 'crit_y4_s2_1', competency: 'التحكم في مختلف وضعيات الجسم', name: 'المعيار 01', description: 'تحديد نوعية حركة الوثب حسب الموقف', indicators: ['الوثب برجل واحدة وبالرجلين', 'الوثب للأمام وللأعلى', 'الوثب فتحا وضما'], maxScore: 1.5 },
    { id: 'crit_y4_s2_2', competency: 'التحكم في مختلف وضعيات الجسم', name: 'المعيار 02', description: 'تسلسل سريان حركة الوثب خلال التنفيذ', indicators: ['وثبات متتالية بالرجلين معا', 'وثبات متتالية برجل واحدة', 'وثبات متتالية بتبادل الرجلين'], maxScore: 1.5 },
    { id: 'crit_y4_s2_3', competency: 'التحكم في مختلف وضعيات الجسم', name: 'المعيار 03', description: 'تحديد نوعية حركة الرمي حسب الموقف', indicators: ['الرمي من ثبات ومن حركة', 'الرمي بيد واحدة وباليدين', 'الرمي للخلف وللجانب'], maxScore: 1.5 },
    { id: 'crit_y4_s2_4', competency: 'التحكم في مختلف وضعيات الجسم', name: 'المعيار 04', description: 'تسلسل سريان حركة الرمي خلال التنفيذ', indicators: ['ربط الوثب بالرمي', 'أخذ مسافة الاقتراب', 'تسلسل الرمي خلال التنفيذ'], maxScore: 1.5 },
    { id: 'crit_y4_s2_5', competency: 'مشاركة التلميذ في الفوج التربوي', name: 'المعيار 05', description: '', indicators: ['التفاعل', 'المبادرة', 'الالتزام بالتعليمات', 'انجاز المهام'], maxScore: 4 },
];
const fourthYearSemester1Criteria = fourthYearSemester2Criteria.map(c => ({...c, id: c.id.replace('s2', 's1')}));
const fourthYearSemester3Criteria: Omit<EvaluationCriteria, 'semester'>[] = [
    {
        id: 'crit_y4_s3_1',
        competency: 'التحكم في مبادئ اللعب الجماعي',
        name: 'المعيار 01',
        description: 'ضبط التصرفات حسب فضاء الممارسة',
        indicators: [
            'التنقل حسب حدود الرواق',
            'الوثب للأمام وللأعلى حسب طول الفناء',
            'الرمي حسب مجال الملعب المتاح',
        ],
        maxScore: 1.5
    },
    {
        id: 'crit_y4_s3_2',
        competency: 'التحكم في مبادئ اللعب الجماعي',
        name: 'المعيار 02',
        description: 'اختيار الحركات القاعدية المناسبة للموقف',
        indicators: [
            'وثبات متتالية برجل واحدة وبالرجلين معا',
            'التنقل في مسار معين حسب حدود فضاء الممارسة',
            'الرمي البعيد حسب مسافة الهدف',
        ],
        maxScore: 1.5
    },
    {
        id: 'crit_y4_s3_3',
        competency: 'التحكم في مبادئ اللعب الجماعي',
        name: 'المعيار 03',
        description: 'تعديل التصرفات حسب تغير الموقف',
        indicators: [
            'التنقل حسب انتشار الزملاء والمنافس',
            'الرمي حسب انتشار الزملاء والمنافس',
        ],
        maxScore: 1.5
    },
    {
        id: 'crit_y4_s3_4',
        competency: 'التحكم في مبادئ اللعب الجماعي',
        name: 'المعيار 04',
        description: 'التنفيذ السليم للحركات المختارة',
        indicators: [
            'الوثب حسب مسافة ومسار الوثبة',
            'التنقل السليم في فضاء آمن',
            'الرمي بطريقة صحيحة في مجال الرمي',
            'هيأة الجسم خلال الوثب'
        ],
        maxScore: 1.5
    },
    {
        id: 'crit_y4_s3_5',
        competency: 'مشاركة التلميذ في الفوج التربوي',
        name: 'المعيار 05',
        description: '',
        indicators: [
            'التفاعل',
            'المبادرة',
            'الالتزام بالتعليمات',
            'انجاز المهام'
        ],
        maxScore: 4
    }
];

// --- 5th Year Criteria ---
const fifthYearSemester2Criteria: Omit<EvaluationCriteria, 'semester'>[] = [
    { id: 'crit_y5_s2_1', competency: 'التحكم في مختلف وضعيات الجسم', name: 'المعيار 01', description: 'اختيار نوعية الجري حسب الموقف', indicators: ['الجري السريع', 'تواتر الخطوات', 'تنسيق عمل الأطراف والاجتياز'], maxScore: 1.5 },
    { id: 'crit_y5_s2_2', competency: 'التحكم في مختلف وضعيات الجسم', name: 'المعيار 02', description: 'اختيار نوعية الوثب حسب الموقف', indicators: ['يتخذ أسلوب الوثب', 'الدفع المناسب لنوع الوثب', 'استثمار الجري في الوثب'], maxScore: 1.5 },
    { id: 'crit_y5_s2_3', competency: 'التحكم في مختلف وضعيات الجسم', name: 'المعيار 03', description: 'اختيار نوعية الرمي حسب الموقف', indicators: ['التعرف على مراحل الرمي', 'أسلوب الرمي من وضعيات مختلفة', 'استثمار الجري في الرمي'], maxScore: 1.5 },
    { id: 'crit_y5_s2_4', competency: 'التحكم في مختلف وضعيات الجسم', name: 'المعيار 04', description: 'التنسيق السليم بين الجري والوثب والرمي', indicators: ['استثمار الجري في الوثب', 'الربط بين الحركات القاعدية'], maxScore: 1.5 },
    { id: 'crit_y5_s2_5', competency: 'مشاركة التلميذ في الفوج التربوي', name: 'المعيار 05', description: '', indicators: ['التفاعل', 'المبادرة', 'الالتزام بالتعليمات', 'انجاز المهام'], maxScore: 4 },
];
const fifthYearSemester1Criteria = fifthYearSemester2Criteria.map(c => ({...c, id: c.id.replace('s2', 's1')}));
const fifthYearSemester3Criteria: Omit<EvaluationCriteria, 'semester'>[] = [
    {
        id: 'crit_y5_s3_1',
        competency: 'التحكم في مبادئ اللعب الجماعي',
        name: 'المعيار 01',
        description: 'اختيار الوضعيات والحركات المناسبة للموقف',
        indicators: [
            'التمريرة القصيرة من وضعية الوقوف الأمامي',
            'ثني الركبتين للارتقاء عند قذف الكرة نحو الهدف',
            'الاعتدال في الوقوف ورفع الرأس عند مراوغة المنافس'
        ],
        maxScore: 1.5
    },
    {
        id: 'crit_y5_s3_2',
        competency: 'التحكم في مبادئ اللعب الجماعي',
        name: 'المعيار 02',
        description: 'التحكم في ضبط معالم التنفيذ والمحافظة على التوازن',
        indicators: [
            'التحكم في الكرة عند تمريرها والمراوغة بها',
            'التوازن عند قذف الكرة',
            'الدفع المناسب لنوع الوثب'
        ],
        maxScore: 1.5
    },
    {
        id: 'crit_y5_s3_3',
        competency: 'التحكم في مبادئ اللعب الجماعي',
        name: 'المعيار 03',
        description: 'ضبط فضاء الممارسة',
        indicators: [
            'التعرف على الملعب وأطواله',
            'الالتزام بحدود بملعب كرة اليد المصغرة',
            'التقيد بملعب كرة السلة المصغرة'
        ],
        maxScore: 1.5
    },
    {
        id: 'crit_y5_s3_4',
        competency: 'التحكم في مبادئ اللعب الجماعي',
        name: 'المعيار 04',
        description: 'المساهمة الفعالة ضمن الفوج',
        indicators: [
            'التوزيع المنظم على الملعب',
            'احترام قواعد اللعب الجماعي',
            'توظيف التقنيات الأساسية للألعاب الجماعية ضمن الفوج'
        ],
        maxScore: 1.5
    },
    {
        id: 'crit_y5_s3_5',
        competency: 'مشاركة التلميذ في الفوج التربوي',
        name: 'المعيار 05',
        description: '',
        indicators: [
            'التفاعل',
            'المبادرة',
            'الالتزام بالتعليمات',
            'انجاز المهام'
        ],
        maxScore: 4
    }
];


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

    
