import type { Lang } from '../../lib/i18n';

/** UI strings for the self-assessment pages (legacy views hard-coded Thai). */
export const A = {
  th: {
    listCrumb: 'ทำแบบประเมิน',
    listTitle: 'แบบทดสอบที่สามารถทำได้ด้วยตนเอง',
    test: 'แบบทดสอบ',
    submit: 'ส่งคำตอบ',
    required: 'กรุณาเลือกคำตอบ',
    resultTitle: 'ผลการทดสอบ',
    totalScore: 'รวมผลคะแนน',
    none: 'ไม่มีอาการ',
    severe: 'รุนแรง',
    advice: 'ข้อแนะนำในการดูแล',
    consult: 'ปรึกษาเรา',
    recommended: 'บริการที่แนะนำ',
  },
  en: {
    listCrumb: 'Self-assessment',
    listTitle: 'Self-assessment tests',
    test: 'Assessment',
    submit: 'Submit answers',
    required: 'Please choose an answer',
    resultTitle: 'Your result',
    totalScore: 'Total score',
    none: 'No symptoms',
    severe: 'Severe',
    advice: 'Care recommendations',
    consult: 'Talk to us',
    recommended: 'Recommended services',
  },
} satisfies Record<Lang, Record<string, string>>;

/** Legacy Assessment::$defaultAnswers, used when a question has no answers of its own. */
export const DEFAULT_ANSWERS = [
  { title_th: 'ไม่มีเลย', title_en: '', score: 0 },
  { title_th: 'บางวัน', title_en: '', score: 1 },
  { title_th: 'เป็นบ่อย', title_en: '', score: 2 },
  { title_th: 'ทุกวัน', title_en: '', score: 3 },
];

/** Legacy $percentageThresholds: case => minimum score percentage (inclusive). */
export const PERCENT_THRESHOLDS: [number, number][] = [
  [1, 0],
  [2, 20],
  [3, 40],
  [4, 60],
  [5, 80],
];

/** Per-case colours from chivacare.css (section[data-case="n"] ...). */
export const CASE_COLORS: Record<number, { bg: string; accent: string }> = {
  1: { bg: '#e3f5f7', accent: '#79cfda' },
  2: { bg: '#e2efe8', accent: '#6bae8f' },
  3: { bg: '#ffebca', accent: '#f8ac1b' },
  4: { bg: '#faecdf', accent: '#e89e61' },
  5: { bg: '#f9dddc', accent: '#db5451' },
};
