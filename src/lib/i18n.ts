export const LANGS = ['th', 'en'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'th';

/** getStaticPaths helper for pages under src/pages/[lang]/. */
export const langPaths = () => LANGS.map((lang) => ({ params: { lang } }));

/**
 * Read a language-suffixed column (`title_th` / `title_en`).
 * English content is incomplete in the legacy DB, so empty values fall back to Thai.
 */
export function pick(row: Record<string, any> | undefined, field: string, lang: Lang): string {
  if (!row) return '';
  const value = row[`${field}_${lang}`];
  if (value != null && String(value).trim() !== '') return String(value);
  return String(row[`${field}_${DEFAULT_LANG}`] ?? '');
}

/** Equivalent of the legacy site_urls(): prefix a path with /{lang}/. */
export function url(lang: Lang, path = ''): string {
  if (/^(https?:)?\/\//.test(path) || path.startsWith('#') || path.startsWith('mailto:') || path.startsWith('tel:')) {
    return path;
  }
  const clean = path.replace(/^\/+/, '');
  return clean ? `/${lang}/${clean}` : `/${lang}`;
}

/** Same page in another language: swap the leading /{lang} segment. */
export function switchLang(pathname: string, to: Lang): string {
  const rest = pathname.replace(/^\/(th|en)(?=\/|$)/, '');
  return `/${to}${rest === '/' ? '' : rest}`;
}

/** UI strings. The legacy views hard-coded Thai; English is a fresh translation. */
const STRINGS = {
  th: {
    home: 'หน้าแรก',
    readMore: 'อ่านต่อ >>>',
    bookAppointment: 'จองคิวนัดรักษา',
    makeAppointment: 'ทำนัด',
    orderMedicine: 'สั่งยา',
    contactUs: 'ติดต่อเรา',
    freeConsult: 'ปรึกษาโดยไม่มีค่าใช้จ่าย',
    notFound: 'Data not found',
    prev: 'ก่อนหน้า',
    next: 'ถัดไป',
    cookieText: 'เว็บไซต์นี้ใช้คุกกี้เพื่อมอบประสบการณ์การใช้งานที่ดีที่สุดแก่ท่าน',
    cookieAccept: 'ยอมรับ',
  },
  en: {
    home: 'Home',
    readMore: 'Read more >>>',
    bookAppointment: 'Book an appointment',
    makeAppointment: 'Appointment',
    orderMedicine: 'Order medicine',
    contactUs: 'Contact us',
    freeConsult: 'Free consultation',
    notFound: 'Data not found',
    prev: 'Prev',
    next: 'Next',
    cookieText: 'This website uses cookies to give you the best experience.',
    cookieAccept: 'Accept',
  },
} satisfies Record<Lang, Record<string, string>>;

export type StringKey = keyof (typeof STRINGS)['th'];
export const t = (lang: Lang, key: StringKey) => STRINGS[lang][key] ?? STRINGS.th[key];
